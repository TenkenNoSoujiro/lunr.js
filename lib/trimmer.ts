/*!
 * lunr.trimmer
 * Copyright (C) @YEAR Oliver Nightingale
 */

// @ts-ignore
namespace lunr {
  /**
   * lunr.trimmer is a pipeline function for trimming non word
   * characters from the beginning and end of tokens before they
   * enter the index.
   *
   * This implementation may not work correctly for non latin
   * characters and should either be removed or adapted for use
   * with languages with non-latin characters.
   *
   * @param token The token to pass through the filter
   * @see lunr.Pipeline
   */
  export const trimmer = function (token: lunr.Token) {
    return token.update(s => {
      return s.replace(/^\W+/g, '').replace(/\W+$/, '')
    })
  }

  lunr.Pipeline.registerFunction(trimmer, 'trimmer')
}