lunr.QueryParseError = class QueryParseError extends Error {
  /**
   * @param {string} message 
   * @param {number} start 
   * @param {number} end 
   */
  constructor (message, start, end) {
    super(message);
    this.name = "QueryParseError"
    this.message = message
    this.start = start
    this.end = end
  }
}