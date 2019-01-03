// @ts-ignore
namespace lunr.NumberMap {
  export class Builder {
    private map: Record<string, Entry> = Object.create(null)

    constructor () {
      this.map = Object.create(null)
    }

    add (value: number, token: string) {
      const entry = this.map[value]
      if (entry) {
        entry.tokens.push(token)
      } else {
        this.map[value] = { value, tokens: [token] }
      }
    }

    build () {
      return new NumberMap(Object
        .values(this.map)
        .sort(NumberMap.Builder.compareEntries))
    }

    private static compareEntries (a: Entry, b: Entry) {
      return a.value - b.value
    }
  }
}