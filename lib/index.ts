/*!
 * lunr.Index
 * Copyright (C) @YEAR Oliver Nightingale
 */

// @ts-ignore
namespace lunr {
  /**
   * A query builder callback provides a query object to be used to express
   * the query to perform on the index.
   *
   * @callback lunr.Index~queryBuilder
   * @param {lunr.Query} query - The query object to build up.
   * @this lunr.Query
   */

  /**
   * A result contains details of a document matching a search query.
   * @typedef {object} lunr.Index~Result
   * @property {string} ref - The reference of the document this result represents.
   * @property {number} score - A number between 0 and 1 representing how similar this document is to the query.
   * @property {lunr.MatchData} matchData - Contains metadata about this match including which term(s) caused the match.
   */

  /**
   * Although lunr provides the ability to create queries using lunr.Query, it also provides a simple
   * query language which itself is parsed into an instance of lunr.Query.
   *
   * For programmatically building queries it is advised to directly use lunr.Query, the query language
   * is best used for human entered text rather than program generated text.
   *
   * At its simplest queries can just be a single term, e.g. `hello`, multiple terms are also supported
   * and will be combined with OR, e.g `hello world` will match documents that contain either 'hello'
   * or 'world', though those that contain both will rank higher in the results.
   *
   * Wildcards can be included in terms to match one or more unspecified characters, these wildcards can
   * be inserted anywhere within the term, and more than one wildcard can exist in a single term. Adding
   * wildcards will increase the number of documents that will be found but can also have a negative
   * impact on query performance, especially with wildcards at the beginning of a term.
   *
   * Terms can be restricted to specific fields, e.g. `title:hello`, only documents with the term
   * hello in the title field will match this query. Using a field not present in the index will lead
   * to an error being thrown.
   *
   * Modifiers can also be added to terms, lunr supports edit distance and boost modifiers on terms. A term
   * boost will make documents matching that term score higher, e.g. `foo^5`. Edit distance is also supported
   * to provide fuzzy matching, e.g. 'hello~2' will match documents with hello with an edit distance of 2.
   * Avoid large values for edit distance to improve query performance.
   *
   * Each term also supports a presence modifier. By default a term's presence in document is optional, however
   * this can be changed to either required or prohibited. For a term's presence to be required in a document the
   * term should be prefixed with a '+', e.g. `+foo bar` is a search for documents that must contain 'foo' and
   * optionally contain 'bar'. Conversely a leading '-' sets the terms presence to prohibited, i.e. it must not
   * appear in a document, e.g. `-foo bar` is a search for documents that do not contain 'foo' but may contain 'bar'.
   *
   * To escape special characters the backslash character '\' can be used, this allows searches to include
   * characters that would normally be considered modifiers, e.g. `foo\~2` will search for a term "foo~2" instead
   * of attempting to apply a boost of 2 to the search term "foo".
   *
   * @typedef {string} lunr.Index~QueryString
   * @example <caption>Simple single term query</caption>
   * hello
   * @example <caption>Multiple term query</caption>
   * hello world
   * @example <caption>term scoped to a field</caption>
   * title:hello
   * @example <caption>term with a boost of 10</caption>
   * hello^10
   * @example <caption>term with an edit distance of 2</caption>
   * hello~2
   * @example <caption>terms with presence modifiers</caption>
   * -foo +bar baz
   */

  /**
   * An index contains the built index of all documents and provides a query interface
   * to the index.
   *
   * Usually instances of lunr.Index will not be created using this constructor, instead
   * lunr.Builder should be used to construct new indexes, or lunr.Index.load should be
   * used to load previously built and serialized indexes.
   *
   * @memberOf lunr
   */
  export class Index {
    invertedIndex: Index.InvertedIndex
    fieldVectors: Record<string, lunr.Vector>
    tokenSet: lunr.TokenSet
    numberMap: lunr.NumberMap
    fields: string[]
    fieldTypes: lunr.Builder.FieldType[]
    pipeline: lunr.Pipeline

