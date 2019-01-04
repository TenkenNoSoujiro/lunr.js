/*!
 * lunr.Builder
 * Copyright (C) @YEAR Oliver Nightingale
 */

// @ts-ignore
namespace lunr {
  /**
   * {@link Builder} performs indexing on a set of documents and
   * returns instances of {@link Index} ready for querying.
   *
   * All configuration of the index is done via the builder, the
   * fields to index, the document reference, the text processing
   * pipeline and document scoring parameters are all set on the
   * builder before indexing.
   */
  export class Builder<T = object> {
    /**
     * The inverted index maps terms to document fields.
     */
    invertedIndex: Index.InvertedIndex = Object.create(null)

    /**
     * Keeps track of document term frequencies.
     */
    fieldTermFrequencies: Record<string, Record<string, number>> = {}

    /**
     * Keeps track of the length of documents added to the index.
     */
    fieldLengths: Record<string, number> = {}

    /**
     * Function for splitting strings into tokens for indexing.
     */
    tokenizer = lunr.tokenizer

    /**
     * The pipeline performs text processing on tokens before indexing.
     */
    pipeline = new lunr.Pipeline

    /**
     * A pipeline for processing search terms before querying the index.
     */
    searchPipeline = new lunr.Pipeline

    /**
     * Keeps track of the total number of documents indexed.
     */
    documentCount = 0

    /**
     * A counter incremented for each unique term, used to identify a terms position in the vector space.
     */
    termIndex = 0

    /**
     * A list of metadata keys that have been whitelisted for entry in the index.
     */
    metadataWhitelist: string[] = []

    /**
     * Internal reference to the document reference field.
     */
    private _ref: string = "id"

    /**
     * Internal reference to the document fields to index.
     */
    private _fields: Record<string, lunr.Builder.FieldAttributes<T>> = Object.create(null)

    private _documents: Record<string, lunr.Builder.DocumentAttributes> = Object.create(null)

    /**
     * A parameter to control field length normalization. Setting this to `0` disables normalization,
     * while `1` fully normalizes field lengths. The default value is `0.75`.
     */
    private _b = 0.75

    /**
     * A parameter to control how quickly an increase in term frequency results in term frequency saturation.
     * The default value is `1.2`.
     */
    private _k1 = 1.2

    // fields used for tests
    private averageFieldLength?: Record<string, number>
    private fieldVectors?: Record<string, lunr.Vector>
    private tokenSet?: lunr.TokenSet
    private numberMap?: lunr.NumberMap

    constructor () {
    }

    /**
     * Sets the document field used as the document reference. Every document must have this field.
     * The type of this field in the document should be a string, if it is not a string it will be
     * coerced into a string by calling toString.
     *
     * The default ref is 'id'.
     *
     * The ref should _not_ be changed during indexing, it should be set before any documents are
     * added to the index. Changing it during indexing can lead to inconsistent results.
     *
     * @param ref - The name of the reference field in the document.
     */
    ref (ref: string) {
      this._ref = ref
    }

    /**
     * Adds a field to the list of document fields that will be indexed. Every document being
     * indexed should have this field. Null values for this field in indexed documents will
     * not cause errors but will limit the chance of that document being retrieved by searches.
     *
     * All fields should be added before adding documents to the index. Adding fields after
     * a document has been indexed will have no effect on already indexed documents.
     *
     * Fields can be boosted at build time. This allows terms within that field to have more
     * importance when ranking search results. Use a field boost to specify that matches within
     * one field are more important than other fields.
     *
     * @param fieldName - The name of a field to index in all documents.
     * @param attributes - Optional attributes associated with this field.
     * @throws {RangeError} fieldName cannot contain unsupported characters '/'
     */
    field (fieldName: string, attributes: Builder.FieldAttributes<T> = {}) {
      if (/\//.test(fieldName)) {
        throw new RangeError ("Field '" + fieldName + "' contains illegal character '/'")
      }

      this._fields[fieldName] = attributes
    }

    /**
     * A parameter to tune the amount of field length normalisation that is applied when
     * calculating relevance scores. A value of 0 will completely disable any normalisation
     * and a value of 1 will fully normalise field lengths. The default is 0.75. Values of b
     * will be clamped to the range 0 - 1.
     *
     * @param number - The value to set for this tuning parameter.
     */
    b (number: number) {
      if (number < 0) {
        this._b = 0
      } else if (number > 1) {
        this._b = 1
      } else {
        this._b = number
      }
    }

