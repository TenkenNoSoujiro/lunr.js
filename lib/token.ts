// @ts-ignore
namespace lunr {
  /**
   * A token wraps a string representation of a token
   * as it is passed through the text processing pipeline.
   *
   * @memberOf lunr
   * @property {string} str The string token being wrapped.
   * @property {Object<string, any>} metadata Metadata associated with this token.
   */
  export class Token {
    str: string
    metadata: Record<string, any>

    /**
     * @param {string} [str] The string token being wrapped.
     * @param {Object<string, any>} [metadata] Metadata associated with this token.
     */
    constructor (str: string = "", metadata: Record<string, any> = {}) {
      this.str = str
      this.metadata = metadata
    }

    /**
     * Returns the token string that is being wrapped by this object.
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
     * @param {lunr.Token~updateFunction} fn A function to apply to the token string.
     * @returns {lunr.Token}
     */
    update (fn: Token.updateFunction): Token {
      this.str = fn(this.str, this.metadata)
      return this
    }

    /**
     * Creates a clone of this token. Optionally a function can be
     * applied to the cloned token.
     *
     * @param {lunr.Token~updateFunction} fn - An optional function to apply to the cloned token.
     * @returns {lunr.Token}
     */
    clone (fn: Token.updateFunction = s => s): Token {
      return new Token (fn(this.str, this.metadata), this.metadata)
    }
  }

  export namespace Token {
    /**
     * A token update function is used when updating or optionally
     * when cloning a token.
     */
    export type updateFunction =
      /**
       * @param str The string representation of the token.
       * @param metadata All metadata associated with this token.
       */
      (str: string, metadata: Record<string, any>) => string
  }
}

/**
 * A token update function is used when updating or optionally
 * when cloning a token.
 *
 * @callback lunr.Token~updateFunction
 * @param {string} str The string representation of the token.
 * @param {Object<string, any>} metadata All metadata associated with this token.
 * @returns {string}
 */
