// @ts-ignore
namespace lunr {
  /**
   * @memberOf lunr
   */
  export class NumberMap {
    entries: NumberMap.Entry[]

    constructor (entries: NumberMap.Entry[]) {
      this.entries = entries
    }

    matchComparator (comparator: lunr.Query.comparator, comparand: number) {
      let index = this.binarySearch(comparand),
          startIndex = 0,
          endIndex = this.entries.length
      switch (comparator) {
        case lunr.Query.comparator.GREATERTHAN:
          startIndex = (index < 0 ? ~index : index) + 1
          break
        case lunr.Query.comparator.GREATERTHAN_EQUALS:
          startIndex = index < 0 ? ~index + 1 : index
          break
        case lunr.Query.comparator.LESSTHAN:
          endIndex = index < 0 ? ~index + 1 : index
          break
        case lunr.Query.comparator.LESSTHAN_EQUALS:
          endIndex = (index < 0 ? ~index : index) + 1
          break
        default:
          endIndex = 0
          break
      }
      return this.collectTokens(startIndex, endIndex)
    }

    matchRange (start: "*" | number, end: "*" | number) {
      let startIndex = start == "*" ? 0 : this.binarySearch(start)
      if (startIndex < 0) {
        startIndex = ~startIndex + 1
      }

      let endIndex = end == "*" ? this.entries.length : this.binarySearch(end)
      if (endIndex < 0) {
        endIndex = ~endIndex
      }

      return this.collectTokens(startIndex, endIndex)
    }

    private collectTokens (startIndex: number, endIndex: number) {
      let result: string[] = []
      if (startIndex < this.entries.length && endIndex > 0) {
        if (startIndex < 0) startIndex = 0
        if (endIndex > this.entries.length) endIndex = this.entries.length
        while (startIndex < endIndex) {
          result = result.concat(this.entries[startIndex++].tokens)
        }
      }
      return lunr.TokenSet.fromArray(result.sort())
    }

    private static selectValue (entry: NumberMap.Entry) {
      return entry.value
    }

    private binarySearch (value: number) {
      return lunr.utils.binarySearchKey(this.entries, value, NumberMap.selectValue, lunr.utils.compareNumbers, 1)
    }

    static fromInvertedIndex (invertedIndex: lunr.Index.InvertedIndex) {
      const numbersBuilder = new NumberMap.Builder()
      for (const term of Object.keys(invertedIndex)) {
        const number = parseFloat(term)
        if (isFinite(number)) {
          numbersBuilder.add(number, term)
        }
      }
      return numbersBuilder.build()
    }
  }

  export namespace NumberMap {
    export interface Entry {
      value: number
      tokens: string[]
    }
  }
}