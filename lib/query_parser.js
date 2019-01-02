lunr.QueryParser = class QueryParser {
  /**
   *
   * @param {string} str
   * @param {lunr.Query} query
   */
  constructor (str, query) {
    this.lexer = new lunr.QueryLexer (str)
    this.query = query
    /** @type {Partial<lunr.Query.Clause>} */
    this.currentClause = {}
    /** @type {Partial<lunr.Query.ComparatorTerm> | undefined} */
    this.currentComparator = undefined
    /** @type {Partial<lunr.Query.RangeTerm> | undefined} */
    this.currentRange = undefined
    this.lexemeIdx = 0
  }

  parse () {
    this.lexer.run()
    /** @type {lunr.QueryLexer.Lexeme[]} */
    this.lexemes = this.lexer.lexemes

    /** @type {lunr.QueryParser.parserState | void} */
    var state = lunr.QueryParser.parseClause

    while (state) {
      state = state(this)
    }

    return this.query
  }

  peekLexeme () {
    return /** @type {lunr.QueryLexer.Lexeme[]} */(this.lexemes)[this.lexemeIdx]
  }

  consumeLexeme () {
    var lexeme = this.peekLexeme()
    this.lexemeIdx += 1
    return lexeme
  }

  nextClause () {
    var completedClause = /** @type {lunr.Query.Clause} */(this.currentClause)
    this.query.clause(completedClause)
    this.currentClause = {}
    this.currentComparator = undefined
    this.currentRange = undefined
  }

}

/** @type {lunr.QueryParser.parserState} */
lunr.QueryParser.parseClause = function (parser) {
  var lexeme = parser.peekLexeme()

  if (lexeme == undefined) {
    return
  }

  switch (lexeme.type) {
    case lunr.QueryLexer.PRESENCE:
      return lunr.QueryParser.parsePresence
    case lunr.QueryLexer.FIELD:
      return lunr.QueryParser.parseField
    case lunr.QueryLexer.TERM:
      return lunr.QueryParser.parseTerm
    default:
      var errorMessage = "expected either a field or a term, found " + lexeme.type

      if (lexeme.str.length >= 1) {
        errorMessage += " with value '" + lexeme.str + "'"
      }

      throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }
}

/** @type {lunr.QueryParser.parserState} */
lunr.QueryParser.parsePresence = function (parser) {
  var lexeme = parser.consumeLexeme()

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
    default:
      var errorMessage = "unrecognised presence operator'" + lexeme.str + "'"
      throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }

  var nextLexeme = parser.peekLexeme()

  if (nextLexeme == undefined) {
    var errorMessage = "expecting term or field, found nothing"
    throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }

  switch (nextLexeme.type) {
    case lunr.QueryLexer.FIELD:
      return lunr.QueryParser.parseField
    case lunr.QueryLexer.TERM:
      return lunr.QueryParser.parseTerm
    default:
      var errorMessage = "expecting term or field, found '" + nextLexeme.type + "'"
      throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
  }
}

/** @type {lunr.QueryParser.parserState} */
lunr.QueryParser.parseField = function (parser) {
  var lexeme = parser.consumeLexeme()

  if (lexeme == undefined) {
    return
  }

  var fieldIndex = parser.query.allFields.indexOf(lexeme.str)
  if (fieldIndex == -1) {
    var possibleFields = parser.query.allFields.map(function (f) { return "'" + f + "'" }).join(', '),
        errorMessage = "unrecognised field '" + lexeme.str + "', possible fields: " + possibleFields

    throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }

  parser.currentClause.fields = [lexeme.str]
  if (parser.query.allFieldTypes) {
    parser.currentClause.fieldTypes = [parser.query.allFieldTypes[fieldIndex]]
  }

  var nextLexeme = parser.peekLexeme()

  if (nextLexeme == undefined) {
    var errorMessage = "expecting term or operator, found nothing"
    throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }

  switch (nextLexeme.type) {
    case lunr.QueryLexer.TERM:
      return lunr.QueryParser.parseTerm
    case lunr.QueryLexer.RANGE_START:
      return lunr.QueryParser.parseRangeStart
    case lunr.QueryLexer.COMPARATOR:
      return lunr.QueryParser.parseComparator
    default:
      var errorMessage = "expecting term, found '" + nextLexeme.type + "'"
      throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
  }
}

