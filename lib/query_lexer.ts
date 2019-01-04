// @ts-ignore
namespace lunr {
  /** @hidden */
  export namespace QueryLexer {
    export type LexemeType =
      | "EOS"
      | "FIELD"
      | "TERM"
      | "EDIT_DISTANCE"
      | "BOOST"
      | "PRESENCE"
      | "COMPARATOR"
      | "COMPARAND"
      | "RANGE_START"
      | "RANGE_END"

    export interface Lexeme {
      type: LexemeType;
      str: string;
      start: number;
      end: number;
    }
  }

  /** @hidden */
  export class QueryLexer {
    static readonly EOS = "EOS"
    static readonly FIELD = "FIELD"
    static readonly TERM = "TERM"
    static readonly EDIT_DISTANCE = "EDIT_DISTANCE"
    static readonly BOOST = "BOOST"
    static readonly PRESENCE = "PRESENCE"
    static readonly COMPARATOR = "COMPARATOR"
    static readonly COMPARAND = "COMPARAND"
    static readonly RANGE_START = "RANGE_START"
    static readonly RANGE_END = "RANGE_END"

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
    static termSeparator = lunr.tokenizer.separator

    lexemes: QueryLexer.Lexeme[] = []
    str: string
    length: number
    pos = 0
    start = 0
    escapeCharPositions: number[] = []

    constructor (str: string) {
      this.str = str
      this.length = str.length
    }

    run () {
      let state: lexerState | void = lexText
      while (state) {
        state = state(this)
      }
    }

    sliceString () {
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
     * @param {LexemeType} type
     */
    emit (type: QueryLexer.LexemeType) {
      this.lexemes.push({
        type: type,
        str: this.sliceString(),
        start: this.start,
        end: this.pos
      })

      this.start = this.pos
    }

    escapeCharacter () {
      this.escapeCharPositions.push(this.pos - 1)
      this.pos += 1
    }

    next () {
      if (this.pos >= this.length) {
        return QueryLexer.EOS
      }

      var char = this.str.charAt(this.pos)
      this.pos += 1
      return char
    }

    peek () {
      if (this.pos >= this.length) {
        return QueryLexer.EOS
      }

      var char = this.str.charAt(this.pos)
      return char
    }

    width () {
      return this.pos - this.start
    }

    ignore () {
      if (this.start == this.pos) {
        this.pos += 1
      }

      this.start = this.pos
    }

    backup () {
      this.pos -= 1
    }

    acceptDigitRun () {
      var char, charCode

      do {
        char = this.next()
        charCode = char.charCodeAt(0)
      } while (charCode > 47 && charCode < 58)

      if (char != QueryLexer.EOS) {
        this.backup()
      }
    }

    more () {
      return this.pos < this.length
    }
  }

  /** @hidden */
  type lexerState = (lexer: QueryLexer) => lexerState | void

  /** @hidden */
  const lexField: lexerState = lexer => {
    lexer.backup()
    lexer.emit(QueryLexer.FIELD)
    lexer.ignore()

    var char = lexer.peek()

    // "<", "<=", ">", or ">=" indicates a relational operator
    if ((char == ">" || char == "<") && lexer.width() === 0) {
      lexer.next()
      if (lexer.peek() == "=") lexer.next()
      lexer.emit(QueryLexer.COMPARATOR)
      lexer.acceptDigitRun()
      if (lexer.peek() == ".") lexer.next()
      lexer.acceptDigitRun()
      lexer.emit(QueryLexer.COMPARAND)
    }

    return lexText
  }

  /** @hidden */
  const lexRange: lexerState = lexer => {
    lexer.backup()
    if (lexer.width() > 0) {
      lexer.emit(QueryLexer.RANGE_START)
    }

    lexer.ignore() // .
    lexer.ignore() // .

    while (true) {
      var char = lexer.next()

      if (char == QueryLexer.EOS) {
        if (lexer.width() > 0) {
          lexer.emit(QueryLexer.RANGE_END)
        }
        return
      }

      if (char == ":" || char == "~" || char == "^" || char == "+" || char == "-" ||
          char == "." && lexer.peek() == "." ||
          char.match(QueryLexer.termSeparator)) {
        lexer.backup()
        if (lexer.width() > 0) {
          lexer.emit(QueryLexer.RANGE_END)
        }
        return lexText
      }

      // Escape character is '\'
      if (char.charCodeAt(0) == 92) {
        lexer.escapeCharacter()
        continue
      }
    }
  }

  /** @hidden */
  const lexTerm: lexerState = lexer => {
    if (lexer.width() > 1) {
      lexer.backup()
      lexer.emit(QueryLexer.TERM)
    }

    lexer.ignore()

    if (lexer.more()) {
      return lexText
    }
  }

  /** @hidden */
  const lexEditDistance: lexerState = lexer => {
    lexer.ignore()
    lexer.acceptDigitRun()
    lexer.emit(QueryLexer.EDIT_DISTANCE)
    return lexText
  }

  /** @hidden */
  const lexBoost: lexerState = lexer => {
    lexer.ignore()
    lexer.acceptDigitRun()
    lexer.emit(QueryLexer.BOOST)
    return lexText
  }

  /** @hidden */
  const lexEOS: lexerState = lexer => {
    if (lexer.width() > 0) {
      lexer.emit(QueryLexer.TERM)
    }
  }

  /** @hidden */
  const lexText: lexerState = lexer => {
    while (true) {
      var char = lexer.next()

      if (char == QueryLexer.EOS) {
        return lexEOS
      }

      // Escape character is '\'
      if (char.charCodeAt(0) == 92) {
        lexer.escapeCharacter()
        continue
      }

      if (char == ":") {
        return lexField
      }

      if (char == "~") {
        lexer.backup()
        if (lexer.width() > 0) {
          lexer.emit(QueryLexer.TERM)
        }
        return lexEditDistance
      }

      if (char == "^") {
        lexer.backup()
        if (lexer.width() > 0) {
          lexer.emit(QueryLexer.TERM)
        }
        return lexBoost
      }

      // possible range?
      if (char == "." && lexer.peek() == ".") {
        return lexRange
      }

      // "+" indicates term presence is required
      // checking for length to ensure that only
      // leading "+" are considered
      if (char == "+" && lexer.width() === 1) {
        lexer.emit(QueryLexer.PRESENCE)
        return lexText
      }

      // "-" indicates term presence is prohibited
      // checking for length to ensure that only
      // leading "-" are considered
      if (char == "-" && lexer.width() === 1) {
        lexer.emit(QueryLexer.PRESENCE)
        return lexText
      }

      if (char.match(QueryLexer.termSeparator)) {
        return lexTerm
      }
    }
  }
}
