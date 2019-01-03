// @ts-ignore
namespace lunr {
  export class QueryParseError extends Error {
    start: number
    end: number
    constructor (message: string, start: number, end: number) {
      super(message)
      this.name = "QueryParseError"
      this.message = message
      this.start = start
      this.end = end
    }
  }
}