/*!
 * lunr.Pipeline
 * Copyright (C) @YEAR Oliver Nightingale
 */

// @ts-ignore
namespace lunr {
  /**
   * A pipeline function maps lunr.Token to lunr.Token. A lunr.Token contains the token
   * string as well as all known metadata. A pipeline function can mutate the token string
   * or mutate (or add) metadata for a given token.
   *
   * A pipeline function can indicate that the passed token should be discarded by returning
   * null, undefined, or an empty string. This token will not be passed to any downstream pipeline
   * functions and will not be added to the index.
   *
   * Multiple tokens can be returned by returning an array of tokens. Each token will be passed
   * to any downstream pipeline functions and all will returned tokens will be added to the index.
   *
   * Any number of pipeline functions may be chained together using a lunr.Pipeline.
   *
   * @interface lunr.PipelineFunction
   * @param {lunr.Token} token - A token from the document being processed.
   * @param {number} i - The index of this token in the complete list of tokens for this document/field.
   * @param {lunr.Token[]} tokens - All tokens for this document/field.
   * @returns {(?lunr.Token|lunr.Token[])}
   */

  /**
   * lunr.Pipelines maintain an ordered list of functions to be applied to all
   * tokens in documents entering the search index and queries being ran against
   * the index.
   *
   * An instance of lunr.Index created with the lunr shortcut will contain a
   * pipeline with a stop word filter and an English language stemmer. Extra
   * functions can be added before or after either of these functions or these
   * default functions can be removed.
   *
   * When run the pipeline will call each function in turn, passing a token, the
   * index of that token in the original list of all tokens and finally a list of
   * all the original tokens.
   *
   * The output of functions in the pipeline will be passed to the next function
   * in the pipeline. To exclude a token from entering the index the function
   * should return undefined, the rest of the pipeline will not be called with
   * this token.
   *
   * For serialisation of pipelines to work, all functions used in an instance of
   * a pipeline should be registered with lunr.Pipeline. Registered functions can
   * then be loaded. If trying to load a serialised pipeline that uses functions
   * that are not registered an error will be thrown.
   *
   * If not planning on serialising the pipeline then registering pipeline functions
   * is not necessary.
   *
   * @memberOf lunr
   */
  export class Pipeline {
    static readonly registeredFunctions: Record<string, lunr.PipelineFunction> = Object.create(null)

    _stack: lunr.PipelineFunction[]

    constructor () {
      this._stack = []
    }

    /**
     * Register a function with the pipeline.
     *
     * Functions that are used in the pipeline should be registered if the pipeline
     * needs to be serialised, or a serialised pipeline needs to be loaded.
     *
     * Registering a function does not add it to a pipeline, functions must still be
     * added to instances of the pipeline for them to be used when running a pipeline.
     *
     * @param {lunr.PipelineFunction} fn The function to check for.
     * @param {string} label The label to register this function with
     */
    static registerFunction (fn: lunr.PipelineFunction, label: string) {
      if (label in this.registeredFunctions) {
        lunr.utils.warn('Overwriting existing registered function: ' + label)
      }

      fn.label = label
      Pipeline.registeredFunctions[fn.label] = fn
    }

    /**
     * Warns if the function is not registered as a Pipeline function.
     *
     * @private
     * @param {lunr.PipelineFunction} fn The function to check for.
     */
    static warnIfFunctionNotRegistered (fn: lunr.PipelineFunction) {
      let isRegistered = fn.label && (fn.label in this.registeredFunctions)

      if (!isRegistered) {
        lunr.utils.warn('Function is not registered with pipeline. This may cause problems when serialising the index.\n', fn)
      }
    }

    /**
     * Loads a previously serialised pipeline.
     *
     * All functions to be loaded must already be registered with lunr.Pipeline.
     * If any function from the serialised data has not been registered then an
     * error will be thrown.
     *
     * @param {string[]} serialised - The serialised pipeline to load.
     * @returns {lunr.Pipeline}
     */
    static load (serialised: string[]): lunr.Pipeline {
      let pipeline = new lunr.Pipeline

      serialised.forEach(function (fnName) {
        let fn = Pipeline.registeredFunctions[fnName]

        if (fn) {
          pipeline.add(fn)
        } else {
          throw new Error('Cannot load unregistered function: ' + fnName)
        }
      })

      return pipeline
    }

    /**
     * Adds new functions to the end of the pipeline.
     *
     * Logs a warning if the function has not been registered.
     *
     * @param {...lunr.PipelineFunction} functions Any number of functions to add to the pipeline.
     */
    add (...functions: lunr.PipelineFunction[]) {
      functions.forEach((fn) => {
        Pipeline.warnIfFunctionNotRegistered(fn)
        this._stack.push(fn)
      })
    }

