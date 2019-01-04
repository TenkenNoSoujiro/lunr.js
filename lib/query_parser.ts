// @ts-ignore
namespace lunr {
  /** @hidden */
  export class QueryParser {
    lexer: lunr.QueryLexer
    query: lunr.Query
    currentClause: Partial<lunr.Query.Clause> = {}
    currentComparator?: Partial<lunr.Query.ComparatorTerm> = undefined
    currentRange?: Partial<lunr.Query.RangeTerm> = undefined

    private lexemeIdx = 0
    private lexemes?: lunr.QueryLexer.Lexeme[]

    constructor (str: string, query: lunr.Query) {
      this.lexer = new lunr.QueryLexer (str)
      this.query = query
    }

    parse () {
      this.lexer.run()
      this.lexemes = this.lexer.lexemes

      let state: parserState | void = parseClause
      while (state) {
        state = state(this)
      }

      return this.query
    }

    peekLexeme () {
      return this.lexemes![this.lexemeIdx]
    }

    consumeLexeme () {
      let lexeme = this.peekLexeme()
      this.lexemeIdx += 1
      return lexeme
    }

    nextClause () {
      let completedClause = this.currentClause as lunr.Query.Clause
      this.query.clause(completedClause)
      this.currentClause = {}
      this.currentComparator = undefined
      this.currentRange = undefined
    }
  }

  /** @hidden */
  type parserState = (parser: QueryParser) => parserState | void

  /** @hidden */
  const parseClause: parserState = parser => {
    let lexeme = parser.peekLexeme()

    if (lexeme == undefined) {
      return
    }

    switch (lexeme.type) {
      case lunr.QueryLexer.PRESENCE:
        return parsePresence
      case lunr.QueryLexer.FIELD:
        return parseField
      case lunr.QueryLexer.TERM:
        return parseTerm
      default: {
        let errorMessage = "expected either a field or a term, found " + lexeme.type

        if (lexeme.str.length >= 1) {
          errorMessage += " with value '" + lexeme.str + "'"
        }

        throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
      }
    }
  }

  /** @hidden */
  const parsePresence: parserState = parser => {
    let lexeme = parser.consumeLexeme()

    if (lexeme == undefined) {
      return
    }

    switch (lexeme.str) {
      case "-":
        parser.currentClause.presence = lunr.Query.presence.PROHIBITED
        break
      case "+":
        parser.currentClause.presence = lunr.Query.presence.REQUIRED
        break
      default: {
        let errorMessage = "unrecognised presence operator'" + lexeme.str + "'"
        throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
      }
    }

    let nextLexeme = parser.peekLexeme()

    if (nextLexeme == undefined) {
      let errorMessage = "expecting term or field, found nothing"
      throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
    }

    switch (nextLexeme.type) {
      case lunr.QueryLexer.FIELD:
        return parseField
      case lunr.QueryLexer.TERM:
        return parseTerm
      default: {
        let errorMessage = "expecting term or field, found '" + nextLexeme.type + "'"
        throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
      }
    }
  }

  /** @hidden */
  const parseField: parserState = parser => {
    let lexeme = parser.consumeLexeme()

    if (lexeme == undefined) {
      return
    }

    let fieldIndex = parser.query.allFields.indexOf(lexeme.str)
    if (fieldIndex == -1) {
      let possibleFields = parser.query.allFields.map(function (f) { return "'" + f + "'" }).join(', '),
          errorMessage = "unrecognised field '" + lexeme.str + "', possible fields: " + possibleFields

      throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
    }

    parser.currentClause.fields = [lexeme.str]
    if (parser.query.allFieldTypes) {
      parser.currentClause.fieldTypes = [parser.query.allFieldTypes[fieldIndex]]
    }

    let nextLexeme = parser.peekLexeme()

    if (nextLexeme == undefined) {
      let errorMessage = "expecting term or operator, found nothing"
      throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
    }

    switch (nextLexeme.type) {
      case lunr.QueryLexer.TERM:
        return parseTerm
      case lunr.QueryLexer.RANGE_START:
        return parseRangeStart
      case lunr.QueryLexer.COMPARATOR:
        return parseComparator
      default: {
        let errorMessage = "expecting term, found '" + nextLexeme.type + "'"
        throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
      }
    }
  }

