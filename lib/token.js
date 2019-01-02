/**
 * A token wraps a string representation of a token
 * as it is passed through the text processing pipeline.
 */
lunr.Token = class Token {
  /**
   * @param {string} [str=''] - The string token being wrapped.
   * @param {object} [metadata={}] - Metadata associated with this token.
   */
  constructor (str, metadata) {
    /** @type {string} */
    this.str = str || ""
    /** @type {object} */
    this.metadata = metadata || {}
  }

  /**
   * Returns the token string that is being wrapped by this object.
   *
   * @returns {string}
   */
  toString () {
    return this.str
  }

  /**
   * Applies the given function to the wrapped string token.
   *
   * @example
   * token.update(function (str, metadata) {
   *   return str.toUpperCase()
   * })
   *
   * @param {lunr.Token.updateFunction} fn - A function to apply to the token string.
   * @returns {lunr.Token}
   */
  update (fn) {
    this.str = fn(this.str, this.metadata)
    return this
  }

  /**
   * Creates a clone of this token. Optionally a function can be
   * applied to the cloned token.
   *
   * @param {lunr.Token.updateFunction} [fn] - An optional function to apply to the cloned token.
   * @returns {lunr.Token}
   */
  clone (fn) {
    fn = fn || function (s) { return s }
    return new lunr.Token (fn(this.str, this.metadata), this.metadata)
  }
}

/**
 * A token update function is used when updating or optionally
 * when cloning a token.
 *
 * @callback lunr.Token.updateFunction
 * @param {string} str - The string representation of the token.
 * @param {Object} metadata - All metadata associated with this token.
 */