/** @type {lunr.QueryParser.parserState} */
lunr.QueryParser.parseRangeStart = function (parser) {
  var lexeme = parser.consumeLexeme()

  if (lexeme == undefined) {
    return
  }

  if (parser.currentClause.fieldTypes) {
    for (const fieldType of parser.currentClause.fieldTypes) {
      if (fieldType !== "number") {
        var errorMessage = "ranges are only supported on fields of type 'number'"
        throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
      }
    }
  } else {
    var errorMessage = "ranges are only supported on fields of type 'number'"
    throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }

  parser.currentRange = {}

  if (lexeme.str == "*") {
    parser.currentRange.start = "*"
  } else {
    parser.currentRange.start = parseFloat(lexeme.str)
    if (isNaN(parser.currentRange.start)) {
      var errorMessage = "range start must be numeric or '*'"
      throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
    }
  }

  parser.currentClause.usePipeline = false

  var nextLexeme = parser.peekLexeme()

  if (nextLexeme == undefined) {
    var errorMessage = "expecting range end, found nothing"
    throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }

  switch (nextLexeme.type) {
    case lunr.QueryLexer.RANGE_END:
      return lunr.QueryParser.parseRangeEnd
    default:
      var errorMessage = "expecting range end, found '" + nextLexeme.type + "'"
      throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
  }
}

/** @type {lunr.QueryParser.parserState} */
lunr.QueryParser.parseRangeEnd = function (parser) {
  var lexeme = parser.consumeLexeme()

  if (lexeme == undefined) {
    return
  }

  if (!parser.currentRange) throw new Error()

  if (lexeme.str == "*") {
    parser.currentRange.end = "*"
  } else {
    parser.currentRange.end = parseFloat(lexeme.str)
    if (isNaN(parser.currentRange.end)) {
      var errorMessage = "range end must be numeric or '*'"
      throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
    }
  }

  parser.currentClause.term = /** @type {lunr.Query.RangeTerm} */(parser.currentRange)
  parser.currentRange = undefined

  var nextLexeme = parser.peekLexeme()

  if (nextLexeme == undefined) {
    parser.nextClause()
    return
  }

  switch (nextLexeme.type) {
    case lunr.QueryLexer.TERM:
      return lunr.QueryParser.parseTerm
    default:
      var errorMessage = "expecting term, found '" + nextLexeme.type + "'"
      throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
  }
}

/** @type {lunr.QueryParser.parserState} */
lunr.QueryParser.parseComparator = function (parser) {
  var lexeme = parser.consumeLexeme()

  if (lexeme == undefined) {
    return
  }

  if (parser.currentClause.fieldTypes) {
    for (const fieldType of parser.currentClause.fieldTypes) {
      if (fieldType !== "number") {
        var errorMessage = "comparators are only supported on fields of type 'number'"
        throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
      }
    }
  } else {
    var errorMessage = "comparators are only supported on fields of type 'number'"
    throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }

  parser.currentComparator = {}
  parser.currentClause.usePipeline = false

  switch (lexeme.str) {
    case "<":
    case "<=":
    case ">":
    case ">=":
      parser.currentComparator.comparator = lexeme.str
      break
  }

  var nextLexeme = parser.peekLexeme()

  if (nextLexeme == undefined) {
    var errorMessage = "expecting term, found nothing"
    throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }

  switch (nextLexeme.type) {
    case lunr.QueryLexer.COMPARAND:
      return lunr.QueryParser.parseComparand
    default:
      var errorMessage = "expecting comparand, found '" + nextLexeme.type + "'"
      throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
  }
}

/** @type {lunr.QueryParser.parserState} */
lunr.QueryParser.parseComparand = function (parser) {
  var lexeme = parser.consumeLexeme()

  if (lexeme == undefined) {
    return
  }

  if (!parser.currentComparator) throw new Error()

  parser.currentComparator.comparand = parseFloat(lexeme.str)
  if (isNaN(parser.currentComparator.comparand)) {
    var errorMessage = "comparand must be numeric"
    throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }

  parser.currentClause.term = /** @type {lunr.Query.ComparatorTerm} */(parser.currentComparator)
  parser.currentComparator = undefined

  var nextLexeme = parser.peekLexeme()

  if (nextLexeme == undefined) {
    parser.nextClause()
    return
  }

  switch (nextLexeme.type) {
    case lunr.QueryLexer.TERM:
      return lunr.QueryParser.parseTerm
    default:
      var errorMessage = "expecting term, found '" + nextLexeme.type + "'"
      throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
  }
}