  /** @hidden */
  const parseRangeStart: parserState = parser => {
    let lexeme = parser.consumeLexeme()

    if (lexeme == undefined) {
      return
    }

    if (parser.currentClause.fieldTypes) {
      for (const fieldType of parser.currentClause.fieldTypes) {
        if (fieldType !== "number") {
          let errorMessage = "ranges are only supported on fields of type 'number'"
          throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
        }
      }
    } else {
      let errorMessage = "ranges are only supported on fields of type 'number'"
      throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
    }

    parser.currentRange = {}

    if (lexeme.str == "*") {
      parser.currentRange.start = "*"
    } else {
      parser.currentRange.start = lunr.utils.parseNumber(lexeme.str)
      if (isNaN(parser.currentRange.start)) {
        let errorMessage = "range start must be numeric or '*'"
        throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
      }
    }

    parser.currentClause.usePipeline = false

    let nextLexeme = parser.peekLexeme()

    if (nextLexeme == undefined) {
      let errorMessage = "expecting range end, found nothing"
      throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
    }

    switch (nextLexeme.type) {
      case lunr.QueryLexer.RANGE_END:
        return parseRangeEnd
      default: {
        let errorMessage = "expecting range end, found '" + nextLexeme.type + "'"
        throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
      }
    }
  }

  /** @hidden */
  const parseRangeEnd: parserState = parser => {
    let lexeme = parser.consumeLexeme()

    if (lexeme == undefined) {
      return
    }

    if (!parser.currentRange) throw new Error()

    if (lexeme.str == "*") {
      parser.currentRange.end = "*"
    } else {
      parser.currentRange.end = lunr.utils.parseNumber(lexeme.str)
      if (isNaN(parser.currentRange.end)) {
        let errorMessage = "range end must be numeric or '*'"
        throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
      }
    }

    parser.currentClause.term = parser.currentRange as lunr.Query.RangeTerm
    parser.currentRange = undefined

    let nextLexeme = parser.peekLexeme()

    if (nextLexeme == undefined) {
      parser.nextClause()
      return
    }

    switch (nextLexeme.type) {
      case lunr.QueryLexer.TERM:
        return parseTerm
      default: {
        let errorMessage = "expecting term, found '" + nextLexeme.type + "'"
        throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
      }
    }
  }

  /** @hidden */
  const parseComparator: parserState = parser => {
    let lexeme = parser.consumeLexeme()

    if (lexeme == undefined) {
      return
    }

    if (parser.currentClause.fieldTypes) {
      for (const fieldType of parser.currentClause.fieldTypes) {
        if (fieldType !== "number") {
          let errorMessage = "comparators are only supported on fields of type 'number'"
          throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
        }
      }
    } else {
      let errorMessage = "comparators are only supported on fields of type 'number'"
      throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
    }

    parser.currentComparator = {}
    parser.currentClause.usePipeline = false

    switch (lexeme.str) {
      case lunr.Query.comparator.LESSTHAN:
      case lunr.Query.comparator.LESSTHAN_EQUALS:
      case lunr.Query.comparator.GREATERTHAN:
      case lunr.Query.comparator.GREATERTHAN_EQUALS:
        parser.currentComparator.comparator = lexeme.str
        break
    }

    let nextLexeme = parser.peekLexeme()

    if (nextLexeme == undefined) {
      let errorMessage = "expecting term, found nothing"
      throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
    }

    switch (nextLexeme.type) {
      case lunr.QueryLexer.COMPARAND:
        return parseComparand
      default: {
        let errorMessage = "expecting comparand, found '" + nextLexeme.type + "'"
        throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
      }
    }
  }

