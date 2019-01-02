lunr.NumberMap = class NumberMap {
  /** @param {{ value: number, tokens: string[] }[]} entries */
  constructor (entries) {
    this.entries = entries
  }

  /**
   * @param {lunr.Query.operator} comparator
   * @param {number} comparand
   */
  matchComparator (comparator, comparand) {
    var index = this.binarySearch(comparand),
        startIndex = 0,
        endIndex = this.entries.length
    switch (comparator) {
      case lunr.Query.operator.GREATERTHAN:
        startIndex = (index < 0 ? ~index : index) + 1
        break
      case lunr.Query.operator.GREATERTHAN_EQUALS:
        startIndex = index < 0 ? ~index + 1 : index
        break
      case lunr.Query.operator.LESSTHAN:
        endIndex = index < 0 ? ~index + 1 : index
        break
      case lunr.Query.operator.LESSTHANEQUALS:
        endIndex = (index < 0 ? ~index : index) + 1
        break
      default:
        endIndex = 0
        break
    }
    return this.collectTokens(startIndex, endIndex)
  }

  /**
   * @param {"*" | number} start
   * @param {"*" | number} end
   */
  matchRange (start, end) {
    var startIndex = start == "*" ? 0 : this.binarySearch(start)
    if (startIndex < 0) {
      startIndex = ~startIndex + 1
    }

    var endIndex = end == "*" ? this.entries.length : this.binarySearch(end)
    if (endIndex < 0) {
      endIndex = ~endIndex
    }

    return this.collectTokens(startIndex, endIndex)
  }

  /**
   * @private
   * @param {number} startIndex
   * @param {number} endIndex
   */
  collectTokens (startIndex, endIndex) {
    /** @type {string[]} */
    var result = []
    if (startIndex < this.entries.length && endIndex > 0) {
      if (startIndex < 0) startIndex = 0
      if (endIndex > this.entries.length) endIndex = this.entries.length
      while (startIndex < endIndex) {
        result = result.concat(this.entries[startIndex++].tokens)
      }
    }
    return lunr.TokenSet.fromArray(result.sort())
  }

  /**
   * @private
   * @param {number} value
   * @returns {number}
   */
  binarySearch (value) {
    var l = 0,
        h = this.entries.length - 1
    while (l <= h) {
      var m = l + ((h - l) >> 1),
          mv = this.entries[m].value,
          r = mv - value
      if (r < 0) {
        l = m + 1
      } else if (r > 0) {
        h = m - 1
      } else {
        return m
      }
    }
    return ~l
  }

  /**
   * @param {lunr.Index.InvertedIndex} invertedIndex
   */
  static fromInvertedIndex (invertedIndex) {
    const numbersBuilder = new lunr.NumberMap.Builder()
    for (const term of Object.keys(invertedIndex)) {
      const number = parseFloat(term)
      if (isFinite(number)) {
        numbersBuilder.add(number, term)
      }
    }
    return numbersBuilder.build()
  }
}

lunr.NumberMap.Builder = class Builder {
  constructor () {
    /** @type {Record<number, lunr.NumberMap.Entry>} */
    this.map = Object.create(null)
  }

  /**
   * @param {number} value
   * @param {string} token
   */
  add (value, token) {
    const entry = this.map[value]
    if (entry) {
      entry.tokens.push(token)
    } else {
      this.map[value] = { value, tokens: [token] }
    }
  }

  build () {
    return new lunr.NumberMap(Object
      .values(this.map)
      .sort(lunr.NumberMap.Builder.compareEntries))
  }

  /**
   * @private
   * @param {lunr.NumberMap.Entry} a
   * @param {lunr.NumberMap.Entry} b
   */
  static compareEntries (a, b) {
    return a.value - b.value
  }
}

/**
 * @typedef lunr.NumberMap.Entry
 * @property {number} value
 * @property {string[]} tokens
 */