    /**
     * @param {object} attrs - The attributes of the built search index.
     * @param {object} attrs.invertedIndex - An index of term/field to document reference.
     * @param {object<string, lunr.Vector>} attrs.fieldVectors - Field vectors
     * @param {lunr.TokenSet} attrs.tokenSet - An set of all corpus tokens.
     * @param {lunr.NumberMap} attrs.numberMap
     * @param {string[]} attrs.fields - The names of indexed document fields.
     * @param {Array<"string" | "number">} attrs.fieldTypes
     * @param {lunr.Pipeline} attrs.pipeline - The pipeline to use for search terms.
    */
    constructor (attrs: Index.IndexAttributes) {
      this.invertedIndex = attrs.invertedIndex
      this.fieldVectors = attrs.fieldVectors
      this.tokenSet = attrs.tokenSet
      this.numberMap = attrs.numberMap
      this.fields = attrs.fields
      this.fieldTypes = attrs.fieldTypes
      this.pipeline = attrs.pipeline
    }

    /**
     * Performs a search against the index using lunr query syntax.
     *
     * Results will be returned sorted by their score, the most relevant results
     * will be returned first.  For details on how the score is calculated, please see
     * the {@link https://lunrjs.com/guides/searching.html#scoring|guide}.
     *
     * For more programmatic querying use lunr.Index#query.
     *
     * @param {lunr.Index~QueryString} queryString - A string containing a lunr query.
     * @throws {lunr.QueryParseError} If the passed query string cannot be parsed.
     * @returns {lunr.Index.Result[]}
     */
    search (queryString: Index.QueryString) {
      return this.query(query => {
        let parser = new lunr.QueryParser(queryString, query)
        parser.parse()
      })
    }

