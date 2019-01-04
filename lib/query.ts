// @ts-ignore
namespace lunr {
  /**
   * A lunr.Query provides a programmatic way of defining queries to be performed
   * against a {@link lunr.Index}.
   *
   * Prefer constructing a lunr.Query using the {@link lunr.Index#query} method
   * so the query object is pre-initialized with the right index fields.
   */
  export class Query {
    /**
     * An array of query clauses.
     */
    clauses: Query.Clause[] = []
    /**
     * An array of all available fields in a lunr.Index
     */
    allFields: string[]
    /**
     * An array of all field types in a lunr.Index
     */
    allFieldTypes?: Builder.FieldType[]
    numberMap?: NumberMap

    /**
     * @param allFields An array of all available fields in a lunr.Index
     * @param allFieldTypes An array of all field types in a lunr.Index
     * @param numberMap
     */
    constructor (allFields: string[], allFieldTypes?: Builder.FieldType[], numberMap?: NumberMap) {
      this.clauses = []
      this.allFields = allFields
      this.allFieldTypes = allFieldTypes
      this.numberMap = numberMap
    }

    /**
     * Adds a {@link lunr.Query.Clause} to this query.
     *
     * Unless the clause contains the fields to be matched all fields will be matched. In addition
     * a default boost of 1 is applied to the clause.
     *
     * @param clause The clause to add to this query.
     * @see [Query.Clause]
     */
    clause (clause: Query.Clause) {
      if (!('fields' in clause)) {
        if (typeof clause.term === "object") {
          const numberFields: string[] = []
          const numberTypes: Builder.FieldType[] = []
          if (this.allFieldTypes) {
            for (let i = 0; i < this.allFields.length; i++) {
              const type = this.allFieldTypes[i]
              if (type === "number") {
                numberFields.push(this.allFields[i])
                numberTypes.push("number")
              }
            }
          }
          clause.fields = numberFields
          clause.fieldTypes = numberTypes
        } else {
          clause.fields = this.allFields
          clause.fieldTypes = this.allFieldTypes
        }
      }

      if (!('boost' in clause)) {
        clause.boost = 1
      }

      if (!('usePipeline' in clause)) {
        clause.usePipeline = true
      }

      if (!('wildcard' in clause)) {
        clause.wildcard = Query.wildcard.NONE
      }

      if (!('numberMap' in clause) && typeof clause.term === "object") {
        clause.numberMap = this.numberMap
      }

      if (clause.wildcard && (clause.wildcard & Query.wildcard.LEADING) && typeof clause.term === "string" && (clause.term.charAt(0) != Query.wildcardChar)) {
        clause.term = "*" + clause.term
      }

      if (clause.wildcard && (clause.wildcard & Query.wildcard.TRAILING) && typeof clause.term === "string" && (clause.term.slice(-1) != Query.wildcardChar)) {
        clause.term = "" + clause.term + "*"
      }

      if (!('presence' in clause)) {
        clause.presence = Query.presence.OPTIONAL
      }

      this.clauses.push(clause)

      return this
    }

    /**
     * A negated query is one in which every clause has a presence of
     * prohibited. These queries require some special processing to return
     * the expected results.
     */
    isNegated () {
      for (var i = 0; i < this.clauses.length; i++) {
        if (this.clauses[i].presence != Query.presence.PROHIBITED) {
          return false
        }
      }

      return true
    }

    /**
     * Adds a term to the current query, under the covers this will create a {@link lunr.Query.Clause}
     * to the list of clauses that make up this query.
     *
     * The term is used as is, i.e. no tokenization will be performed by this method. Instead conversion
     * to a token or token-like string should be done before calling this method.
     *
     * The term will be converted to a string by calling `toString`. Multiple terms can be passed as an
     * array, each term in the array will share the same options.
     *
     * @param term The term(s) to add to the query.
     * @param options Any additional properties to add to the query clause.
     * @see lunr.Query#clause
     * @see lunr.Query.Clause
     * @example <caption>adding a single term to a query</caption>
     * query.term("foo")
     * @example <caption>adding a single term to a query and specifying search fields, term boost and automatic trailing wildcard</caption>
     * query.term("foo", {
     *   fields: ["title"],
     *   boost: 10,
     *   wildcard: lunr.Query.wildcard.TRAILING
     * })
     * @example <caption>using lunr.tokenizer to convert a string to tokens before using them as terms</caption>
     * query.term(lunr.tokenizer("foo bar"))
     */
    term (term: string | object | (string | object)[], options: Partial<Query.Clause> = {}) {
      if (Array.isArray(term)) {
        term.forEach((t) => { this.term(t, lunr.utils.clone(options)) })
        return this
      }

      this.clause({
        ...options,
        term: term.toString()
      })

      return this
    }