    /**
     * A parameter that controls the speed at which a rise in term frequency results in term
     * frequency saturation. The default value is 1.2. Setting this to a higher value will give
     * slower saturation levels, a lower value will result in quicker saturation.
     *
     * @param number - The value to set for this tuning parameter.
     */
    k1 (number: number) {
      this._k1 = number
    }

    /**
     * Adds a document to the index.
     *
     * Before adding fields to the index the index should have been fully setup, with the document
     * ref and all fields to index already having been specified.
     *
     * The document must have a field name as specified by the ref (by default this is 'id') and
     * it should have all fields defined for indexing, though null or undefined values will not
     * cause errors.
     *
     * Entire documents can be boosted at build time. Applying a boost to a document indicates that
     * this document should rank higher in search results than other documents.
     *
     * @param doc - The document to add to the index.
     * @param attributes - Optional attributes associated with this document.
     */
    add (doc: T, attributes: Builder.DocumentAttributes = {}) {
      let docRef = (doc as any)[this._ref],
          fields = Object.keys(this._fields)

      this._documents[docRef] = attributes
      this.documentCount += 1

      for (const fieldName of fields) {
        let extractor = this._fields[fieldName].extractor,
            type = this._fields[fieldName].type || "string",
            field = extractor ? extractor(doc) : (doc as any)[fieldName],
            tokens = this.tokenizer(field, {
              fields: [fieldName],
              type
            }),
            terms = this.pipeline.run(tokens),
            fieldRef = new lunr.FieldRef (docRef, fieldName),
            fieldTerms = Object.create(null)

        this.fieldTermFrequencies["" + fieldRef] = fieldTerms
        this.fieldLengths["" + fieldRef] = 0

        // store the length of this field for this document
        this.fieldLengths["" + fieldRef] += terms.length

        // calculate term frequencies for this field
        for (const term of terms) {
          if (fieldTerms["" + term] == undefined) {
            fieldTerms["" + term] = 0
          }

          fieldTerms["" + term] += 1

          // add to inverted index
          // create an initial posting if one doesn't exist
          if (this.invertedIndex["" + term] == undefined) {
            let posting: Index.InvertedIndex[string] = Object.create(null)
            posting["_index"] = this.termIndex
            this.termIndex += 1

            for (let k = 0; k < fields.length; k++) {
              posting[fields[k]] = Object.create(null)
            }

            this.invertedIndex["" + term] = posting
          }

          // add an entry for this term/fieldName/docRef to the invertedIndex
          if (this.invertedIndex["" + term][fieldName][docRef] == undefined) {
            this.invertedIndex["" + term][fieldName][docRef] = Object.create(null)
          }

          // store all whitelisted metadata about this token in the
          // inverted index
          for (let l = 0; l < this.metadataWhitelist.length; l++) {
            let metadataKey = this.metadataWhitelist[l],
                metadata = term.metadata[metadataKey]

            if (this.invertedIndex["" + term][fieldName][docRef][metadataKey] == undefined) {
              this.invertedIndex["" + term][fieldName][docRef][metadataKey] = []
            }

            this.invertedIndex["" + term][fieldName][docRef][metadataKey].push(metadata)
          }
        }
      }
    }

    /**
     * Calculates the average document length for this index
     */
    private calculateAverageFieldLengths () {
      let fieldRefs = Object.keys(this.fieldLengths),
          accumulator: Record<string, number> = {},
          documentsWithField: Record<string, number> = {}

      for (const fieldRefName of fieldRefs) {
        let fieldRef = lunr.FieldRef.fromString(fieldRefName),
            field = fieldRef.fieldName

        documentsWithField[field] || (documentsWithField[field] = 0)
        documentsWithField[field] += 1

        accumulator[field] || (accumulator[field] = 0)
        accumulator[field] += this.fieldLengths["" + fieldRef]
      }

      let fields = Object.keys(this._fields)

      for (const fieldName of fields) {
        accumulator[fieldName] = accumulator[fieldName] / documentsWithField[fieldName]
      }

      return accumulator
    }