/** @type {lunr.QueryParser.parserState} */
lunr.QueryParser.parseTerm = function (parser) {
  var lexeme = parser.consumeLexeme()

  if (lexeme == undefined) {
    return
  }

  parser.currentClause.term = lexeme.str.toLowerCase()

  if (lexeme.str.indexOf("*") != -1) {
    parser.currentClause.usePipeline = false
  }

  var nextLexeme = parser.peekLexeme()

  if (nextLexeme == undefined) {
    parser.nextClause()
    return
  }

  switch (nextLexeme.type) {
    case lunr.QueryLexer.TERM:
      parser.nextClause()
      return lunr.QueryParser.parseTerm
    case lunr.QueryLexer.FIELD:
      parser.nextClause()
      return lunr.QueryParser.parseField
    case lunr.QueryLexer.EDIT_DISTANCE:
      return lunr.QueryParser.parseEditDistance
    case lunr.QueryLexer.BOOST:
      return lunr.QueryParser.parseBoost
    case lunr.QueryLexer.PRESENCE:
      parser.nextClause()
      return lunr.QueryParser.parsePresence
    default:
      var errorMessage = "Unexpected lexeme type '" + nextLexeme.type + "'"
      throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
  }
}

/** @type {lunr.QueryParser.parserState} */
lunr.QueryParser.parseEditDistance = function (parser) {
  var lexeme = parser.consumeLexeme()

  if (lexeme == undefined) {
    return
  }

  var editDistance = parseInt(lexeme.str, 10)

  if (isNaN(editDistance)) {
    var errorMessage = "edit distance must be numeric"
    throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }

  parser.currentClause.editDistance = editDistance

  var nextLexeme = parser.peekLexeme()

  if (nextLexeme == undefined) {
    parser.nextClause()
    return
  }

  switch (nextLexeme.type) {
    case lunr.QueryLexer.TERM:
      parser.nextClause()
      return lunr.QueryParser.parseTerm
    case lunr.QueryLexer.FIELD:
      parser.nextClause()
      return lunr.QueryParser.parseField
    case lunr.QueryLexer.EDIT_DISTANCE:
      return lunr.QueryParser.parseEditDistance
    case lunr.QueryLexer.BOOST:
      return lunr.QueryParser.parseBoost
    case lunr.QueryLexer.PRESENCE:
      parser.nextClause()
      return lunr.QueryParser.parsePresence
    default:
      var errorMessage = "Unexpected lexeme type '" + nextLexeme.type + "'"
      throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
  }
}

/** @type {lunr.QueryParser.parserState} */
lunr.QueryParser.parseBoost = function (parser) {
  var lexeme = parser.consumeLexeme()

  if (lexeme == undefined) {
    return
  }

  var boost = parseInt(lexeme.str, 10)

  if (isNaN(boost)) {
    var errorMessage = "boost must be numeric"
    throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }

  parser.currentClause.boost = boost

  var nextLexeme = parser.peekLexeme()

  if (nextLexeme == undefined) {
    parser.nextClause()
    return
  }

  switch (nextLexeme.type) {
    case lunr.QueryLexer.TERM:
      parser.nextClause()
      return lunr.QueryParser.parseTerm
    case lunr.QueryLexer.FIELD:
      parser.nextClause()
      return lunr.QueryParser.parseField
    case lunr.QueryLexer.EDIT_DISTANCE:
      return lunr.QueryParser.parseEditDistance
    case lunr.QueryLexer.BOOST:
      return lunr.QueryParser.parseBoost
    case lunr.QueryLexer.PRESENCE:
      parser.nextClause()
      return lunr.QueryParser.parsePresence
    default:
      var errorMessage = "Unexpected lexeme type '" + nextLexeme.type + "'"
      throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
  }
}

/**
 * @callback lunr.QueryParser.parserState
 * @param {lunr.QueryParser} parser
 * @returns {lunr.QueryParser.parserState | void}
 */