    /**
     * Performs a query against the index using the yielded lunr.Query object.
     *
     * If performing programmatic queries against the index, this method is preferred
     * over lunr.Index#search so as to avoid the additional query parsing overhead.
     *
     * A query object is yielded to the supplied function which should be used to
     * express the query to be run against the index.
     *
     * Note that although this function takes a callback parameter it is _not_ an
     * asynchronous operation, the callback is just yielded a query object to be
     * customized.
     *
     * @param {lunr.Index~queryBuilder} fn - A function that is used to build the query.
     * @returns {lunr.Index~Result[]}
     */
    query (fn: Index.queryBuilder) {
      // for each query clause
      // * process terms
      // * expand terms from token set
      // * find matching documents and metadata
      // * get document vectors
      // * score documents

      let query = new lunr.Query(this.fields, this.fieldTypes, this.numberMap),
          matchingFields: Record<string, lunr.MatchData> = Object.create(null),
          queryVectors: Record<string, lunr.Vector> = Object.create(null),
          termFieldCache: Record<string, true> = Object.create(null),
          requiredMatches: Record<string, lunr.Set> = Object.create(null),
          prohibitedMatches: Record<string, lunr.Set> = Object.create(null),
          fieldTypeCache: Record<string, lunr.Builder.FieldType> = Object.create(null)

      /*
      * To support field level boosts a query vector is created per
      * field. An empty vector is eagerly created to support negated
      * queries.
      */
      for (let i = 0; i < this.fields.length; i++) {
        queryVectors[this.fields[i]] = new lunr.Vector
        fieldTypeCache[this.fields[i]] = this.fieldTypes && this.fieldTypes[i] || "string"
      }

      fn.call(query, query)

      for (const clause of query.clauses) {
        /*
        * Unless the pipeline has been disabled for this term, which is
        * the case for terms with wildcards, we need to pass the clause
        * term through the search pipeline. A pipeline returns an array
        * of processed terms. Pipeline functions may expand the passed
        * term, which means we may end up performing multiple index lookups
        * for a single query term.
        */
        let terms: lunr.Query.Term[],
            clauseMatches = lunr.Set.empty

        if (clause.usePipeline && typeof clause.term === "string") {
          terms = this.pipeline.runString(clause.term, {
            fields: clause.fields,
            fieldTypes: clause.fieldTypes
          })
        } else {
          terms = [clause.term]
        }

        for (let m = 0; m < terms.length; m++) {
          let term = terms[m]

          /*
          * Each term returned from the pipeline needs to use the same query
          * clause object, e.g. the same boost and or edit distance. The
          * simplest way to do this is to re-use the clause object but mutate
          * its term property.
          */
          clause.term = term

          /*
          * From the term in the clause we create a token set which will then
          * be used to intersect the indexes token set to get a list of terms
          * to lookup in the inverted index
          */
          let termTokenSet = lunr.TokenSet.fromClause(clause),
              expandedTerms = this.tokenSet.intersect(termTokenSet).toArray()

          /*
          * If a term marked as required does not exist in the tokenSet it is
          * impossible for the search to return any matches. We set all the field
          * scoped required matches set to empty and stop examining any further
          * clauses.
          */
          if (expandedTerms.length === 0 && clause.presence === lunr.Query.presence.REQUIRED) {
            for (const field of clause.fields!) {
              requiredMatches[field] = lunr.Set.empty
            }

            break
          }

          for (const expandedTerm of expandedTerms) {
            /*
            * For each term get the posting and termIndex, this is required for
            * building the query vector.
            */
            let posting = this.invertedIndex[expandedTerm],
                termIndex = posting._index

            for (const field of clause.fields!) {
              /*
              * For each field that this query term is scoped by (by default
              * all fields are in scope) we need to get all the document refs
              * that have this term in that field.
              *
              * The posting is the entry in the invertedIndex for the matching
              * term from above.
              */
              let fieldPosting = posting[field],
                  matchingDocumentRefs = Object.keys(fieldPosting),
                  termField = expandedTerm + "/" + field,
                  matchingDocumentsSet = new lunr.Set(matchingDocumentRefs)

              /*
              * if the presence of this term is required ensure that the matching
              * documents are added to the set of required matches for this clause.
              *
              */
              if (clause.presence == lunr.Query.presence.REQUIRED) {
                clauseMatches = clauseMatches.union(matchingDocumentsSet)

                if (requiredMatches[field] === undefined) {
                  requiredMatches[field] = lunr.Set.complete
                }
              }

              /*
              * if the presence of this term is prohibited ensure that the matching
              * documents are added to the set of prohibited matches for this field,
              * creating that set if it does not yet exist.
              */
              if (clause.presence == lunr.Query.presence.PROHIBITED) {
                if (prohibitedMatches[field] === undefined) {
                  prohibitedMatches[field] = lunr.Set.empty
                }

                prohibitedMatches[field] = prohibitedMatches[field].union(matchingDocumentsSet)

                /*
                * Prohibited matches should not be part of the query vector used for
                * similarity scoring and no metadata should be extracted so we continue
                * to the next field
                */
                continue
              }

              /*
              * The query field vector is populated using the termIndex found for
              * the term and a unit value with the appropriate boost applied.
              * Using upsert because there could already be an entry in the vector
              * for the term we are working with. In that case we just add the scores
              * together.
              */
              queryVectors[field].upsert(termIndex, clause.boost!, function (a, b) { return a + b })

              /**
               * If we've already seen this term, field combo then we've already collected
               * the matching documents and metadata, no need to go through all that again
               */
              if (termFieldCache[termField]) {
                continue
              }

              for (let l = 0; l < matchingDocumentRefs.length; l++) {
                /*
                * All metadata for this term/field/document triple
                * are then extracted and collected into an instance
                * of lunr.MatchData ready to be returned in the query
                * results
                */
                let matchingDocumentRef = matchingDocumentRefs[l],
                    matchingFieldRef = new lunr.FieldRef (matchingDocumentRef, field),
                    metadata = fieldPosting[matchingDocumentRef],
                    fieldMatch

                if ((fieldMatch = matchingFields[matchingFieldRef.toString()]) === undefined) {
                  matchingFields[matchingFieldRef.toString()] = new lunr.MatchData (expandedTerm, field, metadata)
                } else {
                  fieldMatch.add(expandedTerm, field, metadata)
                }

              }

              termFieldCache[termField] = true
            }
          }
        }

        /**
         * If the presence was required we need to update the requiredMatches field sets.
         * We do this after all fields for the term have collected their matches because
         * the clause terms presence is required in _any_ of the fields not _all_ of the
         * fields.
         */
        if (clause.presence === lunr.Query.presence.REQUIRED) {
          for (const field of clause.fields!) {
            requiredMatches[field] = requiredMatches[field].intersect(clauseMatches)
          }
        }
      }

      /**
       * Need to combine the field scoped required and prohibited
       * matching documents into a global set of required and prohibited
       * matches
       */
      let allRequiredMatches = lunr.Set.complete,
          allProhibitedMatches = lunr.Set.empty

      for (let i = 0; i < this.fields.length; i++) {
        let field = this.fields[i]

        if (requiredMatches[field]) {
          allRequiredMatches = allRequiredMatches.intersect(requiredMatches[field])
        }

        if (prohibitedMatches[field]) {
          allProhibitedMatches = allProhibitedMatches.union(prohibitedMatches[field])
        }
      }

      let matchingFieldRefs = Object.keys(matchingFields),
          results: Index.Result[] = [],
          matches: Record<string, Index.Result> = Object.create(null)

      /*
      * If the query is negated (contains only prohibited terms)
      * we need to get _all_ fieldRefs currently existing in the
      * index. This is only done when we know that the query is
      * entirely prohibited terms to avoid any cost of getting all
      * fieldRefs unnecessarily.
      *
      * Additionally, blank MatchData must be created to correctly
      * populate the results.
      */
      if (query.isNegated()) {
        matchingFieldRefs = Object.keys(this.fieldVectors)

        for (const matchingFieldRef of matchingFieldRefs) {
          let fieldRef = lunr.FieldRef.fromString(matchingFieldRef)
          matchingFields[fieldRef.toString()] = new lunr.MatchData
        }
      }

      for (const matchingFieldRef of matchingFieldRefs) {
        /*
        * Currently we have document fields that match the query, but we
        * need to return documents. The matchData and scores are combined
        * from multiple fields belonging to the same document.
        *
        * Scores are calculated by field, using the query vectors created
        * above, and combined into a final document score using addition.
        */
        let fieldRef = lunr.FieldRef.fromString(matchingFieldRef),
            docRef = fieldRef.docRef

        if (!allRequiredMatches.contains(docRef)) {
          continue
        }

        if (allProhibitedMatches.contains(docRef)) {
          continue
        }

        let fieldVector = this.fieldVectors[fieldRef.toString()],
            score = queryVectors[fieldRef.fieldName].similarity(fieldVector),
            docMatch

        if ((docMatch = matches[docRef]) !== undefined) {
          docMatch.score += score
          docMatch.matchData.combine(matchingFields[fieldRef.toString()])
        } else {
          let match: Index.Result = {
            ref: docRef,
            score: score,
            matchData: matchingFields[fieldRef.toString()]
          }
          matches[docRef] = match
          results.push(match)
        }
      }

      /*
      * Sort the results objects by score, highest first.
      */
      return results.sort((a, b) => b.score - a.score)
    }

