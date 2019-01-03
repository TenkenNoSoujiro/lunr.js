/*!
 * lunr.tokenizer
 * Copyright (C) @YEAR Oliver Nightingale
 */

// @ts-ignore
namespace lunr {
  /**
   * A function for splitting a string into tokens ready to be inserted into
   * the search index. Uses `lunr.tokenizer.separator` to split strings, change
   * the value of this property to change how strings are split into tokens.
   *
   * This tokenizer will convert its parameter to a string by calling `toString` and
   * then will split this string on the character in `lunr.tokenizer.separator`.
   * Arrays will have their elements converted to strings and wrapped in a lunr.Token.
   *
   * Optional metadata can be passed to the tokenizer, this metadata will be cloned and
   * added as metadata to every token that is created from the object to be tokenized.
   *
   * @param {string|object|object[]} [obj] The object to convert into tokens
   * @param {Object<string,*>} [metadata] Optional metadata to associate with every token
   * @returns {string[]}
   * @see {@link lunr.Pipeline}
   */
  export const tokenizer = function (obj: string | object | object[] | undefined, metadata: Record<string, any>): lunr.Token[] {
    if (obj == null || obj == undefined) {
      return []
    }

    if (Array.isArray(obj)) {
      return obj.map(function (t) {
        if (t instanceof lunr.Token) {
          return new lunr.Token(t.str.toLowerCase(), {
            ...lunr.utils.clone(t.metadata),
            ...lunr.utils.clone(metadata)
          })
        }
        return new lunr.Token(
          lunr.utils.asString(t).toLowerCase(),
          lunr.utils.clone(metadata)
        )
      })
    }

    if (obj instanceof lunr.Token) {
      return [new lunr.Token(obj.str.toLowerCase(), {
        ...lunr.utils.clone(obj.metadata),
        ...lunr.utils.clone(metadata)
      })]
    }

    let str = obj.toString().trim().toLowerCase(),
        len = str.length,
        tokens = []

    for (let sliceEnd = 0, sliceStart = 0; sliceEnd <= len; sliceEnd++) {
      let char = str.charAt(sliceEnd),
          sliceLength = sliceEnd - sliceStart

      if ((char.match(tokenizer.separator) || sliceEnd == len)) {

        if (sliceLength > 0) {
          let tokenMetadata = lunr.utils.clone(metadata) || {}
          tokenMetadata["position"] = [sliceStart, sliceLength]
          tokenMetadata["index"] = tokens.length

          tokens.push(
            new lunr.Token (
              str.slice(sliceStart, sliceEnd),
              tokenMetadata
            )
          )
        }

        sliceStart = sliceEnd + 1
      }

    }

    return tokens
  }

  /**
   * The separator used to split a string into tokens. Override this property to change the behaviour of
   * `lunr.tokenizer` behaviour when tokenizing strings. By default this splits on whitespace and hyphens.
   *
   * @see {@link lunr.tokenizer}
   */
  tokenizer.separator = /[\s-]+/
}