    /**
     * Builds a vector space model of every document using [[Vector]]
     */
    private createFieldVectors (averageFieldLength: Record<string, number>) {
      let fieldVectors: Record<string, lunr.Vector> = {},
          fieldRefs = Object.keys(this.fieldTermFrequencies),
          termIdfCache = Object.create(null)

      for (const fieldRefName of fieldRefs) {
        let fieldRef = lunr.FieldRef.fromString(fieldRefName),
            fieldName = fieldRef.fieldName,
            fieldLength = this.fieldLengths["" + fieldRef],
            fieldVector = new lunr.Vector,
            termFrequencies = this.fieldTermFrequencies["" + fieldRef],
            terms = Object.keys(termFrequencies),
            termsLength = terms.length


        let fieldBoost = this._fields[fieldName].boost || 1,
            docBoost = this._documents[fieldRef.docRef].boost || 1

        for (let j = 0; j < termsLength; j++) {
          let term = terms[j],
              tf = termFrequencies[term],
              termIndex = this.invertedIndex[term]._index,
              idf, score, scoreWithPrecision

          if (termIdfCache[term] === undefined) {
            idf = lunr.idf(this.invertedIndex[term], this.documentCount)
            termIdfCache[term] = idf
          } else {
            idf = termIdfCache[term]
          }

          score = idf * ((this._k1 + 1) * tf) / (this._k1 * (1 - this._b + this._b * (fieldLength / averageFieldLength[fieldName])) + tf)
          score *= fieldBoost
          score *= docBoost
          scoreWithPrecision = Math.round(score * 1000) / 1000
          // Converts 1.23456789 to 1.234.
          // Reducing the precision so that the vectors take up less
          // space when serialised. Doing it now so that they behave
          // the same before and after serialisation. Also, this is
          // the fastest approach to reducing a number's precision in
          // JavaScript.

          fieldVector.insert(termIndex, scoreWithPrecision)
        }

        fieldVectors["" + fieldRef] = fieldVector
      }

      return fieldVectors
    }

    /**
     * Creates a token set of all tokens in the index using [[TokenSet]]
     */
    private createTokenSet () {
      return lunr.TokenSet.fromArray(
        Object.keys(this.invertedIndex).sort()
      )
    }

    private createNumberMap () {
      return lunr.NumberMap.fromInvertedIndex(this.invertedIndex)
    }

    /**
     * Builds the index, creating an instance of [[Index]].
     *
     * This completes the indexing process and should only be called
     * once all documents have been added to the index.
     */
    build () {
      this.averageFieldLength = this.calculateAverageFieldLengths()
      this.fieldVectors = this.createFieldVectors(this.averageFieldLength)
      this.tokenSet = this.createTokenSet()
      this.numberMap = this.createNumberMap()

      return new lunr.Index({
        invertedIndex: this.invertedIndex,
        fieldVectors: this.fieldVectors,
        tokenSet: this.tokenSet,
        numberMap: this.numberMap,
        fields: Object.keys(this._fields),
        fieldTypes: Object.keys(this._fields).map(fieldName => this._fields[fieldName].type || "string"),
        pipeline: this.searchPipeline
      })
    }

    /**
     * Applies a plugin to the index builder.
     *
     * A plugin is a function that is called with the index builder as its context.
     * Plugins can be used to customise or extend the behaviour of the index
     * in some way. A plugin is just a function, that encapsulated the custom
     * behaviour that should be applied when building the index.
     *
     * The plugin function will be called with the index builder as its argument, additional
     * arguments can also be passed when calling use. The function will be called
     * with the index builder as its context.
     *
     * @param fn The plugin to apply.
     * @param fn.this This builder.
     * @param fn.builder This builder.
     * @param fn.args The arguments passed to `use`.
     * @param args The arguments to pass to `fn`.
     */
    use <A extends any[]> (fn: (this: Builder, builder: Builder, ...args: A) => void, ...args: A): void {
      fn.call(this, this, ...args)
    }
  }

  export namespace Builder {
    /**
     * A function that is used to extract a field from a document.
     *
     * Lunr expects a field to be at the top level of a document, if however the field
     * is deeply nested within a document an extractor function can be used to extract
     * the right field for indexing.
     *
     * @example <caption>Extracting a nested field</caption>
     * function (doc) { return doc.nested.field }
     */
    // eslint-disable-next-line space-infix-ops
    export type fieldExtractor<T = object> =
      /**
       * @param doc The document being added to the index.
       * @returns The object that will be indexed for this field.
       */
      (doc: T) => string | object | object[] | undefined

    /**
     * The attributes for a field.
     */
    export interface FieldAttributes<T = object> {
      boost?: number
      extractor?: fieldExtractor<T>
      type?: FieldType
    }

    /**
     * The attributes for a document.
     */
    export interface DocumentAttributes {
      boost?: number
    }

    /**
     * The valid types for a field in the index.
     */
    export type FieldType = "string" | "number"
  }
}