    /**
     * Prepares the index for JSON serialization.
     *
     * The schema for this JSON blob will be described in a
     * separate JSON schema file.
     *
     * @returns {Object}
     */
    toJSON (): any {
      let invertedIndex = Object.keys(this.invertedIndex)
        .sort()
        .map((term) => {
          return [term, this.invertedIndex[term]]
        })

      let fieldVectors = Object.keys(this.fieldVectors)
        .map((ref) => {
          return [ref, this.fieldVectors[ref].toJSON()]
        })

      return {
        version: lunr.version,
        fields: this.fields,
        fieldTypes: this.fieldTypes,
        fieldVectors: fieldVectors,
        invertedIndex: invertedIndex,
        pipeline: this.pipeline.toJSON()
      }
    }

    /**
     * Loads a previously serialized lunr.Index
     *
     * @param {Object} serializedIndex - A previously serialized lunr.Index
     * @returns {lunr.Index}
     */
    static load (serializedIndex: any) {
      let fieldVectors: Record<string, lunr.Vector> = {},
          serializedVectors = serializedIndex.fieldVectors,
          invertedIndex = Object.create(null),
          serializedInvertedIndex = serializedIndex.invertedIndex,
          tokenSetBuilder = new lunr.TokenSet.Builder,
          pipeline = lunr.Pipeline.load(serializedIndex.pipeline)

      if (serializedIndex.version != lunr.version) {
        lunr.utils.warn("Version mismatch when loading serialised index. Current version of lunr '" + lunr.version + "' does not match serialized index '" + serializedIndex.version + "'")
      }

      for (let i = 0; i < serializedVectors.length; i++) {
        let tuple = serializedVectors[i],
            ref = tuple[0],
            elements = tuple[1]

        fieldVectors[ref] = new lunr.Vector (elements)
      }

      for (let i = 0; i < serializedInvertedIndex.length; i++) {
        let tuple = serializedInvertedIndex[i],
            term = tuple[0],
            posting = tuple[1]

        tokenSetBuilder.insert(term)
        invertedIndex[term] = posting
      }

      tokenSetBuilder.finish()

      return new Index ({
        fields: serializedIndex.fields,
        fieldTypes: serializedIndex.fieldTypes,
        fieldVectors,
        invertedIndex,
        tokenSet: tokenSetBuilder.root,
        numberMap: lunr.NumberMap.fromInvertedIndex(invertedIndex),
        pipeline
      })
    }
  }