    /**
     * Adds a single function after a function that already exists in the
     * pipeline.
     *
     * Logs a warning if the function has not been registered.
     *
     * @param {lunr.PipelineFunction} existingFn A function that already exists in the pipeline.
     * @param {lunr.PipelineFunction} newFn The new function to add to the pipeline.
     */
    after (existingFn: lunr.PipelineFunction, newFn: lunr.PipelineFunction) {
      Pipeline.warnIfFunctionNotRegistered(newFn)

      let pos = this._stack.indexOf(existingFn)
      if (pos == -1) {
        throw new Error('Cannot find existingFn')
      }

      pos = pos + 1
      this._stack.splice(pos, 0, newFn)
    }

    /**
     * Adds a single function before a function that already exists in the
     * pipeline.
     *
     * Logs a warning if the function has not been registered.
     *
     * @param {lunr.PipelineFunction} existingFn A function that already exists in the pipeline.
     * @param {lunr.PipelineFunction} newFn The new function to add to the pipeline.
     */
    before (existingFn: lunr.PipelineFunction, newFn: lunr.PipelineFunction) {
      Pipeline.warnIfFunctionNotRegistered(newFn)

      let pos = this._stack.indexOf(existingFn)
      if (pos == -1) {
        throw new Error('Cannot find existingFn')
      }

      this._stack.splice(pos, 0, newFn)
    }

    /**
     * Removes a function from the pipeline.
     *
     * @param {lunr.PipelineFunction} fn The function to remove from the pipeline.
     */
    remove (fn: lunr.PipelineFunction) {
      let pos = this._stack.indexOf(fn)
      if (pos == -1) {
        return
      }

      this._stack.splice(pos, 1)
    }

    /**
     * Runs the current list of functions that make up the pipeline against the
     * passed tokens.
     *
     * @param {lunr.Token[]} tokens The tokens to run through the pipeline.
     */
    run (tokens: lunr.Token[]): lunr.Token[] {
      for (const fn of this._stack) {
        let memo: lunr.Token[] = []

        for (let j = 0; j < tokens.length; j++) {
          let result = fn(tokens[j], j, tokens)

          if (result === null || result === void 0 || result === '') continue

          if (Array.isArray(result)) {
            for (let k = 0; k < result.length; k++) {
              memo.push(result[k])
            }
          } else {
            memo.push(result)
          }
        }

        tokens = memo
      }

      return tokens
    }

    /**
     * Convenience method for passing a string through a pipeline and getting
     * strings out. This method takes care of wrapping the passed string in a
     * token and mapping the resulting tokens back to strings.
     *
     * @param {string} str The string to pass through the pipeline.
     * @param {Object<string, *>} metadata Optional metadata to associate with the token
     * passed to the pipeline.
     */
    runString (str: string, metadata?: Record<string, any>) {
      let token = new lunr.Token (str, metadata)

      return this.run([token]).map(function (t) {
        return t.toString()
      })
    }

    /**
     * Resets the pipeline by removing any existing processors.
     *
     */
    reset () {
      this._stack = []
    }

    /**
     * Returns a representation of the pipeline ready for serialisation.
     *
     * Logs a warning if the function has not been registered.
     */
    toJSON (): string[] {
      return this._stack.map(function (fn) {
        Pipeline.warnIfFunctionNotRegistered(fn)

        return fn.label!
      })
    }
  }

  /**
   * A pipeline function maps lunr.Token to lunr.Token. A lunr.Token contains the token
   * string as well as all known metadata. A pipeline function can mutate the token string
   * or mutate (or add) metadata for a given token.
   *
   * A pipeline function can indicate that the passed token should be discarded by returning
   * null, undefined, or an empty string. This token will not be passed to any downstream pipeline
   * functions and will not be added to the index.
   *
   * Multiple tokens can be returned by returning an array of tokens. Each token will be passed
   * to any downstream pipeline functions and all will returned tokens will be added to the index.
   *
   * Any number of pipeline functions may be chained together using a lunr.Pipeline.
   */
  export interface PipelineFunction {
    /**
     * @param token A token from the document being processed.
     * @param i The index of this token in the complete list of tokens for this document/field.
     * @param tokens All tokens for this document/field.
     */
    (token: lunr.Token, i: number, tokens: lunr.Token[]): lunr.Token | lunr.Token[] | '' | null | undefined
    label?: string
  }
}