  /** @hidden */
  const parseComparand: parserState = parser => {
    let lexeme = parser.consumeLexeme()

    if (lexeme == undefined) {
      return
    }

    if (!parser.currentComparator) throw new Error()

    parser.currentComparator.comparand = lunr.utils.parseNumber(lexeme.str)
    if (isNaN(parser.currentComparator.comparand)) {
      let errorMessage = "comparand must be numeric"
      throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
    }

    parser.currentClause.term = parser.currentComparator as lunr.Query.ComparatorTerm
    parser.currentComparator = undefined

    let nextLexeme = parser.peekLexeme()

    if (nextLexeme == undefined) {
      parser.nextClause()
      return
    }

    switch (nextLexeme.type) {
      case lunr.QueryLexer.TERM:
        return parseTerm
      default: {
        let errorMessage = "expecting term, found '" + nextLexeme.type + "'"
        throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
      }
    }
  }

  /** @hidden */
  const parseTerm: parserState = parser => {
    let lexeme = parser.consumeLexeme()

    if (lexeme == undefined) {
      return
    }

    parser.currentClause.term = lexeme.str.toLowerCase()

    if (lexeme.str.indexOf("*") != -1) {
      parser.currentClause.usePipeline = false
    }

    let nextLexeme = parser.peekLexeme()

    if (nextLexeme == undefined) {
      parser.nextClause()
      return
    }

    switch (nextLexeme.type) {
      case lunr.QueryLexer.TERM:
        parser.nextClause()
        return parseTerm
      case lunr.QueryLexer.FIELD:
        parser.nextClause()
        return parseField
      case lunr.QueryLexer.EDIT_DISTANCE:
        return parseEditDistance
      case lunr.QueryLexer.BOOST:
        return parseBoost
      case lunr.QueryLexer.PRESENCE:
        parser.nextClause()
        return parsePresence
      default: {
        let errorMessage = "Unexpected lexeme type '" + nextLexeme.type + "'"
        throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
      }
    }
  }

  /** @hidden */
  const parseEditDistance: parserState = parser => {
    let lexeme = parser.consumeLexeme()

    if (lexeme == undefined) {
      return
    }

    let editDistance = parseInt(lexeme.str, 10)

    if (isNaN(editDistance)) {
      let errorMessage = "edit distance must be numeric"
      throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
    }

    parser.currentClause.editDistance = editDistance

    let nextLexeme = parser.peekLexeme()

    if (nextLexeme == undefined) {
      parser.nextClause()
      return
    }

    switch (nextLexeme.type) {
      case lunr.QueryLexer.TERM:
        parser.nextClause()
        return parseTerm
      case lunr.QueryLexer.FIELD:
        parser.nextClause()
        return parseField
      case lunr.QueryLexer.EDIT_DISTANCE:
        return parseEditDistance
      case lunr.QueryLexer.BOOST:
        return parseBoost
      case lunr.QueryLexer.PRESENCE:
        parser.nextClause()
        return parsePresence
      default: {
        let errorMessage = "Unexpected lexeme type '" + nextLexeme.type + "'"
        throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
      }
    }
  }

  /** @hidden */
  const parseBoost: parserState = parser => {
    let lexeme = parser.consumeLexeme()

    if (lexeme == undefined) {
      return
    }

    let boost = parseInt(lexeme.str, 10)

    if (isNaN(boost)) {
      let errorMessage = "boost must be numeric"
      throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
    }

    parser.currentClause.boost = boost

    let nextLexeme = parser.peekLexeme()

    if (nextLexeme == undefined) {
      parser.nextClause()
      return
    }

    switch (nextLexeme.type) {
      case lunr.QueryLexer.TERM:
        parser.nextClause()
        return parseTerm
      case lunr.QueryLexer.FIELD:
        parser.nextClause()
        return parseField
      case lunr.QueryLexer.EDIT_DISTANCE:
        return parseEditDistance
      case lunr.QueryLexer.BOOST:
        return parseBoost
      case lunr.QueryLexer.PRESENCE:
        parser.nextClause()
        return parsePresence
      default: {
        let errorMessage = "Unexpected lexeme type '" + nextLexeme.type + "'"
        throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
      }
    }
  }
}