  export namespace Index {
    /** The attributes of the built search index. */
    export interface IndexAttributes {
      /** An index of term/field to document reference. */
      invertedIndex: Index.InvertedIndex
      /** Field vectors */
      fieldVectors: Record<string, lunr.Vector>
      /** An set of all corpus tokens. */
      tokenSet: lunr.TokenSet
      numberMap: lunr.NumberMap
      /** The names of indexed document fields. */
      fields: string[]
      /** The names of indexed document fields. */
      fieldTypes: lunr.Builder.FieldType[]
      /** The pipeline to use for search terms. */
      pipeline: lunr.Pipeline
    }

    /**
     * A query builder callback provides a query object to be used to express
     * the query to perform on the index.
     *
     * @callback lunr.Index.queryBuilder
     * @param {lunr.Query} query - The query object to build up.
     * @this lunr.Query
     */
    export type queryBuilder = (this: lunr.Query, query: lunr.Query) => void

    /**
     * A result contains details of a document matching a search query.
     * @typedef {object} lunr.Index.Result
     * @property {string} ref - The reference of the document this result represents.
     * @property {number} score - A number between 0 and 1 representing how similar this document is to the query.
     * @property {lunr.MatchData} matchData - Contains metadata about this match including which term(s) caused the match.
     */
    export interface Result {
      ref: string
      score: number
      matchData: lunr.MatchData
    }

    /**
     * Although lunr provides the ability to create queries using lunr.Query, it also provides a simple
     * query language which itself is parsed into an instance of lunr.Query.
     *
     * For programmatically building queries it is advised to directly use lunr.Query, the query language
     * is best used for human entered text rather than program generated text.
     *
     * At its simplest queries can just be a single term, e.g. `hello`, multiple terms are also supported
     * and will be combined with OR, e.g `hello world` will match documents that contain either 'hello'
     * or 'world', though those that contain both will rank higher in the results.
     *
     * Wildcards can be included in terms to match one or more unspecified characters, these wildcards can
     * be inserted anywhere within the term, and more than one wildcard can exist in a single term. Adding
     * wildcards will increase the number of documents that will be found but can also have a negative
     * impact on query performance, especially with wildcards at the beginning of a term.
     *
     * Terms can be restricted to specific fields, e.g. `title:hello`, only documents with the term
     * hello in the title field will match this query. Using a field not present in the index will lead
     * to an error being thrown.
     *
     * Modifiers can also be added to terms, lunr supports edit distance and boost modifiers on terms. A term
     * boost will make documents matching that term score higher, e.g. `foo^5`. Edit distance is also supported
     * to provide fuzzy matching, e.g. 'hello~2' will match documents with hello with an edit distance of 2.
     * Avoid large values for edit distance to improve query performance.
     *
     * Each term also supports a presence modifier. By default a term's presence in document is optional, however
     * this can be changed to either required or prohibited. For a term's presence to be required in a document the
     * term should be prefixed with a '+', e.g. `+foo bar` is a search for documents that must contain 'foo' and
     * optionally contain 'bar'. Conversely a leading '-' sets the terms presence to prohibited, i.e. it must not
     * appear in a document, e.g. `-foo bar` is a search for documents that do not contain 'foo' but may contain 'bar'.
     *
     * To escape special characters the backslash character '\' can be used, this allows searches to include
     * characters that would normally be considered modifiers, e.g. `foo\~2` will search for a term "foo~2" instead
     * of attempting to apply a boost of 2 to the search term "foo".
     *
     * @typedef {string} lunr.Index.QueryString
     * @example <caption>Simple single term query</caption>
     * hello
     * @example <caption>Multiple term query</caption>
     * hello world
     * @example <caption>term scoped to a field</caption>
     * title:hello
     * @example <caption>term with a boost of 10</caption>
     * hello^10
     * @example <caption>term with an edit distance of 2</caption>
     * hello~2
     * @example <caption>terms with presence modifiers</caption>
     * -foo +bar baz
     */
    export type QueryString = string

    export type InvertedIndex = Record<string, InvertedIndex.Posting>

    export namespace InvertedIndex {
      export type Posting = { _index: number } & FieldReference
      export type FieldReference = Record<string, DocumentReference>
      export type DocumentReference = Record<string, Metadata>
      export type Metadata = Record<string, any>
    }
  }
}