    /**
     * Adds a comparator term to the current query, under the covers this will create a {@link lunr.Query.Clause}
     * to the list of clauses that make up this query.
     *
     * @param comparator The relational operator.
     * @param comparand The comparand.
     * @param options Any additional properties to add to the query clause.
     * @returns {lunr.Query}
     * @see lunr.Query#clause
     * @see lunr.Query.Clause
     * @example <caption>adding a single comparator to a query and specifying search fields</caption>
     * query.comparator(lunr.Query.comparator.GREATERTHAN, 10, {
     *   fields: ["wordCount"]
     * })
     */
    comparator (comparator: Query.comparator, comparand: number, options: Partial<Query.Clause> = {}) {
      this.clause({
        ...options,
        term: { comparator, comparand }
      })

      return this
    }

    /**
     * Adds a range term to the current query, under the covers this will create a {@link lunr.Query.Clause}
     * to the list of clauses that make up this query.
     *
     * @param start The starting point of the range.
     * @param end The ending point of the range.
     * @param options Any additional properties to add to the query clause.
     * @see lunr.Query#clause
     * @see lunr.Query.Clause
     * @example <caption>adding a single comparator to a query and specifying search fields</caption>
     * query.range(5, 10, {
     *   fields: ["wordCount"]
     * })
     */
    range (start: "*" | number, end: "*" | number, options: Partial<Query.Clause> = {}) {
      this.clause({
        ...options,
        term: { start, end }
      })

      return this
    }
  }

  export namespace Query {
    export const wildcardChar = "*"

    /**
     * Constants for indicating what kind of automatic wildcard insertion will be used when constructing a query clause.
     *
     * This allows wildcards to be added to the beginning and end of a term without having to manually do any string
     * concatenation.
     *
     * The wildcard constants can be bitwise combined to select both leading and trailing wildcards.
     *
     * @see lunr.Query.Clause
     * @see lunr.Query#clause
     * @see lunr.Query#term
     * @example <caption>query term with trailing wildcard</caption>
     * query.term('foo', { wildcard: lunr.Query.wildcard.TRAILING })
     * @example <caption>query term with leading and trailing wildcard</caption>
     * query.term('foo', {
     *   wildcard: lunr.Query.wildcard.LEADING | lunr.Query.wildcard.TRAILING
     * })
     */
    export enum wildcard {
      /** The term will have no wildcards inserted, this is the default behaviour */
      NONE,
      /** Prepend the term with a wildcard, unless a leading wildcard already exists */
      LEADING,
      /** Append a wildcard to the term, unless a trailing wildcard already exists */
      TRAILING,
    }

    /**
     * Constants for indicating what kind of presence a term must have in matching documents.
     *
     * @see lunr.Query.Clause
     * @see lunr.Query#clause
     * @see lunr.Query#term
     * @example <caption>query term with required presence</caption>
     * query.term('foo', { presence: lunr.Query.presence.REQUIRED })
     */
    export enum presence {
      /**
       * Term's presence in a document is optional, this is the default value.
       */
      OPTIONAL = 1,

      /**
       * Term's presence in a document is required, documents that do not contain
       * this term will not be returned.
       */
      REQUIRED = 2,

      /**
       * Term's presence in a document is prohibited, documents that do contain
       * this term will not be returned.
       */
      PROHIBITED = 3
    }

    /**
     * Constants for indicating a relational comparison.
     *
     * @see lunr.Query.Clause
     * @see lunr.Query#clause
     * @see lunr.Query#term
     */
    export enum comparator {
      /** The field's value must be greater than (`>`) the comparand. */
      GREATERTHAN = ">",
      /** The field's value must be greater than or equal to (`>=`) the comparand. */
      GREATERTHAN_EQUALS = ">=",
      /** The field's value must be less than (`<`) the comparand. */
      LESSTHAN = "<",
      /** The field's value must be less than or equal to (`<=`) the comparand. */
      LESSTHAN_EQUALS = "<=",
    }

    /**
     * A single clause in a {@link lunr.Query} contains a term and details on how to
     * match that term against a {@link lunr.Index}.
     */
    export interface Clause {
      /**
       * The fields in an index this clause should be matched against.
       */
      fields?: string[]
      /**
       * The types of the fields in the index.
       */
      fieldTypes?: Builder.FieldType[]
      numberMap?: NumberMap
      /**
       * Any boost that should be applied when matching this clause.
       */
      boost?: number
      /**
       * Whether the term should have fuzzy matching applied, and how fuzzy the match should be.
       */
      editDistance?: number
      /**
       * Whether the term should be passed through the search pipeline.
       */
      usePipeline?: boolean
      /**
       * Whether the term should have wildcards appended or prepended.
       */
      wildcard?: wildcard
      /**
       * The terms presence in any matching documents.
       */
      presence?: presence
      term: Term
    }

    /**
     * A term used to compare a number against a field using the provided operator.
     */
    export interface ComparatorTerm {
      comparator: comparator
      comparand: number
    }

    /**
     * A term used to find a number within the provided range.
     */
    export interface RangeTerm {
      start: "*" | number
      end: "*" | number
    }

    export type Term = string | ComparatorTerm | RangeTerm
  }
}