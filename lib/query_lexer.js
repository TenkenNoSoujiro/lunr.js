lunr.QueryLexer = class QueryLexer {
  /**
   * @param {string} str 
   */
  constructor(str) {
    /** @type {lunr.QueryLexer.Lexeme[]} */
    this.lexemes = []
    /** @type {string} */
    this.str = str
    /** @type {number} */
    this.length = str.length
    /** @type {number} */
    this.pos = 0
    /** @type {number} */
    this.start = 0
    /** @type {number[]} */
    this.escapeCharPositions = []
  }

  run() {
    /** @type {lunr.QueryLexer.lexerState | void} */
    var state = lunr.QueryLexer.lexText
    while (state) {
      state = state(this)
    }
  }

  sliceString() {
    var subSlices = [],
        sliceStart = this.start,
        sliceEnd = this.pos

    for (var i = 0; i < this.escapeCharPositions.length; i++) {
      sliceEnd = this.escapeCharPositions[i]
      subSlices.push(this.str.slice(sliceStart, sliceEnd))
      sliceStart = sliceEnd + 1
    }

    subSlices.push(this.str.slice(sliceStart, this.pos))
    this.escapeCharPositions.length = 0

    return subSlices.join('')
  }

  /**
   * @param {"EOS" | "FIELD" | "TERM" | "EDIT_DISTANCE" | "BOOST" | "PRESENCE"} type 
   */
  emit(type) {
    this.lexemes.push({
      type: type,
      str: this.sliceString(),
      start: this.start,
      end: this.pos
    })

    this.start = this.pos
  }

  escapeCharacter() {
    this.escapeCharPositions.push(this.pos - 1)
    this.pos += 1
  }

  next() {
    if (this.pos >= this.length) {
      return lunr.QueryLexer.EOS
    }

    var char = this.str.charAt(this.pos)
    this.pos += 1
    return char
  }

  width() {
    return this.pos - this.start
  }

  ignore() {
    if (this.start == this.pos) {
      this.pos += 1
    }

    this.start = this.pos
  }

  backup() {
    this.pos -= 1
  }

  acceptDigitRun() {
    var char, charCode

    do {
      char = this.next()
      charCode = char.charCodeAt(0)
    } while (charCode > 47 && charCode < 58)

    if (char != lunr.QueryLexer.EOS) {
      this.backup()
    }
  }

  more() {
    return this.pos < this.length
  }
}

/** @type {"EOS"} */
lunr.QueryLexer.EOS = 'EOS'
/** @type {"FIELD"} */
lunr.QueryLexer.FIELD = 'FIELD'
/** @type {"TERM"} */
lunr.QueryLexer.TERM = 'TERM'
/** @type {"EDIT_DISTANCE"} */
lunr.QueryLexer.EDIT_DISTANCE = 'EDIT_DISTANCE'
/** @type {"BOOST"} */
lunr.QueryLexer.BOOST = 'BOOST'
/** @type {"PRESENCE"} */
lunr.QueryLexer.PRESENCE = 'PRESENCE'

/** @type {lunr.QueryLexer.lexerState} */
lunr.QueryLexer.lexField = function (lexer) {
  lexer.backup()
  lexer.emit(lunr.QueryLexer.FIELD)
  lexer.ignore()
  return lunr.QueryLexer.lexText
}

/** @type {lunr.QueryLexer.lexerState} */
lunr.QueryLexer.lexTerm = function (lexer) {
  if (lexer.width() > 1) {
    lexer.backup()
    lexer.emit(lunr.QueryLexer.TERM)
  }

  lexer.ignore()

  if (lexer.more()) {
    return lunr.QueryLexer.lexText
  }
}

/** @type {lunr.QueryLexer.lexerState} */
lunr.QueryLexer.lexEditDistance = function (lexer) {
  lexer.ignore()
  lexer.acceptDigitRun()
  lexer.emit(lunr.QueryLexer.EDIT_DISTANCE)
  return lunr.QueryLexer.lexText
}

/** @type {lunr.QueryLexer.lexerState} */
lunr.QueryLexer.lexBoost = function (lexer) {
  lexer.ignore()
  lexer.acceptDigitRun()
  lexer.emit(lunr.QueryLexer.BOOST)
  return lunr.QueryLexer.lexText
}

/** @type {lunr.QueryLexer.lexerState} */
lunr.QueryLexer.lexEOS = function (lexer) {
  if (lexer.width() > 0) {
    lexer.emit(lunr.QueryLexer.TERM)
  }
}

// This matches the separator used when tokenising fields
// within a document. These should match otherwise it is
// not possible to search for some tokens within a document.
//
// It is possible for the user to change the separator on the
// tokenizer so it _might_ clash with any other of the special
// characters already used within the search string, e.g. :.
//
// This means that it is possible to change the separator in
// such a way that makes some words unsearchable using a search
// string.
lunr.QueryLexer.termSeparator = lunr.tokenizer.separator

/** @type {lunr.QueryLexer.lexerState} */
lunr.QueryLexer.lexText = function (lexer) {
  while (true) {
    var char = lexer.next()

    if (char == lunr.QueryLexer.EOS) {
      return lunr.QueryLexer.lexEOS
    }

    // Escape character is '\'
    if (char.charCodeAt(0) == 92) {
      lexer.escapeCharacter()
      continue
    }

    if (char == ":") {
      return lunr.QueryLexer.lexField
    }

    if (char == "~") {
      lexer.backup()
      if (lexer.width() > 0) {
        lexer.emit(lunr.QueryLexer.TERM)
      }
      return lunr.QueryLexer.lexEditDistance
    }

    if (char == "^") {
      lexer.backup()
      if (lexer.width() > 0) {
        lexer.emit(lunr.QueryLexer.TERM)
      }
      return lunr.QueryLexer.lexBoost
    }

    // "+" indicates term presence is required
    // checking for length to ensure that only
    // leading "+" are considered
    if (char == "+" && lexer.width() === 1) {
      lexer.emit(lunr.QueryLexer.PRESENCE)
      return lunr.QueryLexer.lexText
    }

    // "-" indicates term presence is prohibited
    // checking for length to ensure that only
    // leading "-" are considered
    if (char == "-" && lexer.width() === 1) {
      lexer.emit(lunr.QueryLexer.PRESENCE)
      return lunr.QueryLexer.lexText
    }

    if (char.match(lunr.QueryLexer.termSeparator)) {
      return lunr.QueryLexer.lexTerm
    }
  }
}

/**
 * @typedef lunr.QueryLexer.Lexeme
 * @property {"EOS" | "FIELD" | "TERM" | "EDIT_DISTANCE" | "BOOST" | "PRESENCE"} type
 * @property {string} str
 * @property {number} start
 * @property {number} end
 */

/**
 * @callback lunr.QueryLexer.lexerState
 * @param {lunr.QueryLexer} lexer
 * @returns {lunr.QueryLexer.lexerState | void}
 */