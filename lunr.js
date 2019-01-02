/**
 * lunr - http://lunrjs.com - A bit like Solr, but much smaller and not as bright - 2.3.5
 * Copyright (C) 2019 Oliver Nightingale
 * @license MIT
 */

;(function(){

/**
 * A convenience function for configuring and constructing
 * a new lunr Index.
 *
 * A lunr.Builder instance is created and the pipeline setup
 * with a trimmer, stop word filter and stemmer.
 *
 * This builder object is yielded to the configuration function
 * that is passed as a parameter, allowing the list of fields
 * and other builder parameters to be customised.
 *
 * All documents _must_ be added within the passed config function.
 *
 * @example
 * var idx = lunr(function () {
 *   this.field('title')
 *   this.field('body')
 *   this.ref('id')
 *
 *   documents.forEach(function (doc) {
 *     this.add(doc)
 *   }, this)
 * })
 *
 * @see {@link lunr.Builder}
 * @see {@link lunr.Pipeline}
 * @see {@link lunr.trimmer}
 * @see {@link lunr.stopWordFilter}
 * @see {@link lunr.stemmer}
 * @namespace {function} lunr
 * @param {(this: lunr.Builder, builder: lunr.Builder) => void} config
 */
var lunr = function (config) {
  var builder = new lunr.Builder

  builder.pipeline.add(
    lunr.trimmer,
    lunr.stopWordFilter,
    lunr.stemmer
  )

  builder.searchPipeline.add(
    lunr.stemmer
  )

  config.call(builder, builder)
  return builder.build()
}

lunr.version = "2.3.5"
/*!
 * lunr.utils
 * Copyright (C) 2019 Oliver Nightingale
 */

/**
 * A namespace containing utils for the rest of the lunr library
 * @namespace lunr.utils
 */
lunr.utils = {}

/**
 * Print a warning message to the console.
 *
 * @param {String} message The message to be printed.
 * @memberOf lunr.utils
 * @function
 */
lunr.utils.warn = (function (global) {
  /* eslint-disable no-console */
  return /** @type {(message: string, ...unused: any[]) => void} */(function (message) {
    if (global.console && console.warn) {
      console.warn(message)
    }
  })
  /* eslint-enable no-console */
  // @ts-ignore
})(this)

/**
 * Convert an object to a string.
 *
 * In the case of `null` and `undefined` the function returns
 * the empty string, in all other cases the result of calling
 * `toString` on the passed object is returned.
 *
 * @param {*} obj The object to convert to a string.
 * @return {String} string representation of the passed object.
 * @memberOf lunr.utils
 */
lunr.utils.asString = function (obj) {
  if (obj === void 0 || obj === null) {
    return ""
  } else {
    return obj.toString()
  }
}

/**
 * Clones an object.
 *
 * Will create a copy of an existing object such that any mutations
 * on the copy cannot affect the original.
 *
 * Only shallow objects are supported, passing a nested object to this
 * function will cause a TypeError.
 *
 * Objects with primitives, and arrays of primitives are supported.
 *
 * @param {Object} obj The object to clone.
 * @return {Object} a clone of the passed object.
 * @throws {TypeError} when a nested object is passed.
 * @memberOf Utils
 */
lunr.utils.clone = function (obj) {
  if (obj === null || obj === undefined) {
    return obj
  }

  var clone = Object.create(null),
      keys = Object.keys(obj)

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i],
        val = obj[key]

    if (Array.isArray(val)) {
      clone[key] = val.slice()
      continue
    }

    if (typeof val === 'string' ||
        typeof val === 'number' ||
        typeof val === 'boolean') {
      clone[key] = val
      continue
    }

    throw new TypeError("clone is not deep and does not support nested objects")
  }

  return clone
}
lunr.FieldRef = class FieldRef {
  /**
   * @param {*} docRef
   * @param {string} fieldName
   * @param {string} [stringValue]
   */
  constructor (docRef, fieldName, stringValue) {
    this.docRef = docRef
    this.fieldName = fieldName
    this._stringValue = stringValue
  }

  toString () {
    if (this._stringValue == undefined) {
      this._stringValue = this.fieldName + lunr.FieldRef.joiner + this.docRef
    }
    return this._stringValue
  }
}

lunr.FieldRef.joiner = "/"

/**
 * @param {string} s
 */
lunr.FieldRef.fromString = function (s) {
  var n = s.indexOf(lunr.FieldRef.joiner)

  if (n === -1) {
    throw "malformed field ref string"
  }

  var fieldRef = s.slice(0, n),
      docRef = s.slice(n + 1)

  return new lunr.FieldRef (docRef, fieldRef, s)
}/*!
 * lunr.Set
 * Copyright (C) 2019 Oliver Nightingale
 */

/**
 * A lunr set.
 */
lunr.Set = class Set {
  /**
   * @param {object[]} [elements]
   */
  constructor (elements) {
    /** @type {Record<object, boolean>} */
    this.elements = Object.create(null)

    if (elements) {
      this.length = elements.length

      for (var i = 0; i < this.length; i++) {
        this.elements[elements[i]] = true
      }
    } else {
      this.length = 0
    }
  }

  /**
   * Returns true if this set contains the specified object.
   *
   * @param {object} object - Object whose presence in this set is to be tested.
   * @returns {boolean} - True if this set contains the specified object.
   */
  contains (object) {
    return !!this.elements[object]
  }

  /**
   * Returns a new set containing only the elements that are present in both
   * this set and the specified set.
   *
   * @param {lunr.Set} other - set to intersect with this set.
   * @returns {lunr.Set} a new set that is the intersection of this and the specified set.
   */

  intersect (other) {
    var a, b, elements, intersection = []

    if (other === lunr.Set.complete) {
      return this
    }

    if (other === lunr.Set.empty) {
      return other
    }

    if (this.length < other.length) {
      a = this
      b = other
    } else {
      a = other
      b = this
    }

    elements = Object.keys(a.elements)

    for (var i = 0; i < elements.length; i++) {
      var element = elements[i]
      if (element in b.elements) {
        intersection.push(element)
      }
    }

    return new lunr.Set (intersection)
  }

  /**
   * Returns a new set combining the elements of this and the specified set.
   *
   * @param {lunr.Set} other - set to union with this set.
   * @return {lunr.Set} a new set that is the union of this and the specified set.
   */

  union (other) {
    if (other === lunr.Set.complete) {
      return lunr.Set.complete
    }

    if (other === lunr.Set.empty) {
      return this
    }

    return new lunr.Set(Object.keys(this.elements).concat(Object.keys(other.elements)))
  }
}

/**
 * A complete set that contains all elements.
 *
 * @static
 * @readonly
 * @type {lunr.Set}
 */
lunr.Set.complete = /** @type {lunr.Set} */({
  /** @type {lunr.Set["intersect"]} */
  intersect: function (other) {
    return other
  },

  /** @type {lunr.Set["union"]} */
  union: function (other) {
    return other
  },

  /** @type {lunr.Set["contains"]} */
  contains: function () {
    return true
  }
})

/**
 * An empty set that contains no elements.
 *
 * @static
 * @readonly
 * @type {lunr.Set}
 */
lunr.Set.empty = /** @type {lunr.Set} */({
  /** @type {lunr.Set["intersect"]} */
  intersect: function () {
    return this
  },

  /** @type {lunr.Set["union"]} */
  union: function (other) {
    return other
  },

  /** @type {lunr.Set["contains"]} */
  contains: function () {
    return false
  }
})

/**
 * A function to calculate the inverse document frequency for
 * a posting. This is shared between the builder and the index
 *
 * @private
 * @param {object} posting - The posting for a given term
 * @param {number} documentCount - The total number of documents.
 */
lunr.idf = function (posting, documentCount) {
  var documentsWithTerm = 0

  for (var fieldName in posting) {
    if (fieldName == '_index') continue // Ignore the term index, its not a field
    documentsWithTerm += Object.keys(posting[fieldName]).length
  }

  var x = (documentCount - documentsWithTerm + 0.5) / (documentsWithTerm + 0.5)

  return Math.log(1 + Math.abs(x))
}

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
 *//*!
 * lunr.tokenizer
 * Copyright (C) 2019 Oliver Nightingale
 */

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
 * @static
 * @param {?(string|object|object[])} obj - The object to convert into tokens
 * @param {?object} metadata - Optional metadata to associate with every token
 * @returns {lunr.Token[]}
 * @see {@link lunr.Pipeline}
 */
lunr.tokenizer = function (obj, metadata) {
  if (obj == null || obj == undefined) {
    return []
  }

  if (Array.isArray(obj)) {
    return obj.map(function (t) {
      return new lunr.Token(
        lunr.utils.asString(t).toLowerCase(),
        lunr.utils.clone(metadata)
      )
    })
  }

  var str = obj.toString().trim().toLowerCase(),
      len = str.length,
      tokens = []

  for (var sliceEnd = 0, sliceStart = 0; sliceEnd <= len; sliceEnd++) {
    var char = str.charAt(sliceEnd),
        sliceLength = sliceEnd - sliceStart

    if ((char.match(lunr.tokenizer.separator) || sliceEnd == len)) {

      if (sliceLength > 0) {
        var tokenMetadata = lunr.utils.clone(metadata) || {}
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
 * @static
 * @see lunr.tokenizer
 */
lunr.tokenizer.separator = /[\s\-]+/
/*!
 * lunr.Pipeline
 * Copyright (C) 2019 Oliver Nightingale
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
 * @constructor
 */
lunr.Pipeline = class Pipeline {
  constructor () {
    /** @type {lunr.PipelineFunction[]} */
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
   * @param {lunr.PipelineFunction} fn - The function to check for.
   * @param {String} label - The label to register this function with
   */
  static registerFunction (fn, label) {
    if (label in this.registeredFunctions) {
      lunr.utils.warn('Overwriting existing registered function: ' + label)
    }

    fn.label = label
    lunr.Pipeline.registeredFunctions[fn.label] = fn
  }

  /**
   * Warns if the function is not registered as a Pipeline function.
   *
   * @param {lunr.PipelineFunction} fn - The function to check for.
   * @private
   */
  static warnIfFunctionNotRegistered (fn) {
    var isRegistered = fn.label && (fn.label in this.registeredFunctions)

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
  static load (serialised) {
    var pipeline = new lunr.Pipeline

    serialised.forEach(function (fnName) {
      var fn = lunr.Pipeline.registeredFunctions[fnName]

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
   * @param {lunr.PipelineFunction[]} functions - Any number of functions to add to the pipeline.
   */
  add () {
    var fns = Array.prototype.slice.call(arguments)

    fns.forEach((fn) => {
      lunr.Pipeline.warnIfFunctionNotRegistered(fn)
      this._stack.push(fn)
    })
  }

  /**
   * Adds a single function after a function that already exists in the
   * pipeline.
   *
   * Logs a warning if the function has not been registered.
   *
   * @param {lunr.PipelineFunction} existingFn - A function that already exists in the pipeline.
   * @param {lunr.PipelineFunction} newFn - The new function to add to the pipeline.
   */
  after (existingFn, newFn) {
    lunr.Pipeline.warnIfFunctionNotRegistered(newFn)

    var pos = this._stack.indexOf(existingFn)
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
   * @param {lunr.PipelineFunction} existingFn - A function that already exists in the pipeline.
   * @param {lunr.PipelineFunction} newFn - The new function to add to the pipeline.
   */
  before (existingFn, newFn) {
    lunr.Pipeline.warnIfFunctionNotRegistered(newFn)

    var pos = this._stack.indexOf(existingFn)
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
  remove (fn) {
    var pos = this._stack.indexOf(fn)
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
   * @returns {lunr.Token[]}
   */
  run (tokens) {
    var stackLength = this._stack.length

    for (var i = 0; i < stackLength; i++) {
      var fn = this._stack[i]
      /** @type {lunr.Token[]} */
      var memo = []

      for (var j = 0; j < tokens.length; j++) {
        var result = fn(tokens[j], j, tokens)

        // @ts-ignore
        if (result === void 0 || result === '') continue

        if (Array.isArray(result)) {
          for (var k = 0; k < result.length; k++) {
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
   * @param {string} str - The string to pass through the pipeline.
   * @param {?object} metadata - Optional metadata to associate with the token
   * passed to the pipeline.
   * @returns {string[]}
   */
  runString (str, metadata) {
    var token = new lunr.Token (str, metadata)

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
   *
   * @returns {Array}
   */
  toJSON () {
    return this._stack.map(function (fn) {
      lunr.Pipeline.warnIfFunctionNotRegistered(fn)

      return fn.label
    })
  }
}

/** @type {Record<string, lunr.PipelineFunction>} */
lunr.Pipeline.registeredFunctions = Object.create(null)

/**
 * A pipeline function maps lunr.Token to lunr.Token. A lunr.Token contains the token
 * string as well as all known metadata. A pipeline function can mutate the token string
 * or mutate (or add) metadata for a given token.
 *
 * A pipeline function can indicate that the passed token should be discarded by returning
 * null. This token will not be passed to any downstream pipeline functions and will not be
 * added to the index.
 *
 * Multiple tokens can be returned by returning an array of tokens. Each token will be passed
 * to any downstream pipeline functions and all will returned tokens will be added to the index.
 *
 * Any number of pipeline functions may be chained together using a lunr.Pipeline.
 *
 * @typedef {lunr.__PipelineFunction & { label?: string }} lunr.PipelineFunction
 * @callback lunr.__PipelineFunction
 * @param {lunr.Token} token - A token from the document being processed.
 * @param {number} i - The index of this token in the complete list of tokens for this document/field.
 * @param {lunr.Token[]} tokens - All tokens for this document/field.
 * @returns {(lunr.Token|lunr.Token[]|undefined)}
 */
/*!
 * lunr.Vector
 * Copyright (C) 2019 Oliver Nightingale
 */

/**
 * A vector is used to construct the vector space of documents and queries. These
 * vectors support operations to determine the similarity between two documents or
 * a document and a query.
 *
 * Normally no parameters are required for initializing a vector, but in the case of
 * loading a previously dumped vector the raw elements can be provided to the constructor.
 *
 * For performance reasons vectors are implemented with a flat array, where an elements
 * index is immediately followed by its value. E.g. [index, value, index, value]. This
 * allows the underlying array to be as sparse as possible and still offer decent
 * performance when being used for vector calculations.
 */
lunr.Vector = class Vector {
  /**
   * @param {number[]} [elements] - The flat list of element index and element value pairs.
   */
  constructor (elements) {
    this._magnitude = 0
    this.elements = elements || []
  }

  /**
   * Calculates the position within the vector to insert a given index.
   *
   * This is used internally by insert and upsert. If there are duplicate indexes then
   * the position is returned as if the value for that index were to be updated, but it
   * is the callers responsibility to check whether there is a duplicate at that index
   *
   * @param {number} index - The index at which the element should be inserted.
   * @returns {number}
   */
  positionForIndex (index) {
    // For an empty vector the tuple can be inserted at the beginning
    if (this.elements.length == 0) {
      return 0
    }

    var start = 0,
        end = this.elements.length / 2,
        sliceLength = end - start,
        pivotPoint = Math.floor(sliceLength / 2),
        pivotIndex = this.elements[pivotPoint * 2]

    while (sliceLength > 1) {
      if (pivotIndex < index) {
        start = pivotPoint
      }

      if (pivotIndex > index) {
        end = pivotPoint
      }

      if (pivotIndex == index) {
        break
      }

      sliceLength = end - start
      pivotPoint = start + Math.floor(sliceLength / 2)
      pivotIndex = this.elements[pivotPoint * 2]
    }

    if (pivotIndex == index) {
      return pivotPoint * 2
    }

    if (pivotIndex > index) {
      return pivotPoint * 2
    }

    if (pivotIndex < index) {
      return (pivotPoint + 1) * 2
    }
    return 0
  }

  /**
   * Inserts an element at an index within the vector.
   *
   * Does not allow duplicates, will throw an error if there is already an entry
   * for this index.
   *
   * @param {number} insertIdx - The index at which the element should be inserted.
   * @param {number} val - The value to be inserted into the vector.
   */
  insert (insertIdx, val) {
    this.upsert(insertIdx, val, function () {
      throw "duplicate index"
    })
  }

  /**
   * Inserts or updates an existing index within the vector.
   *
   * @param {number} insertIdx - The index at which the element should be inserted.
   * @param {number} val - The value to be inserted into the vector.
   * @param {(a: number, b: number) => number} fn - A function that is called for updates, the existing value and the
   * requested value are passed as arguments
   */
  upsert (insertIdx, val, fn) {
    this._magnitude = 0
    var position = this.positionForIndex(insertIdx)

    if (this.elements[position] == insertIdx) {
      this.elements[position + 1] = fn(this.elements[position + 1], val)
    } else {
      this.elements.splice(position, 0, insertIdx, val)
    }
  }

  /**
   * Calculates the magnitude of this vector.
   *
   * @returns {number}
   */
  magnitude () {
    if (this._magnitude) return this._magnitude

    var sumOfSquares = 0,
        elementsLength = this.elements.length

    for (var i = 1; i < elementsLength; i += 2) {
      var val = this.elements[i]
      sumOfSquares += val * val
    }

    return this._magnitude = Math.sqrt(sumOfSquares)
  }

  /**
   * Calculates the dot product of this vector and another vector.
   *
   * @param {lunr.Vector} otherVector - The vector to compute the dot product with.
   * @returns {number}
   */
  dot (otherVector) {
    var dotProduct = 0,
        a = this.elements, b = otherVector.elements,
        aLen = a.length, bLen = b.length,
        aVal = 0, bVal = 0,
        i = 0, j = 0

    while (i < aLen && j < bLen) {
      aVal = a[i], bVal = b[j]
      if (aVal < bVal) {
        i += 2
      } else if (aVal > bVal) {
        j += 2
      } else if (aVal == bVal) {
        dotProduct += a[i + 1] * b[j + 1]
        i += 2
        j += 2
      }
    }

    return dotProduct
  }

  /**
   * Calculates the similarity between this vector and another vector.
   *
   * @param {lunr.Vector} otherVector - The other vector to calculate the
   * similarity with.
   * @returns {number}
   */
  similarity (otherVector) {
    return this.dot(otherVector) / this.magnitude() || 0
  }

  /**
   * Converts the vector to an array of the elements within the vector.
   *
   * @returns {number[]}
   */
  toArray () {
    var output = new Array (this.elements.length / 2)

    for (var i = 1, j = 0; i < this.elements.length; i += 2, j++) {
      output[j] = this.elements[i]
    }

    return output
  }

  /**
   * A JSON serializable representation of the vector.
   *
   * @returns {number[]}
   */
  toJSON () {
    return this.elements
  }

}


/* eslint-disable */
/*!
 * lunr.stemmer
 * Copyright (C) 2019 Oliver Nightingale
 * Includes code from - http://tartarus.org/~martin/PorterStemmer/js.txt
 */

/**
 * lunr.stemmer is an english language stemmer, this is a JavaScript
 * implementation of the PorterStemmer taken from http://tartarus.org/~martin
 *
 * @static
 * @implements {lunr.PipelineFunction}
 * @param {lunr.Token} token - The string to stem
 * @returns {lunr.Token}
 * @see {@link lunr.Pipeline}
 * @function
 */
lunr.stemmer = (function(){
  /** @type {Record<string, string>} */
  var step2list = {
      "ational" : "ate",
      "tional" : "tion",
      "enci" : "ence",
      "anci" : "ance",
      "izer" : "ize",
      "bli" : "ble",
      "alli" : "al",
      "entli" : "ent",
      "eli" : "e",
      "ousli" : "ous",
      "ization" : "ize",
      "ation" : "ate",
      "ator" : "ate",
      "alism" : "al",
      "iveness" : "ive",
      "fulness" : "ful",
      "ousness" : "ous",
      "aliti" : "al",
      "iviti" : "ive",
      "biliti" : "ble",
      "logi" : "log"
    },

    step3list = /** @type {Record<string, string>} */({
      "icate" : "ic",
      "ative" : "",
      "alize" : "al",
      "iciti" : "ic",
      "ical" : "ic",
      "ful" : "",
      "ness" : ""
    }),

    c = "[^aeiou]",          // consonant
    v = "[aeiouy]",          // vowel
    C = c + "[^aeiouy]*",    // consonant sequence
    V = v + "[aeiou]*",      // vowel sequence

    mgr0 = "^(" + C + ")?" + V + C,               // [C]VC... is m>0
    meq1 = "^(" + C + ")?" + V + C + "(" + V + ")?$",  // [C]VC[V] is m=1
    mgr1 = "^(" + C + ")?" + V + C + V + C,       // [C]VCVC... is m>1
    s_v = "^(" + C + ")?" + v;                   // vowel in stem

  var re_mgr0 = new RegExp(mgr0);
  var re_mgr1 = new RegExp(mgr1);
  var re_meq1 = new RegExp(meq1);
  var re_s_v = new RegExp(s_v);

  var re_1a = /^(.+?)(ss|i)es$/;
  var re2_1a = /^(.+?)([^s])s$/;
  var re_1b = /^(.+?)eed$/;
  var re2_1b = /^(.+?)(ed|ing)$/;
  var re_1b_2 = /.$/;
  var re2_1b_2 = /(at|bl|iz)$/;
  var re3_1b_2 = new RegExp("([^aeiouylsz])\\1$");
  var re4_1b_2 = new RegExp("^" + C + v + "[^aeiouwxy]$");

  var re_1c = /^(.+?[^aeiou])y$/;
  var re_2 = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;

  var re_3 = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;

  var re_4 = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
  var re2_4 = /^(.+?)(s|t)(ion)$/;

  var re_5 = /^(.+?)e$/;
  var re_5_1 = /ll$/;
  var re3_5 = new RegExp("^" + C + v + "[^aeiouwxy]$");

  /** @type {lunr.Token.updateFunction} */
  var porterStemmer = function porterStemmer(w) {
    var stem,
      suffix,
      firstch,
      re,
      re2,
      re3,
      re4;

    if (w.length < 3) { return w; }

    firstch = w.substr(0,1);
    if (firstch == "y") {
      w = firstch.toUpperCase() + w.substr(1);
    }

    // Step 1a
    re = re_1a
    re2 = re2_1a;

    if (re.test(w)) { w = w.replace(re,"$1$2"); }
    else if (re2.test(w)) { w = w.replace(re2,"$1$2"); }

    // Step 1b
    re = re_1b;
    re2 = re2_1b;
    if (re.test(w)) {
      var fp = /** @type {RegExpExecArray} */(re.exec(w));
      re = re_mgr0;
      if (re.test(fp[1])) {
        re = re_1b_2;
        w = w.replace(re,"");
      }
    } else if (re2.test(w)) {
      var fp = re2.exec(w);
      stem = fp[1];
      re2 = re_s_v;
      if (re2.test(stem)) {
        w = stem;
        re2 = re2_1b_2;
        re3 = re3_1b_2;
        re4 = re4_1b_2;
        if (re2.test(w)) { w = w + "e"; }
        else if (re3.test(w)) { re = re_1b_2; w = w.replace(re,""); }
        else if (re4.test(w)) { w = w + "e"; }
      }
    }

    // Step 1c - replace suffix y or Y by i if preceded by a non-vowel which is not the first letter of the word (so cry -> cri, by -> by, say -> say)
    re = re_1c;
    if (re.test(w)) {
      var fp = re.exec(w);
      stem = fp[1];
      w = stem + "i";
    }

    // Step 2
    re = re_2;
    if (re.test(w)) {
      var fp = re.exec(w);
      stem = fp[1];
      suffix = fp[2];
      re = re_mgr0;
      if (re.test(stem)) {
        w = stem + step2list[suffix];
      }
    }

    // Step 3
    re = re_3;
    if (re.test(w)) {
      var fp = re.exec(w);
      stem = fp[1];
      suffix = fp[2];
      re = re_mgr0;
      if (re.test(stem)) {
        w = stem + step3list[suffix];
      }
    }

    // Step 4
    re = re_4;
    re2 = re2_4;
    if (re.test(w)) {
      var fp = re.exec(w);
      stem = fp[1];
      re = re_mgr1;
      if (re.test(stem)) {
        w = stem;
      }
    } else if (re2.test(w)) {
      var fp = re2.exec(w);
      stem = fp[1] + fp[2];
      re2 = re_mgr1;
      if (re2.test(stem)) {
        w = stem;
      }
    }

    // Step 5
    re = re_5;
    if (re.test(w)) {
      var fp = re.exec(w);
      stem = fp[1];
      re = re_mgr1;
      re2 = re_meq1;
      re3 = re3_5;
      if (re.test(stem) || (re2.test(stem) && !(re3.test(stem)))) {
        w = stem;
      }
    }

    re = re_5_1;
    re2 = re_mgr1;
    if (re.test(w) && re2.test(w)) {
      re = re_1b_2;
      w = w.replace(re,"");
    }

    // and turn initial Y back to y

    if (firstch == "y") {
      w = firstch.toLowerCase() + w.substr(1);
    }

    return w;
  };

  return function (/** @type {lunr.Token} */token) {
    return token.update(porterStemmer);
  }
})();

lunr.Pipeline.registerFunction(lunr.stemmer, 'stemmer')
/*!
 * lunr.stopWordFilter
 * Copyright (C) 2019 Oliver Nightingale
 */

/**
 * lunr.generateStopWordFilter builds a stopWordFilter function from the provided
 * list of stop words.
 *
 * The built in lunr.stopWordFilter is built using this generator and can be used
 * to generate custom stopWordFilters for applications or non English languages.
 *
 * @function
 * @param {string[]} stopWords The token to pass through the filter
 * @returns {lunr.PipelineFunction}
 * @see lunr.Pipeline
 * @see lunr.stopWordFilter
 */
lunr.generateStopWordFilter = function (stopWords) {
  var words = stopWords.reduce(function (memo, stopWord) {
    memo[stopWord] = stopWord
    return memo
  }, /** @type {Record<string, string>} */({}))

  return function (token) {
    if (token && words[token.toString()] !== token.toString()) return token
  }
}

/**
 * lunr.stopWordFilter is an English language stop word list filter, any words
 * contained in the list will not be passed through the filter.
 *
 * This is intended to be used in the Pipeline. If the token does not pass the
 * filter then undefined will be returned.
 *
 * @function
 * @implements {lunr.PipelineFunction}
 * @params {lunr.Token} token - A token to check for being a stop word.
 * @returns {lunr.Token}
 * @see {@link lunr.Pipeline}
 */
lunr.stopWordFilter = lunr.generateStopWordFilter([
  'a',
  'able',
  'about',
  'across',
  'after',
  'all',
  'almost',
  'also',
  'am',
  'among',
  'an',
  'and',
  'any',
  'are',
  'as',
  'at',
  'be',
  'because',
  'been',
  'but',
  'by',
  'can',
  'cannot',
  'could',
  'dear',
  'did',
  'do',
  'does',
  'either',
  'else',
  'ever',
  'every',
  'for',
  'from',
  'get',
  'got',
  'had',
  'has',
  'have',
  'he',
  'her',
  'hers',
  'him',
  'his',
  'how',
  'however',
  'i',
  'if',
  'in',
  'into',
  'is',
  'it',
  'its',
  'just',
  'least',
  'let',
  'like',
  'likely',
  'may',
  'me',
  'might',
  'most',
  'must',
  'my',
  'neither',
  'no',
  'nor',
  'not',
  'of',
  'off',
  'often',
  'on',
  'only',
  'or',
  'other',
  'our',
  'own',
  'rather',
  'said',
  'say',
  'says',
  'she',
  'should',
  'since',
  'so',
  'some',
  'than',
  'that',
  'the',
  'their',
  'them',
  'then',
  'there',
  'these',
  'they',
  'this',
  'tis',
  'to',
  'too',
  'twas',
  'us',
  'wants',
  'was',
  'we',
  'were',
  'what',
  'when',
  'where',
  'which',
  'while',
  'who',
  'whom',
  'why',
  'will',
  'with',
  'would',
  'yet',
  'you',
  'your'
])

lunr.Pipeline.registerFunction(lunr.stopWordFilter, 'stopWordFilter')
/*!
 * lunr.trimmer
 * Copyright (C) 2019 Oliver Nightingale
 */

/**
 * lunr.trimmer is a pipeline function for trimming non word
 * characters from the beginning and end of tokens before they
 * enter the index.
 *
 * This implementation may not work correctly for non latin
 * characters and should either be removed or adapted for use
 * with languages with non-latin characters.
 *
 * @static
 * @implements {lunr.PipelineFunction}
 * @param {lunr.Token} token The token to pass through the filter
 * @returns {lunr.Token}
 * @see lunr.Pipeline
 */
lunr.trimmer = function (token) {
  return token.update(function (s) {
    return s.replace(/^\W+/, '').replace(/\W+$/, '')
  })
}

lunr.Pipeline.registerFunction(lunr.trimmer, 'trimmer')
/*!
 * lunr.TokenSet
 * Copyright (C) 2019 Oliver Nightingale
 */

/**
 * A token set is used to store the unique list of all tokens
 * within an index. Token sets are also used to represent an
 * incoming query to the index, this query token set and index
 * token set are then intersected to find which tokens to look
 * up in the inverted index.
 *
 * A token set can hold multiple tokens, as in the case of the
 * index token set, or it can hold a single token as in the
 * case of a simple query token set.
 *
 * Additionally token sets are used to perform wildcard matching.
 * Leading, contained and trailing wildcards are supported, and
 * from this edit distance matching can also be provided.
 *
 * Token sets are implemented as a minimal finite state automata,
 * where both common prefixes and suffixes are shared between tokens.
 * This helps to reduce the space used for storing the token set.
 *
 * @constructor
 */
lunr.TokenSet = class TokenSet {
  constructor () {
    this.final = false
    /** @type {Record<string, lunr.TokenSet>} */
    this.edges = {}
    this.id = lunr.TokenSet._nextId
    lunr.TokenSet._nextId += 1

    /** @type {string | undefined} */
    this._str
  }

  /**
   * Converts this TokenSet into an array of strings
   * contained within the TokenSet.
   *
   * @returns {string[]}
   */
  toArray () {
    var words = []

    var stack = [{
      prefix: "",
      node: /** @type {lunr.TokenSet} */(this)
    }]

    while (stack.length) {
      var frame = /** @type {typeof stack[number]} */(stack.pop()),
          edges = Object.keys(frame.node.edges),
          len = edges.length

      if (frame.node.final) {
        /* In Safari, at this point the prefix is sometimes corrupted, see:
        * https://github.com/olivernn/lunr.js/issues/279 Calling any
        * String.prototype method forces Safari to "cast" this string to what
        * it's supposed to be, fixing the bug. */
        frame.prefix.charAt(0)
        words.push(frame.prefix)
      }

      for (var i = 0; i < len; i++) {
        var edge = edges[i]

        stack.push({
          prefix: frame.prefix.concat(edge),
          node: frame.node.edges[edge]
        })
      }
    }

    return words
  }

  /**
   * Generates a string representation of a TokenSet.
   *
   * This is intended to allow TokenSets to be used as keys
   * in objects, largely to aid the construction and minimisation
   * of a TokenSet. As such it is not designed to be a human
   * friendly representation of the TokenSet.
   *
   * @returns {string}
   */
  toString () {
    // NOTE: Using Object.keys here as this.edges is very likely
    // to enter 'hash-mode' with many keys being added
    //
    // avoiding a for-in loop here as it leads to the function
    // being de-optimised (at least in V8). From some simple
    // benchmarks the performance is comparable, but allowing
    // V8 to optimize may mean easy performance wins in the future.

    if (this._str) {
      return this._str
    }

    var str = this.final ? '1' : '0',
        labels = Object.keys(this.edges).sort(),
        len = labels.length

    for (var i = 0; i < len; i++) {
      var label = labels[i],
          node = this.edges[label]

      str = str + label + node.id
    }

    return str
  }

  /**
   * Returns a new TokenSet that is the intersection of
   * this TokenSet and the passed TokenSet.
   *
   * This intersection will take into account any wildcards
   * contained within the TokenSet.
   *
   * @param {lunr.TokenSet} b - An other TokenSet to intersect with.
   * @returns {lunr.TokenSet}
   */
  intersect (b) {
    var output = new lunr.TokenSet

    var stack = [{
      qNode: b,
      output: output,
      node: /** @type {lunr.TokenSet} */(this)
    }]

    while (stack.length) {
      var frame = /** @type {typeof stack[number]} */(stack.pop())

      // NOTE: As with the #toString method, we are using
      // Object.keys and a for loop instead of a for-in loop
      // as both of these objects enter 'hash' mode, causing
      // the function to be de-optimised in V8
      var qEdges = Object.keys(frame.qNode.edges),
          qLen = qEdges.length,
          nEdges = Object.keys(frame.node.edges),
          nLen = nEdges.length

      for (var q = 0; q < qLen; q++) {
        var qEdge = qEdges[q]

        for (var n = 0; n < nLen; n++) {
          var nEdge = nEdges[n]

          if (nEdge == qEdge || qEdge == '*') {
            var node = frame.node.edges[nEdge],
                qNode = frame.qNode.edges[qEdge],
                final = node.final && qNode.final,
                next = undefined

            if (nEdge in frame.output.edges) {
              // an edge already exists for this character
              // no need to create a new node, just set the finality
              // bit unless this node is already final
              next = frame.output.edges[nEdge]
              next.final = next.final || final

            } else {
              // no edge exists yet, must create one
              // set the finality bit and insert it
              // into the output
              next = new lunr.TokenSet
              next.final = final
              frame.output.edges[nEdge] = next
            }

            stack.push({
              qNode: qNode,
              output: next,
              node: node
            })
          }
        }
      }
    }

    return output
  }
}

/**
 * Keeps track of the next, auto increment, identifier to assign
 * to a new tokenSet.
 *
 * TokenSets require a unique identifier to be correctly minimised.
 *
 * @private
 */
lunr.TokenSet._nextId = 1

/**
 * Creates a TokenSet instance from the given sorted array of words.
 *
 * @param {String[]} arr - A sorted array of strings to create the set from.
 * @returns {lunr.TokenSet}
 * @throws Will throw an error if the input array is not sorted.
 */
lunr.TokenSet.fromArray = function (arr) {
  var builder = new lunr.TokenSet.Builder

  for (var i = 0, len = arr.length; i < len; i++) {
    builder.insert(arr[i])
  }

  builder.finish()
  return builder.root
}

/**
 * Creates a token set from a query clause.
 *
 * @private
 * @param {Object} clause - A single clause from lunr.Query.
 * @param {string | lunr.Query.ComparatorTerm | lunr.Query.RangeTerm} clause.term - The query clause term.
 * @param {number} [clause.editDistance] - The optional edit distance for the term.
 * @param {lunr.NumberMap | undefined} [clause.numberMap]
 * @returns {lunr.TokenSet}
 */
lunr.TokenSet.fromClause = function (clause) {
  if (typeof clause.term === "object") {
    if (!clause.numberMap) throw new Error("A comparator or range clause requires a number map")
    return "comparator" in clause.term
      ? clause.numberMap.matchComparator(clause.term.comparator, clause.term.comparand)
      : clause.numberMap.matchRange(clause.term.start, clause.term.end)
  }
  return 'editDistance' in clause
    ? lunr.TokenSet.fromFuzzyString(clause.term, clause.editDistance)
    : lunr.TokenSet.fromString(clause.term)
}

/**
 * Creates a token set representing a single string with a specified
 * edit distance.
 *
 * Insertions, deletions, substitutions and transpositions are each
 * treated as an edit distance of 1.
 *
 * Increasing the allowed edit distance will have a dramatic impact
 * on the performance of both creating and intersecting these TokenSets.
 * It is advised to keep the edit distance less than 3.
 *
 * @param {string} str - The string to create the token set from.
 * @param {number} editDistance - The allowed edit distance to match.
 * @returns {lunr.TokenSet}
 */
lunr.TokenSet.fromFuzzyString = function (str, editDistance) {
  var root = new lunr.TokenSet

  var stack = [{
    node: root,
    editsRemaining: editDistance,
    str: str
  }]

  while (stack.length) {
    var frame = /** @type {typeof stack[number]} */(stack.pop())

    // no edit
    if (frame.str.length > 0) {
      var char = frame.str.charAt(0),
          noEditNode

      if (char in frame.node.edges) {
        noEditNode = frame.node.edges[char]
      } else {
        noEditNode = new lunr.TokenSet
        frame.node.edges[char] = noEditNode
      }

      if (frame.str.length == 1) {
        noEditNode.final = true
      }

      stack.push({
        node: noEditNode,
        editsRemaining: frame.editsRemaining,
        str: frame.str.slice(1)
      })
    }

    // deletion
    // can only do a deletion if we have enough edits remaining
    // and if there are characters left to delete in the string
    if (frame.editsRemaining > 0 && frame.str.length > 1) {
      var char = frame.str.charAt(1),
          deletionNode

      if (char in frame.node.edges) {
        deletionNode = frame.node.edges[char]
      } else {
        deletionNode = new lunr.TokenSet
        frame.node.edges[char] = deletionNode
      }

      if (frame.str.length <= 2) {
        deletionNode.final = true
      } else {
        stack.push({
          node: deletionNode,
          editsRemaining: frame.editsRemaining - 1,
          str: frame.str.slice(2)
        })
      }
    }

    // deletion
    // just removing the last character from the str
    if (frame.editsRemaining > 0 && frame.str.length == 1) {
      frame.node.final = true
    }

    // substitution
    // can only do a substitution if we have enough edits remaining
    // and if there are characters left to substitute
    if (frame.editsRemaining > 0 && frame.str.length >= 1) {
      if ("*" in frame.node.edges) {
        var substitutionNode = frame.node.edges["*"]
      } else {
        var substitutionNode = new lunr.TokenSet
        frame.node.edges["*"] = substitutionNode
      }

      if (frame.str.length == 1) {
        substitutionNode.final = true
      } else {
        stack.push({
          node: substitutionNode,
          editsRemaining: frame.editsRemaining - 1,
          str: frame.str.slice(1)
        })
      }
    }

    // insertion
    // can only do insertion if there are edits remaining
    if (frame.editsRemaining > 0) {
      if ("*" in frame.node.edges) {
        var insertionNode = frame.node.edges["*"]
      } else {
        var insertionNode = new lunr.TokenSet
        frame.node.edges["*"] = insertionNode
      }

      if (frame.str.length == 0) {
        insertionNode.final = true
      } else {
        stack.push({
          node: insertionNode,
          editsRemaining: frame.editsRemaining - 1,
          str: frame.str
        })
      }
    }

    // transposition
    // can only do a transposition if there are edits remaining
    // and there are enough characters to transpose
    if (frame.editsRemaining > 0 && frame.str.length > 1) {
      var charA = frame.str.charAt(0),
          charB = frame.str.charAt(1),
          transposeNode

      if (charB in frame.node.edges) {
        transposeNode = frame.node.edges[charB]
      } else {
        transposeNode = new lunr.TokenSet
        frame.node.edges[charB] = transposeNode
      }

      if (frame.str.length == 1) {
        transposeNode.final = true
      } else {
        stack.push({
          node: transposeNode,
          editsRemaining: frame.editsRemaining - 1,
          str: charA + frame.str.slice(2)
        })
      }
    }
  }

  return root
}

/**
 * Creates a TokenSet from a string.
 *
 * The string may contain one or more wildcard characters (*)
 * that will allow wildcard matching when intersecting with
 * another TokenSet.
 *
 * @param {string} str - The string to create a TokenSet from.
 * @returns {lunr.TokenSet}
 */
lunr.TokenSet.fromString = function (str) {
  var node = new lunr.TokenSet,
      root = node

  /*
   * Iterates through all characters within the passed string
   * appending a node for each character.
   *
   * When a wildcard character is found then a self
   * referencing edge is introduced to continually match
   * any number of any characters.
   */
  for (var i = 0, len = str.length; i < len; i++) {
    var char = str[i],
        final = (i == len - 1)

    if (char == "*") {
      node.edges[char] = node
      node.final = final

    } else {
      var next = new lunr.TokenSet
      next.final = final

      node.edges[char] = next
      node = next
    }
  }

  return root
}
lunr.TokenSet.Builder = class Builder {
  constructor () {
    this.previousWord = ""
    this.root = new lunr.TokenSet
    /** @type {{ parent: lunr.TokenSet, char: string, child: lunr.TokenSet }[]} */
    this.uncheckedNodes = []
    /** @type {Record<string, lunr.TokenSet>} */
    this.minimizedNodes = {}
  }

  /**
   * @param {string} word
   */
  insert (word) {
    var node,
        commonPrefix = 0

    if (word < this.previousWord) {
      throw new Error ("Out of order word insertion")
    }

    for (var i = 0; i < word.length && i < this.previousWord.length; i++) {
      if (word[i] != this.previousWord[i]) break
      commonPrefix++
    }

    this.minimize(commonPrefix)

    if (this.uncheckedNodes.length == 0) {
      node = this.root
    } else {
      node = this.uncheckedNodes[this.uncheckedNodes.length - 1].child
    }

    for (var i = commonPrefix; i < word.length; i++) {
      var nextNode = new lunr.TokenSet,
          char = word[i]

      node.edges[char] = nextNode

      this.uncheckedNodes.push({
        parent: node,
        char: char,
        child: nextNode
      })

      node = nextNode
    }

    node.final = true
    this.previousWord = word
  }

  finish () {
    this.minimize(0)
  }

  /**
   * @param {number} downTo
   */
  minimize (downTo) {
    for (var i = this.uncheckedNodes.length - 1; i >= downTo; i--) {
      var node = this.uncheckedNodes[i],
          childKey = node.child.toString()

      if (childKey in this.minimizedNodes) {
        node.parent.edges[node.char] = this.minimizedNodes[childKey]
      } else {
        // Cache the key for this node since
        // we know it can't change anymore
        node.child._str = childKey

        this.minimizedNodes[childKey] = node.child
      }

      this.uncheckedNodes.pop()
    }
  }
}
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
      const posting = invertedIndex[term]
      const number = posting["_number"]
      if (typeof number == "number") {
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
/*!
 * lunr.Index
 * Copyright (C) 2019 Oliver Nightingale
 */

/**
 * An index contains the built index of all documents and provides a query interface
 * to the index.
 *
 * Usually instances of lunr.Index will not be created using this constructor, instead
 * lunr.Builder should be used to construct new indexes, or lunr.Index.load should be
 * used to load previously built and serialized indexes.
 */
lunr.Index = class Index {
  /**
   * @param {Object} attrs - The attributes of the built search index.
   * @param {lunr.Index.InvertedIndex} attrs.invertedIndex - An index of term/field to document reference.
   * @param {Object<string, lunr.Vector>} attrs.fieldVectors - Field vectors
   * @param {lunr.TokenSet} attrs.tokenSet - An set of all corpus tokens.
   * @param {lunr.NumberMap} attrs.numberMap
   * @param {string[]} attrs.fields - The names of indexed document fields.
   * @param {("string" | "number")[]} [attrs.fieldTypes] - The names of indexed document fields.
   * @param {lunr.Pipeline} attrs.pipeline - The pipeline to use for search terms.
   */
  constructor (attrs) {
    this.invertedIndex = attrs.invertedIndex
    this.fieldVectors = attrs.fieldVectors
    this.tokenSet = attrs.tokenSet
    this.fields = attrs.fields
    this.fieldTypes = attrs.fieldTypes
    this.pipeline = attrs.pipeline
    this.numberMap = lunr.NumberMap.fromInvertedIndex(this.invertedIndex)
  }

  /**
   * Performs a search against the index using lunr query syntax.
   *
   * Results will be returned sorted by their score, the most relevant results
   * will be returned first.  For details on how the score is calculated, please see
   * the {@link https://lunrjs.com/guides/searching.html#scoring|guide}.
   *
   * For more programmatic querying use lunr.Index#query.
   *
   * @param {lunr.Index.QueryString} queryString - A string containing a lunr query.
   * @throws {lunr.QueryParseError} If the passed query string cannot be parsed.
   * @returns {lunr.Index.Result[]}
   */
  search (queryString) {
    return this.query(function (query) {
      var parser = new lunr.QueryParser(queryString, query)
      parser.parse()
    })
  }

  /**
   * Performs a query against the index using the yielded lunr.Query object.
   *
   * If performing programmatic queries against the index, this method is preferred
   * over lunr.Index#search so as to avoid the additional query parsing overhead.
   *
   * A query object is yielded to the supplied function which should be used to
   * express the query to be run against the index.
   *
   * Note that although this function takes a callback parameter it is _not_ an
   * asynchronous operation, the callback is just yielded a query object to be
   * customized.
   *
   * @param {lunr.Index.queryBuilder} fn - A function that is used to build the query.
   * @returns {lunr.Index.Result[]}
   */
  query (fn) {
    // for each query clause
    // * process terms
    // * expand terms from token set
    // * find matching documents and metadata
    // * get document vectors
    // * score documents

    var query = new lunr.Query(this.fields, this.fieldTypes, this.numberMap),
        matchingFields = /** @type {Record<string, lunr.MatchData>} */(Object.create(null)),
        queryVectors = /** @type {Record<string, lunr.Vector>} */(Object.create(null)),
        termFieldCache = /** @type {Record<string, true>} */(Object.create(null)),
        requiredMatches = /** @type {Record<string, lunr.Set>} */(Object.create(null)),
        prohibitedMatches = /** @type {Record<string, lunr.Set>} */(Object.create(null)),
        fieldTypeCache = /** @type {Record<string, lunr.Builder.FieldType>} */(Object.create(null))

    /*
    * To support field level boosts a query vector is created per
    * field. An empty vector is eagerly created to support negated
    * queries.
    */
    for (var i = 0; i < this.fields.length; i++) {
      queryVectors[this.fields[i]] = new lunr.Vector
      fieldTypeCache[this.fields[i]] = this.fieldTypes && this.fieldTypes[i] || "string"
    }

    fn.call(query, query)

    for (var i = 0; i < query.clauses.length; i++) {
      /*
      * Unless the pipeline has been disabled for this term, which is
      * the case for terms with wildcards, we need to pass the clause
      * term through the search pipeline. A pipeline returns an array
      * of processed terms. Pipeline functions may expand the passed
      * term, which means we may end up performing multiple index lookups
      * for a single query term.
      */
      var clause = query.clauses[i],
          terms,
          clauseMatches = lunr.Set.complete

      if (clause.usePipeline && typeof clause.term === "string") {
        terms = this.pipeline.runString(clause.term, {
          fields: clause.fields,
          fieldTypes: clause.fieldTypes
        })
      } else {
        terms = [clause.term]
      }

      // TODO: for quoted terms, a clause is only a match of all terms are a match

      for (var m = 0; m < terms.length; m++) {
        var term = terms[m]

        /*
        * Each term returned from the pipeline needs to use the same query
        * clause object, e.g. the same boost and or edit distance. The
        * simplest way to do this is to re-use the clause object but mutate
        * its term property.
        */
        clause.term = term

        /*
        * From the term in the clause we create a token set which will then
        * be used to intersect the indexes token set to get a list of terms
        * to lookup in the inverted index
        */
        var termTokenSet = lunr.TokenSet.fromClause(clause),
            expandedTerms = this.tokenSet.intersect(termTokenSet).toArray()

        /*
        * If a term marked as required does not exist in the tokenSet it is
        * impossible for the search to return any matches. We set all the field
        * scoped required matches set to empty and stop examining any further
        * clauses.
        */
        if (expandedTerms.length === 0 && clause.presence === lunr.Query.presence.REQUIRED) {
          for (var k = 0; k < clause.fields.length; k++) {
            var field = clause.fields[k]
            requiredMatches[field] = lunr.Set.empty
          }

          break
        }

        for (var j = 0; j < expandedTerms.length; j++) {
          /*
          * For each term get the posting and termIndex, this is required for
          * building the query vector.
          */
          var expandedTerm = expandedTerms[j],
              posting = this.invertedIndex[expandedTerm],
              termIndex = posting._index

          for (var k = 0; k < clause.fields.length; k++) {
            /*
            * For each field that this query term is scoped by (by default
            * all fields are in scope) we need to get all the document refs
            * that have this term in that field.
            *
            * The posting is the entry in the invertedIndex for the matching
            * term from above.
            */
            var field = clause.fields[k],
                fieldPosting = posting[field],
                matchingDocumentRefs = Object.keys(fieldPosting),
                termField = expandedTerm + "/" + field,
                matchingDocumentsSet = new lunr.Set(matchingDocumentRefs)

            /*
            * if the presence of this term is required ensure that the matching
            * documents are added to the set of required matches for this clause.
            *
            */
            if (clause.presence == lunr.Query.presence.REQUIRED) {
              clauseMatches = clauseMatches.union(matchingDocumentsSet)

              if (requiredMatches[field] === undefined) {
                requiredMatches[field] = lunr.Set.complete
              }
            }

            /*
            * if the presence of this term is prohibited ensure that the matching
            * documents are added to the set of prohibited matches for this field,
            * creating that set if it does not yet exist.
            */
            if (clause.presence == lunr.Query.presence.PROHIBITED) {
              if (prohibitedMatches[field] === undefined) {
                prohibitedMatches[field] = lunr.Set.empty
              }

              prohibitedMatches[field] = prohibitedMatches[field].union(matchingDocumentsSet)

              /*
              * Prohibited matches should not be part of the query vector used for
              * similarity scoring and no metadata should be extracted so we continue
              * to the next field
              */
              continue
            }

            /*
            * The query field vector is populated using the termIndex found for
            * the term and a unit value with the appropriate boost applied.
            * Using upsert because there could already be an entry in the vector
            * for the term we are working with. In that case we just add the scores
            * together.
            */
            queryVectors[field].upsert(termIndex, clause.boost, function (a, b) { return a + b })

            /**
             * If we've already seen this term, field combo then we've already collected
             * the matching documents and metadata, no need to go through all that again
             */
            if (termFieldCache[termField]) {
              continue
            }

            for (var l = 0; l < matchingDocumentRefs.length; l++) {
              /*
              * All metadata for this term/field/document triple
              * are then extracted and collected into an instance
              * of lunr.MatchData ready to be returned in the query
              * results
              */
              var matchingDocumentRef = matchingDocumentRefs[l],
                  matchingFieldRef = /** @type {string | lunr.FieldRef} */(new lunr.FieldRef (matchingDocumentRef, field)),
                  metadata = fieldPosting[matchingDocumentRef],
                  fieldMatch

              if ((fieldMatch = matchingFields[matchingFieldRef.toString()]) === undefined) {
                matchingFields[matchingFieldRef.toString()] = new lunr.MatchData (expandedTerm, field, metadata)
              } else {
                fieldMatch.add(expandedTerm, field, metadata)
              }

            }

            termFieldCache[termField] = true
          }
        }
      }

      /**
       * If the presence was required we need to update the requiredMatches field sets.
       * We do this after all fields for the term have collected their matches because
       * the clause terms presence is required in _any_ of the fields not _all_ of the
       * fields.
       */
      if (clause.presence === lunr.Query.presence.REQUIRED) {
        for (var k = 0; k < clause.fields.length; k++) {
          var field = clause.fields[k]
          requiredMatches[field] = requiredMatches[field].intersect(clauseMatches)
        }
      }
    }

    /**
     * Need to combine the field scoped required and prohibited
     * matching documents into a global set of required and prohibited
     * matches
     */
    var allRequiredMatches = lunr.Set.complete,
        allProhibitedMatches = lunr.Set.empty

    for (var i = 0; i < this.fields.length; i++) {
      var field = this.fields[i]

      if (requiredMatches[field]) {
        allRequiredMatches = allRequiredMatches.intersect(requiredMatches[field])
      }

      if (prohibitedMatches[field]) {
        allProhibitedMatches = allProhibitedMatches.union(prohibitedMatches[field])
      }
    }

    var matchingFieldRefs = Object.keys(matchingFields),
        results = [],
        matches = Object.create(null)

    /*
    * If the query is negated (contains only prohibited terms)
    * we need to get _all_ fieldRefs currently existing in the
    * index. This is only done when we know that the query is
    * entirely prohibited terms to avoid any cost of getting all
    * fieldRefs unnecessarily.
    *
    * Additionally, blank MatchData must be created to correctly
    * populate the results.
    */
    if (query.isNegated()) {
      matchingFieldRefs = Object.keys(this.fieldVectors)

      for (var i = 0; i < matchingFieldRefs.length; i++) {
        var matchingFieldRef = /** @type {string | lunr.FieldRef} */(matchingFieldRefs[i])
        var fieldRef = lunr.FieldRef.fromString(matchingFieldRef.toString())
        matchingFields[matchingFieldRef.toString()] = new lunr.MatchData
      }
    }

    for (var i = 0; i < matchingFieldRefs.length; i++) {
      /*
      * Currently we have document fields that match the query, but we
      * need to return documents. The matchData and scores are combined
      * from multiple fields belonging to the same document.
      *
      * Scores are calculated by field, using the query vectors created
      * above, and combined into a final document score using addition.
      */
      var fieldRef = lunr.FieldRef.fromString(matchingFieldRefs[i]),
          docRef = fieldRef.docRef

      if (!allRequiredMatches.contains(docRef)) {
        continue
      }

      if (allProhibitedMatches.contains(docRef)) {
        continue
      }

      var fieldVector = this.fieldVectors[fieldRef.toString()],
          score = queryVectors[fieldRef.fieldName].similarity(fieldVector),
          docMatch

      if ((docMatch = matches[docRef]) !== undefined) {
        docMatch.score += score
        docMatch.matchData.combine(matchingFields[fieldRef.toString()])
      } else {
        var match = {
          ref: docRef,
          score: score,
          matchData: matchingFields[fieldRef.toString()]
        }
        matches[docRef] = match
        results.push(match)
      }
    }

    /*
    * Sort the results objects by score, highest first.
    */
    return results.sort(function (a, b) {
      return b.score - a.score
    })
  }

  /**
   * Prepares the index for JSON serialization.
   *
   * The schema for this JSON blob will be described in a
   * separate JSON schema file.
   *
   * @returns {Object}
   */
  toJSON () {
    var invertedIndex = Object.keys(this.invertedIndex)
      .sort()
      .map((term) => {
        return [term, this.invertedIndex[term]]
      })

    var fieldVectors = Object.keys(this.fieldVectors)
      .map((ref) => {
        return [ref, this.fieldVectors[ref].toJSON()]
      })

    return {
      version: lunr.version,
      fields: this.fields,
      fieldTypes: this.fieldTypes,
      fieldVectors: fieldVectors,
      invertedIndex: invertedIndex,
      pipeline: this.pipeline.toJSON()
    }
  }

  /**
   * Loads a previously serialized lunr.Index
   *
   * @param {Object} serializedIndex - A previously serialized lunr.Index
   * @returns {lunr.Index}
   */
  static load (serializedIndex) {
    var attrs = {},
        fieldVectors = /** @type {Record<String, lunr.Vector>} */({}),
        serializedVectors = serializedIndex.fieldVectors,
        invertedIndex = Object.create(null),
        serializedInvertedIndex = serializedIndex.invertedIndex,
        tokenSetBuilder = new lunr.TokenSet.Builder,
        pipeline = lunr.Pipeline.load(serializedIndex.pipeline)

    if (serializedIndex.version != lunr.version) {
      lunr.utils.warn("Version mismatch when loading serialised index. Current version of lunr '" + lunr.version + "' does not match serialized index '" + serializedIndex.version + "'")
    }

    for (var i = 0; i < serializedVectors.length; i++) {
      var tuple = serializedVectors[i],
          ref = tuple[0],
          elements = tuple[1]

      fieldVectors[ref] = new lunr.Vector(elements)
    }

    for (var i = 0; i < serializedInvertedIndex.length; i++) {
      var tuple = serializedInvertedIndex[i],
          term = tuple[0],
          posting = tuple[1]

      tokenSetBuilder.insert(term)
      invertedIndex[term] = posting
    }

    tokenSetBuilder.finish()

    attrs.fields = serializedIndex.fields

    attrs.fieldVectors = fieldVectors
    attrs.invertedIndex = invertedIndex
    attrs.tokenSet = tokenSetBuilder.root
    attrs.numberMap = lunr.NumberMap.fromInvertedIndex(invertedIndex)
    attrs.pipeline = pipeline

    return new lunr.Index(attrs)
  }
}

/**
 * A query builder callback provides a query object to be used to express
 * the query to perform on the index.
 *
 * @callback lunr.Index.queryBuilder
 * @param {lunr.Query} this
 * @param {lunr.Query} query - The query object to build up.
 * @this lunr.Query
 */


/**
 * A result contains details of a document matching a search query.
 * @typedef {object} lunr.Index.Result
 * @property {string} ref - The reference of the document this result represents.
 * @property {number} score - A number between 0 and 1 representing how similar this document is to the query.
 * @property {lunr.MatchData} matchData - Contains metadata about this match including which term(s) caused the match.
 */

/**
 * Although lunr provides the ability to create queries using lunr.Query, it also provides a simple
 * query language which itself is parsed into an instance of lunr.Query.
 *
 * For programmatically building queries it is advised to directly use lunr.Query, the query language
 * is best used for human entered text rather than program generated text.
 *
 * At its simplest queries can just be a single term, e.g. `hello`, multiple terms are also supported
 * and will be combined with OR, e.g `hello world` will match documents that contain either 'hello'
 * or 'world', though those that contain both will rank higher in the results.
 *
 * Wildcards can be included in terms to match one or more unspecified characters, these wildcards can
 * be inserted anywhere within the term, and more than one wildcard can exist in a single term. Adding
 * wildcards will increase the number of documents that will be found but can also have a negative
 * impact on query performance, especially with wildcards at the beginning of a term.
 *
 * Terms can be restricted to specific fields, e.g. `title:hello`, only documents with the term
 * hello in the title field will match this query. Using a field not present in the index will lead
 * to an error being thrown.
 *
 * Modifiers can also be added to terms, lunr supports edit distance and boost modifiers on terms. A term
 * boost will make documents matching that term score higher, e.g. `foo^5`. Edit distance is also supported
 * to provide fuzzy matching, e.g. 'hello~2' will match documents with hello with an edit distance of 2.
 * Avoid large values for edit distance to improve query performance.
 *
 * Each term also supports a presence modifier. By default a term's presence in document is optional, however
 * this can be changed to either required or prohibited. For a term's presence to be required in a document the
 * term should be prefixed with a '+', e.g. `+foo bar` is a search for documents that must contain 'foo' and
 * optionally contain 'bar'. Conversely a leading '-' sets the terms presence to prohibited, i.e. it must not
 * appear in a document, e.g. `-foo bar` is a search for documents that do not contain 'foo' but may contain 'bar'.
 *
 * To escape special characters the backslash character '\' can be used, this allows searches to include
 * characters that would normally be considered modifiers, e.g. `foo\~2` will search for a term "foo~2" instead
 * of attempting to apply a boost of 2 to the search term "foo".
 *
 * @typedef {string} lunr.Index.QueryString
 * @example <caption>Simple single term query</caption>
 * hello
 * @example <caption>Multiple term query</caption>
 * hello world
 * @example <caption>term scoped to a field</caption>
 * title:hello
 * @example <caption>term with a boost of 10</caption>
 * hello^10
 * @example <caption>term with an edit distance of 2</caption>
 * hello~2
 * @example <caption>terms with presence modifiers</caption>
 * -foo +bar baz
 */

/**
 * @typedef {Record<string, lunr.Index.InvertedIndex.Posting>} lunr.Index.InvertedIndex
 * @typedef {{ _index: number, _number?: number } & lunr.Index.InvertedIndex.FieldReference} lunr.Index.InvertedIndex.Posting
 * @typedef {Record<string, lunr.Index.InvertedIndex.DocumentReference>} lunr.Index.InvertedIndex.FieldReference
 * @typedef {Record<string, lunr.Index.InvertedIndex.Metadata>} lunr.Index.InvertedIndex.DocumentReference
 * @typedef {Record<string, any[]>} lunr.Index.InvertedIndex.Metadata
 */
/*!
 * lunr.Builder
 * Copyright (C) 2019 Oliver Nightingale
 */

/**
 * lunr.Builder performs indexing on a set of documents and
 * returns instances of lunr.Index ready for querying.
 *
 * All configuration of the index is done via the builder, the
 * fields to index, the document reference, the text processing
 * pipeline and document scoring parameters are all set on the
 * builder before indexing.
 */
lunr.Builder = class Builder {
  constructor () {
    /** @type {string} - Internal reference to the document reference field. */
    this._ref = "id"
    /** @type {Record<string, lunr.Builder.Field>} _fields - Internal reference to the document fields to index. */
    this._fields = Object.create(null)
    this._documents = Object.create(null)
    /** @type {lunr.Index.InvertedIndex} The inverted index maps terms to document fields. */
    this.invertedIndex = Object.create(null)
    /** @type {object} Keeps track of document term frequencies. */
    this.fieldTermFrequencies = {}
    /** @type {Record<string, number>} Keeps track of the length of documents added to the index. */
    this.fieldLengths = {}
    /** @type {lunr.tokenizer} Function for splitting strings into tokens for indexing. */
    this.tokenizer = lunr.tokenizer
    /** @type {lunr.Pipeline} The pipeline performs text processing on tokens before indexing. */
    this.pipeline = new lunr.Pipeline
    /** @type {lunr.Pipeline} A pipeline for processing search terms before querying the index. */
    this.searchPipeline = new lunr.Pipeline
    /** @type {number} Keeps track of the total number of documents indexed. */
    this.documentCount = 0
    /** @type {number} A parameter to control field length normalization, setting this to 0 disabled normalization, 1 fully normalizes field lengths, the default value is 0.75. */
    this._b = 0.75
    /** @type {number} A parameter to control how quickly an increase in term frequency results in term frequency saturation, the default value is 1.2. */
    this._k1 = 1.2
    /** @type {number} A counter incremented for each unique term, used to identify a terms position in the vector space. */
    this.termIndex = 0
    /** @type {string[]} A list of metadata keys that have been whitelisted for entry in the index. */
    this.metadataWhitelist = []
  }

  /**
   * Sets the document field used as the document reference. Every document must have this field.
   * The type of this field in the document should be a string, if it is not a string it will be
   * coerced into a string by calling toString.
   *
   * The default ref is 'id'.
   *
   * The ref should _not_ be changed during indexing, it should be set before any documents are
   * added to the index. Changing it during indexing can lead to inconsistent results.
   *
   * @param {string} ref - The name of the reference field in the document.
   */
  ref (ref) {
    this._ref = ref
  }

  /**
   * Adds a field to the list of document fields that will be indexed. Every document being
   * indexed should have this field. Null values for this field in indexed documents will
   * not cause errors but will limit the chance of that document being retrieved by searches.
   *
   * All fields should be added before adding documents to the index. Adding fields after
   * a document has been indexed will have no effect on already indexed documents.
   *
   * Fields can be boosted at build time. This allows terms within that field to have more
   * importance when ranking search results. Use a field boost to specify that matches within
   * one field are more important than other fields.
   *
   * @param {string} fieldName - The name of a field to index in all documents.
   * @param {object} attributes - Optional attributes associated with this field.
   * @param {number} [attributes.boost=1] - Boost applied to all terms within this field.
   * @param {lunr.Builder.fieldExtractor} [attributes.extractor] - Function to extract a field from a document.
   * @param {lunr.Builder.FieldType} [attributes.type="string"] - The type of field.
   * @throws {RangeError} fieldName cannot contain unsupported characters '/'
   */
  field (fieldName, attributes) {
    if (/\//.test(fieldName)) {
      throw new RangeError ("Field '" + fieldName + "' contains illegal character '/'")
    }

    this._fields[fieldName] = attributes || {}
  }

  /**
   * A parameter to tune the amount of field length normalisation that is applied when
   * calculating relevance scores. A value of 0 will completely disable any normalisation
   * and a value of 1 will fully normalise field lengths. The default is 0.75. Values of b
   * will be clamped to the range 0 - 1.
   *
   * @param {number} number - The value to set for this tuning parameter.
   */
  b (number) {
    if (number < 0) {
      this._b = 0
    } else if (number > 1) {
      this._b = 1
    } else {
      this._b = number
    }
  }

  /**
   * A parameter that controls the speed at which a rise in term frequency results in term
   * frequency saturation. The default value is 1.2. Setting this to a higher value will give
   * slower saturation levels, a lower value will result in quicker saturation.
   *
   * @param {number} number - The value to set for this tuning parameter.
   */
  k1 (number) {
    this._k1 = number
  }

  /**
   * Adds a document to the index.
   *
   * Before adding fields to the index the index should have been fully setup, with the document
   * ref and all fields to index already having been specified.
   *
   * The document must have a field name as specified by the ref (by default this is 'id') and
   * it should have all fields defined for indexing, though null or undefined values will not
   * cause errors.
   *
   * Entire documents can be boosted at build time. Applying a boost to a document indicates that
   * this document should rank higher in search results than other documents.
   *
   * @param {object} doc - The document to add to the index.
   * @param {object} attributes - Optional attributes associated with this document.
   * @param {number} [attributes.boost=1] - Boost applied to all terms within this document.
   */
  add (doc, attributes) {
    var docRef = doc[this._ref],
        fields = Object.keys(this._fields)

    this._documents[docRef] = attributes || {}
    this.documentCount += 1

    for (var i = 0; i < fields.length; i++) {
      var fieldName = fields[i],
          extractor = this._fields[fieldName].extractor,
          type = this._fields[fieldName].type || "string",
          field = extractor ? extractor(doc) : doc[fieldName],
          tokens = this.tokenizer(field, {
            fields: [fieldName],
            type
          }),
          terms = this.pipeline.run(tokens),
          fieldRef = new lunr.FieldRef (docRef, fieldName),
          fieldTerms = Object.create(null)

      this.fieldTermFrequencies[fieldRef.toString()] = fieldTerms
      this.fieldLengths[fieldRef.toString()] = 0

      // store the length of this field for this document
      this.fieldLengths[fieldRef.toString()] += terms.length

      // calculate term frequencies for this field
      for (var j = 0; j < terms.length; j++) {
        var term = terms[j]

        if (fieldTerms["" + term] == undefined) {
          fieldTerms["" + term] = 0
        }

        fieldTerms["" + term] += 1

        // add to inverted index
        // create an initial posting if one doesn't exist
        if (this.invertedIndex["" + term] == undefined) {
          /** @type {lunr.Index.InvertedIndex.Posting} */
          var posting = Object.create(null)
          posting["_index"] = this.termIndex
          if (term.metadata.type === "number") {
            const numeric = parseFloat(term.toString())
            if (isFinite(numeric)) {
              posting["_number"] = numeric
            }
          }
          this.termIndex += 1

          for (var k = 0; k < fields.length; k++) {
            posting[fields[k]] = Object.create(null)
          }

          this.invertedIndex["" + term] = posting
        }

        // add an entry for this term/fieldName/docRef to the invertedIndex
        if (this.invertedIndex["" + term][fieldName][docRef] == undefined) {
          this.invertedIndex["" + term][fieldName][docRef] = Object.create(null)
        }

        // store all whitelisted metadata about this token in the
        // inverted index
        for (var l = 0; l < this.metadataWhitelist.length; l++) {
          var metadataKey = this.metadataWhitelist[l],
              metadata = term.metadata[metadataKey]

          if (this.invertedIndex["" + term][fieldName][docRef][metadataKey] == undefined) {
            this.invertedIndex["" + term][fieldName][docRef][metadataKey] = []
          }

          this.invertedIndex["" + term][fieldName][docRef][metadataKey].push(metadata)
        }
      }
    }
  }

  /**
   * Calculates the average document length for this index
   *
   * @private
   */
  calculateAverageFieldLengths () {
    var fieldRefs = Object.keys(this.fieldLengths),
        numberOfFields = fieldRefs.length,
        accumulator = /** @type {Record<string, number>} */({}),
        documentsWithField = /** @type {Record<string, number>} */({})

    for (var i = 0; i < numberOfFields; i++) {
      var fieldRef = lunr.FieldRef.fromString(fieldRefs[i]),
          field = fieldRef.fieldName

      documentsWithField[field] || (documentsWithField[field] = 0)
      documentsWithField[field] += 1

      accumulator[field] || (accumulator[field] = 0)
      accumulator[field] += this.fieldLengths[fieldRef.toString()]
    }

    var fields = Object.keys(this._fields)

    for (var i = 0; i < fields.length; i++) {
      var fieldName = fields[i]
      accumulator[fieldName] = accumulator[fieldName] / documentsWithField[fieldName]
    }

    /** @type {Record<string, number>} */
    this.averageFieldLength = accumulator
  }

  /**
   * Builds a vector space model of every document using lunr.Vector
   *
   * @private
   */
  createFieldVectors () {
    var fieldVectors = /** @type {Record<String, lunr.Vector>} */({}),
        fieldRefs = Object.keys(this.fieldTermFrequencies),
        fieldRefsLength = fieldRefs.length,
        termIdfCache = Object.create(null)

    for (var i = 0; i < fieldRefsLength; i++) {
      var fieldRef = lunr.FieldRef.fromString(fieldRefs[i]),
          fieldName = fieldRef.fieldName,
          fieldLength = this.fieldLengths[fieldRef.toString()],
          fieldVector = new lunr.Vector,
          termFrequencies = this.fieldTermFrequencies[fieldRef.toString()],
          terms = Object.keys(termFrequencies),
          termsLength = terms.length


      var fieldBoost = this._fields[fieldName].boost || 1,
          docBoost = this._documents[fieldRef.docRef].boost || 1

      for (var j = 0; j < termsLength; j++) {
        var term = terms[j],
            tf = termFrequencies[term],
            termIndex = this.invertedIndex[term]._index,
            idf, score, scoreWithPrecision

        if (termIdfCache[term] === undefined) {
          idf = lunr.idf(this.invertedIndex[term], this.documentCount)
          termIdfCache[term] = idf
        } else {
          idf = termIdfCache[term]
        }

        score = idf * ((this._k1 + 1) * tf) / (this._k1 * (1 - this._b + this._b * (fieldLength / /** @type {Record<string, number>} */(this.averageFieldLength)[fieldName])) + tf)
        score *= fieldBoost
        score *= docBoost
        scoreWithPrecision = Math.round(score * 1000) / 1000
        // Converts 1.23456789 to 1.234.
        // Reducing the precision so that the vectors take up less
        // space when serialised. Doing it now so that they behave
        // the same before and after serialisation. Also, this is
        // the fastest approach to reducing a number's precision in
        // JavaScript.

        fieldVector.insert(termIndex, scoreWithPrecision)
      }

      fieldVectors[fieldRef.toString()] = fieldVector
    }

    this.fieldVectors = fieldVectors
  }

  /**
   * Creates a token set of all tokens in the index using lunr.TokenSet
   *
   * @private
   */
  createTokenSet () {
    this.tokenSet = lunr.TokenSet.fromArray(
      Object.keys(this.invertedIndex).sort()
    )
  }

  /**
   * @private
   */
  createNumberSet () {
    this.numberMap = lunr.NumberMap.fromInvertedIndex(this.invertedIndex)
  }

  /**
   * Builds the index, creating an instance of lunr.Index.
   *
   * This completes the indexing process and should only be called
   * once all documents have been added to the index.
   *
   * @returns {lunr.Index}
   */
  build () {
    this.calculateAverageFieldLengths()
    this.createFieldVectors()
    this.createTokenSet()
    this.createNumberSet()

    return new lunr.Index({
      invertedIndex: this.invertedIndex,
      fieldVectors: /** @type {Record<string, lunr.Vector>} */(this.fieldVectors),
      tokenSet: /** @type {lunr.TokenSet} */(this.tokenSet),
      numberMap: /** @type {lunr.NumberMap} */(this.numberMap),
      fields: Object.keys(this._fields),
      fieldTypes: Object.keys(this._fields).map(fieldName => this._fields[fieldName].type || "string"),
      pipeline: this.searchPipeline
    })
  }

  /**
   * Applies a plugin to the index builder.
   *
   * A plugin is a function that is called with the index builder as its context.
   * Plugins can be used to customise or extend the behaviour of the index
   * in some way. A plugin is just a function, that encapsulated the custom
   * behaviour that should be applied when building the index.
   *
   * The plugin function will be called with the index builder as its argument, additional
   * arguments can also be passed when calling use. The function will be called
   * with the index builder as its context.
   *
   * @param {Function} fn The plugin to apply.
   */
  use (fn) {
    var args = Array.prototype.slice.call(arguments, 1)
    args.unshift(this)
    fn.apply(this, args)
  }
}

/**
 * A function that is used to extract a field from a document.
 *
 * Lunr expects a field to be at the top level of a document, if however the field
 * is deeply nested within a document an extractor function can be used to extract
 * the right field for indexing.
 *
 * @callback lunr.Builder.fieldExtractor
 * @param {object} doc - The document being added to the index.
 * @returns {?(string|object|object[])} obj - The object that will be indexed for this field.
 * @example <caption>Extracting a nested field</caption>
 * function (doc) { return doc.nested.field }
 */

/**
 * @typedef lunr.Builder.Field
 * @property {number} [boost]
 * @property {lunr.Builder.fieldExtractor} [extractor]
 * @property {lunr.Builder.FieldType} [type]
 */

/**
 * @typedef {"string" | "number"} lunr.Builder.FieldType
 *//**
 * Contains and collects metadata about a matching document.
 * A single instance of lunr.MatchData is returned as part of every
 * lunr.Index.Result.
 *
 * @see {@link lunr.Index.Result}
 */
lunr.MatchData = class MatchData {
  /**
   * @param {string} [term] - The term this match data is associated with
   * @param {string} [field] - The field in which the term was found
   * @param {Record<string, string[]>} [metadata] - The metadata recorded about this term in this field
   */
  constructor (term, field, metadata) {
    var clonedMetadata = /** @type {Record<string, string[]>} */(Object.create(null)),
        metadataKeys = Object.keys(metadata || {})

    // Cloning the metadata to prevent the original
    // being mutated during match data combination.
    // Metadata is kept in an array within the inverted
    // index so cloning the data can be done with
    // Array#slice
    for (var i = 0; i < metadataKeys.length; i++) {
      var key = metadataKeys[i]
      clonedMetadata[key] = /** @type {Record<string, string[]>} */(metadata)[key].slice()
    }

    /** @type {Record<string, Record<string, Record<string, string[]>>>} */
    this.metadata = Object.create(null)

    if (term !== undefined) {
      this.metadata[term] = Object.create(null)
      this.metadata[term]["" + field] = clonedMetadata
    }
  }

  /**
   * An instance of lunr.MatchData will be created for every term that matches a
   * document. However only one instance is required in a lunr.Index~Result. This
   * method combines metadata from another instance of lunr.MatchData with this
   * objects metadata.
   *
   * @param {lunr.MatchData} otherMatchData - Another instance of match data to merge with this one.
   * @see {@link lunr.Index.Result}
   */
  combine (otherMatchData) {
    var terms = Object.keys(otherMatchData.metadata)

    for (var i = 0; i < terms.length; i++) {
      var term = terms[i],
          fields = Object.keys(otherMatchData.metadata[term])

      if (this.metadata[term] == undefined) {
        this.metadata[term] = Object.create(null)
      }

      for (var j = 0; j < fields.length; j++) {
        var field = fields[j],
            keys = Object.keys(otherMatchData.metadata[term][field])

        if (this.metadata[term][field] == undefined) {
          this.metadata[term][field] = Object.create(null)
        }

        for (var k = 0; k < keys.length; k++) {
          var key = keys[k]

          if (this.metadata[term][field][key] == undefined) {
            this.metadata[term][field][key] = otherMatchData.metadata[term][field][key]
          } else {
            this.metadata[term][field][key] = this.metadata[term][field][key].concat(otherMatchData.metadata[term][field][key])
          }
        }
      }
    }
  }

  /**
   * Add metadata for a term/field pair to this instance of match data.
   *
   * @param {string} term - The term this match data is associated with
   * @param {string} field - The field in which the term was found
   * @param {object} metadata - The metadata recorded about this term in this field
   */
  add (term, field, metadata) {
    if (!(term in this.metadata)) {
      this.metadata[term] = Object.create(null)
      this.metadata[term][field] = metadata
      return
    }

    if (!(field in this.metadata[term])) {
      this.metadata[term][field] = metadata
      return
    }

    var metadataKeys = Object.keys(metadata)

    for (var i = 0; i < metadataKeys.length; i++) {
      var key = metadataKeys[i]

      if (key in this.metadata[term][field]) {
        this.metadata[term][field][key] = this.metadata[term][field][key].concat(metadata[key])
      } else {
        this.metadata[term][field][key] = metadata[key]
      }
    }
  }
}

/**
 * A lunr.Query provides a programmatic way of defining queries to be performed
 * against a {@link lunr.Index}.
 *
 * Prefer constructing a lunr.Query using the {@link lunr.Index#query} method
 * so the query object is pre-initialized with the right index fields.
 */
lunr.Query = class Query {
  /**
   * @param {string[]} allFields - An array of all available fields in a lunr.Index
   * @param {lunr.Builder.FieldType[]} [allFieldTypes] - An array of all field types in a lunr.Index
   * @param {lunr.NumberMap} [numberMap]
   */
  constructor (allFields, allFieldTypes, numberMap) {
    /** @type {lunr.Query.Clause[]} - An array of query clauses. */
    this.clauses = []
    /** @type {string[]} - An array of all available fields in a lunr.Index */
    this.allFields = allFields
    this.allFieldTypes = allFieldTypes
    this.numberMap = numberMap
  }

  /**
   * Adds a {@link lunr.Query.Clause} to this query.
   *
   * Unless the clause contains the fields to be matched all fields will be matched. In addition
   * a default boost of 1 is applied to the clause.
   *
   * @param {lunr.Query.Clause} clause - The clause to add to this query.
   * @see lunr.Query.Clause
   * @returns {lunr.Query}
   */
  clause (clause) {
    if (!('fields' in clause)) {
      clause.fields = this.allFields
      clause.fieldTypes = this.allFieldTypes
    }

    if (!('boost' in clause)) {
      clause.boost = 1
    }

    if (!('usePipeline' in clause)) {
      clause.usePipeline = true
    }

    if (!('wildcard' in clause)) {
      clause.wildcard = lunr.Query.wildcard.NONE
    }

    if (!('numberMap' in clause) && typeof clause.term === "object") {
      clause.numberMap = this.numberMap
    }

    if ((clause.wildcard & lunr.Query.wildcard.LEADING) && typeof clause.term === "string" && (clause.term.charAt(0) != lunr.Query.wildcard)) {
      clause.term = "*" + clause.term
    }

    if ((clause.wildcard & lunr.Query.wildcard.TRAILING) && typeof clause.term === "string" && (clause.term.slice(-1) != lunr.Query.wildcard)) {
      clause.term = "" + clause.term + "*"
    }

    if (!('presence' in clause)) {
      clause.presence = lunr.Query.presence.OPTIONAL
    }

    this.clauses.push(clause)

    return this
  }

  /**
   * A negated query is one in which every clause has a presence of
   * prohibited. These queries require some special processing to return
   * the expected results.
   *
   * @returns boolean
   */
  isNegated () {
    for (var i = 0; i < this.clauses.length; i++) {
      if (this.clauses[i].presence != lunr.Query.presence.PROHIBITED) {
        return false
      }
    }

    return true
  }

  /**
   * Adds a term to the current query, under the covers this will create a {@link lunr.Query.Clause}
   * to the list of clauses that make up this query.
   *
   * The term is used as is, i.e. no tokenization will be performed by this method. Instead conversion
   * to a token or token-like string should be done before calling this method.
   *
   * The term will be converted to a string by calling `toString`. Multiple terms can be passed as an
   * array, each term in the array will share the same options.
   *
   * @param {object|object[]} term - The term(s) to add to the query.
   * @param {object} [options] - Any additional properties to add to the query clause.
   * @returns {lunr.Query}
   * @see lunr.Query#clause
   * @see lunr.Query.Clause
   * @example <caption>adding a single term to a query</caption>
   * query.term("foo")
   * @example <caption>adding a single term to a query and specifying search fields, term boost and automatic trailing wildcard</caption>
   * query.term("foo", {
   *   fields: ["title"],
   *   boost: 10,
   *   wildcard: lunr.Query.wildcard.TRAILING
   * })
   * @example <caption>using lunr.tokenizer to convert a string to tokens before using them as terms</caption>
   * query.term(lunr.tokenizer("foo bar"))
   */
  term (term, options) {
    if (Array.isArray(term)) {
      term.forEach((t) => { this.term(t, lunr.utils.clone(options)) })
      return this
    }

    var clause = options || {}
    clause.term = term.toString()

    this.clause(clause)

    return this
  }
}

/**
 * Constants for indicating what kind of automatic wildcard insertion will be used when constructing a query clause.
 *
 * This allows wildcards to be added to the beginning and end of a term without having to manually do any string
 * concatenation.
 *
 * The wildcard constants can be bitwise combined to select both leading and trailing wildcards.
 *
 * @constant
 * @default
 * @property {number} wildcard.NONE - The term will have no wildcards inserted, this is the default behaviour
 * @property {number} wildcard.LEADING - Prepend the term with a wildcard, unless a leading wildcard already exists
 * @property {number} wildcard.TRAILING - Append a wildcard to the term, unless a trailing wildcard already exists
 * @see lunr.Query.Clause
 * @see lunr.Query#clause
 * @see lunr.Query#term
 * @example <caption>query term with trailing wildcard</caption>
 * query.term('foo', { wildcard: lunr.Query.wildcard.TRAILING })
 * @example <caption>query term with leading and trailing wildcard</caption>
 * query.term('foo', {
 *   wildcard: lunr.Query.wildcard.LEADING | lunr.Query.wildcard.TRAILING
 * })
 */

lunr.Query.wildcard = new String ("*")
lunr.Query.wildcard.NONE = 0
lunr.Query.wildcard.LEADING = 1
lunr.Query.wildcard.TRAILING = 2

/**
 * Constants for indicating what kind of presence a term must have in matching documents.
 *
 * @constant
 * @enum {number}
 * @see lunr.Query.Clause
 * @see lunr.Query#clause
 * @see lunr.Query#term
 * @example <caption>query term with required presence</caption>
 * query.term('foo', { presence: lunr.Query.presence.REQUIRED })
 */
lunr.Query.presence = {
  /**
   * Term's presence in a document is optional, this is the default value.
   */
  OPTIONAL: 1,

  /**
   * Term's presence in a document is required, documents that do not contain
   * this term will not be returned.
   */
  REQUIRED: 2,

  /**
   * Term's presence in a document is prohibited, documents that do contain
   * this term will not be returned.
   */
  PROHIBITED: 3
}

/**
 * @typedef {">" | ">=" | "<" | "<="} lunr.Query.operator
 */
lunr.Query.operator = {}
/** @type {">"} */
lunr.Query.operator.GREATERTHAN = ">"
/** @type {">="} */
lunr.Query.operator.GREATERTHAN_EQUALS = ">="
/** @type {"<"} */
lunr.Query.operator.LESSTHAN = "<"
/** @type {"<="} */
lunr.Query.operator.LESSTHANEQUALS = "<="

/**
 * A single clause in a {@link lunr.Query} contains a term and details on how to
 * match that term against a {@link lunr.Index}.
 *
 * @typedef {Object} lunr.Query.Clause
 * @property {string[]} [fields] - The fields in an index this clause should be matched against.
 * @property {lunr.Builder.FieldType[] | undefined} [fieldTypes] - The types of the fields in the index.
 * @property {lunr.NumberMap | undefined} [numberMap]
 * @property {number} [boost=1] - Any boost that should be applied when matching this clause.
 * @property {number} [editDistance] - Whether the term should have fuzzy matching applied, and how fuzzy the match should be.
 * @property {boolean} [usePipeline] - Whether the term should be passed through the search pipeline.
 * @property {number} [wildcard=lunr.Query.wildcard.NONE] - Whether the term should have wildcards appended or prepended.
 * @property {number} [presence=lunr.Query.presence.OPTIONAL] - The terms presence in any matching documents.
 * @property {string | lunr.Query.ComparatorTerm | lunr.Query.RangeTerm} term
 */

/**
 * @typedef lunr.Query.ComparatorTerm
 * @property {lunr.Query.operator} comparator
 * @property {number} comparand
 */

/**
 * @typedef lunr.Query.RangeTerm
 * @property {"*" | number} start
 * @property {"*" | number} end
 */
lunr.QueryParseError = class QueryParseError extends Error {
  /**
   * @param {string} message
   * @param {number} start
   * @param {number} end
   */
  constructor (message, start, end) {
    super(message)
    this.name = "QueryParseError"
    this.message = message
    this.start = start
    this.end = end
  }
}
lunr.QueryLexer = class QueryLexer {
  /**
   * @param {string} str
   */
  constructor (str) {
    /** @type {lunr.QueryLexer.Lexeme[]} */
    this.lexemes = []
    /** @type {string} */
    this.str = str
    /** @type {number} */
    this.length = str.length
    /** @type {number} */
    this.pos = 0
    /** @type {number} */
    this.start = 0
    /** @type {number[]} */
    this.escapeCharPositions = []
  }

  run () {
    /** @type {lunr.QueryLexer.lexerState | void} */
    var state = lunr.QueryLexer.lexText
    while (state) {
      state = state(this)
    }
  }

  sliceString () {
    var subSlices = [],
        sliceStart = this.start,
        sliceEnd = this.pos

    for (var i = 0; i < this.escapeCharPositions.length; i++) {
      sliceEnd = this.escapeCharPositions[i]
      subSlices.push(this.str.slice(sliceStart, sliceEnd))
      sliceStart = sliceEnd + 1
    }

    subSlices.push(this.str.slice(sliceStart, this.pos))
    this.escapeCharPositions.length = 0

    return subSlices.join('')
  }

  /**
   * @param {lunr.QueryLexer.LexemeType} type
   */
  emit (type) {
    this.lexemes.push({
      type: type,
      str: this.sliceString(),
      start: this.start,
      end: this.pos
    })

    this.start = this.pos
  }

  escapeCharacter () {
    this.escapeCharPositions.push(this.pos - 1)
    this.pos += 1
  }

  next () {
    if (this.pos >= this.length) {
      return lunr.QueryLexer.EOS
    }

    var char = this.str.charAt(this.pos)
    this.pos += 1
    return char
  }

  peek () {
    if (this.pos >= this.length) {
      return lunr.QueryLexer.EOS
    }

    var char = this.str.charAt(this.pos)
    return char
  }

  width () {
    return this.pos - this.start
  }

  ignore () {
    if (this.start == this.pos) {
      this.pos += 1
    }

    this.start = this.pos
  }

  backup () {
    this.pos -= 1
  }

  acceptDigitRun () {
    var char, charCode

    do {
      char = this.next()
      charCode = char.charCodeAt(0)
    } while (charCode > 47 && charCode < 58)

    if (char != lunr.QueryLexer.EOS) {
      this.backup()
    }
  }

  more () {
    return this.pos < this.length
  }
}

/** @typedef {"EOS" | "FIELD" | "TERM" | "EDIT_DISTANCE" | "BOOST" | "PRESENCE" | "COMPARATOR" | "COMPARAND" | "RANGE_START" | "RANGE_END"} lunr.QueryLexer.LexemeType */

/** @type {"EOS"} */
lunr.QueryLexer.EOS = 'EOS'
/** @type {"FIELD"} */
lunr.QueryLexer.FIELD = 'FIELD'
/** @type {"TERM"} */
lunr.QueryLexer.TERM = 'TERM'
/** @type {"EDIT_DISTANCE"} */
lunr.QueryLexer.EDIT_DISTANCE = 'EDIT_DISTANCE'
/** @type {"BOOST"} */
lunr.QueryLexer.BOOST = 'BOOST'
/** @type {"PRESENCE"} */
lunr.QueryLexer.PRESENCE = 'PRESENCE'
/** @type {"COMPARATOR"} */
lunr.QueryLexer.COMPARATOR = 'COMPARATOR'
/** @type {"COMPARAND"} */
lunr.QueryLexer.COMPARAND = 'COMPARAND'
/** @type {"RANGE_START"} */
lunr.QueryLexer.RANGE_START = 'RANGE_START'
/** @type {"RANGE_END"} */
lunr.QueryLexer.RANGE_END = 'RANGE_END'

/** @type {lunr.QueryLexer.lexerState} */
lunr.QueryLexer.lexField = function (lexer) {
  lexer.backup()
  lexer.emit(lunr.QueryLexer.FIELD)
  lexer.ignore()

  var char = lexer.peek()

  // "<", "<=", ">", and ">=" indicates a relational operator
  if ((char == ">" || char == "<") && lexer.width() === 0) {
    lexer.next()
    if (lexer.peek() == "=") lexer.next()
    lexer.emit(lunr.QueryLexer.COMPARATOR)
    lexer.acceptDigitRun()
    if (lexer.peek() == ".") lexer.next()
    lexer.acceptDigitRun()
    lexer.emit(lunr.QueryLexer.COMPARAND)
  }

  return lunr.QueryLexer.lexText
}

/** @type {lunr.QueryLexer.lexerState} */
lunr.QueryLexer.lexRange = function (lexer) {
  lexer.backup()
  if (lexer.width() > 0) {
    lexer.emit(lunr.QueryLexer.RANGE_START)
  }

  lexer.ignore() // .
  lexer.ignore() // .

  while (true) {
    var char = lexer.next()

    if (char == lunr.QueryLexer.EOS) {
      if (lexer.width() > 0) {
        lexer.emit(lunr.QueryLexer.RANGE_END)
      }
      return
    }

    if (char == ":" || char == "~" || char == "^" || char == "+" || char == "-" ||
        char == "." && lexer.peek() == "." ||
        char.match(lunr.QueryLexer.termSeparator)) {
      lexer.backup()
      if (lexer.width() > 0) {
        lexer.emit(lunr.QueryLexer.RANGE_END)
      }
      return lunr.QueryLexer.lexText
    }

    // Escape character is '\'
    if (char.charCodeAt(0) == 92) {
      lexer.escapeCharacter()
      continue
    }
  }
}

/** @type {lunr.QueryLexer.lexerState} */
lunr.QueryLexer.lexTerm = function (lexer) {
  if (lexer.width() > 1) {
    lexer.backup()
    lexer.emit(lunr.QueryLexer.TERM)
  }

  lexer.ignore()

  if (lexer.more()) {
    return lunr.QueryLexer.lexText
  }
}

/** @type {lunr.QueryLexer.lexerState} */
lunr.QueryLexer.lexEditDistance = function (lexer) {
  lexer.ignore()
  lexer.acceptDigitRun()
  lexer.emit(lunr.QueryLexer.EDIT_DISTANCE)
  return lunr.QueryLexer.lexText
}

/** @type {lunr.QueryLexer.lexerState} */
lunr.QueryLexer.lexBoost = function (lexer) {
  lexer.ignore()
  lexer.acceptDigitRun()
  lexer.emit(lunr.QueryLexer.BOOST)
  return lunr.QueryLexer.lexText
}


/** @type {lunr.QueryLexer.lexerState} */
lunr.QueryLexer.lexEOS = function (lexer) {
  if (lexer.width() > 0) {
    lexer.emit(lunr.QueryLexer.TERM)
  }
}

// This matches the separator used when tokenising fields
// within a document. These should match otherwise it is
// not possible to search for some tokens within a document.
//
// It is possible for the user to change the separator on the
// tokenizer so it _might_ clash with any other of the special
// characters already used within the search string, e.g. :.
//
// This means that it is possible to change the separator in
// such a way that makes some words unsearchable using a search
// string.
lunr.QueryLexer.termSeparator = lunr.tokenizer.separator

/** @type {lunr.QueryLexer.lexerState} */
lunr.QueryLexer.lexText = function (lexer) {
  while (true) {
    var char = lexer.next()

    if (char == lunr.QueryLexer.EOS) {
      return lunr.QueryLexer.lexEOS
    }

    // Escape character is '\'
    if (char.charCodeAt(0) == 92) {
      lexer.escapeCharacter()
      continue
    }

    if (char == ":") {
      return lunr.QueryLexer.lexField
    }

    if (char == "~") {
      lexer.backup()
      if (lexer.width() > 0) {
        lexer.emit(lunr.QueryLexer.TERM)
      }
      return lunr.QueryLexer.lexEditDistance
    }

    if (char == "^") {
      lexer.backup()
      if (lexer.width() > 0) {
        lexer.emit(lunr.QueryLexer.TERM)
      }
      return lunr.QueryLexer.lexBoost
    }

    // possible range?
    if (char == "." && lexer.peek() == ".") {
      return lunr.QueryLexer.lexRange
    }

    // "+" indicates term presence is required
    // checking for length to ensure that only
    // leading "+" are considered
    if (char == "+" && lexer.width() === 1) {
      lexer.emit(lunr.QueryLexer.PRESENCE)
      return lunr.QueryLexer.lexText
    }

    // "-" indicates term presence is prohibited
    // checking for length to ensure that only
    // leading "-" are considered
    if (char == "-" && lexer.width() === 1) {
      lexer.emit(lunr.QueryLexer.PRESENCE)
      return lunr.QueryLexer.lexText
    }

    if (char.match(lunr.QueryLexer.termSeparator)) {
      return lunr.QueryLexer.lexTerm
    }
  }
}

/**
 * @typedef lunr.QueryLexer.Lexeme
 * @property {lunr.QueryLexer.LexemeType} type
 * @property {string} str
 * @property {number} start
 * @property {number} end
 */

/**
 * @callback lunr.QueryLexer.lexerState
 * @param {lunr.QueryLexer} lexer
 * @returns {lunr.QueryLexer.lexerState | void}
 */lunr.QueryParser = class QueryParser {
  /**
   *
   * @param {string} str
   * @param {lunr.Query} query
   */
  constructor (str, query) {
    this.lexer = new lunr.QueryLexer (str)
    this.query = query
    /** @type {Partial<lunr.Query.Clause>} */
    this.currentClause = {}
    /** @type {Partial<lunr.Query.ComparatorTerm> | undefined} */
    this.currentComparator = undefined
    /** @type {Partial<lunr.Query.RangeTerm> | undefined} */
    this.currentRange = undefined
    this.lexemeIdx = 0
  }

  parse () {
    this.lexer.run()
    /** @type {lunr.QueryLexer.Lexeme[]} */
    this.lexemes = this.lexer.lexemes

    /** @type {lunr.QueryParser.parserState | void} */
    var state = lunr.QueryParser.parseClause

    while (state) {
      state = state(this)
    }

    return this.query
  }

  peekLexeme () {
    return /** @type {lunr.QueryLexer.Lexeme[]} */(this.lexemes)[this.lexemeIdx]
  }

  consumeLexeme () {
    var lexeme = this.peekLexeme()
    this.lexemeIdx += 1
    return lexeme
  }

  nextClause () {
    var completedClause = /** @type {lunr.Query.Clause} */(this.currentClause)
    this.query.clause(completedClause)
    this.currentClause = {}
    this.currentComparator = undefined
    this.currentRange = undefined
  }

}

/** @type {lunr.QueryParser.parserState} */
lunr.QueryParser.parseClause = function (parser) {
  var lexeme = parser.peekLexeme()

  if (lexeme == undefined) {
    return
  }

  switch (lexeme.type) {
    case lunr.QueryLexer.PRESENCE:
      return lunr.QueryParser.parsePresence
    case lunr.QueryLexer.FIELD:
      return lunr.QueryParser.parseField
    case lunr.QueryLexer.TERM:
      return lunr.QueryParser.parseTerm
    default:
      var errorMessage = "expected either a field or a term, found " + lexeme.type

      if (lexeme.str.length >= 1) {
        errorMessage += " with value '" + lexeme.str + "'"
      }

      throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }
}

/** @type {lunr.QueryParser.parserState} */
lunr.QueryParser.parsePresence = function (parser) {
  var lexeme = parser.consumeLexeme()

  if (lexeme == undefined) {
    return
  }

  switch (lexeme.str) {
    case "-":
      parser.currentClause.presence = lunr.Query.presence.PROHIBITED
      break
    case "+":
      parser.currentClause.presence = lunr.Query.presence.REQUIRED
      break
    default:
      var errorMessage = "unrecognised presence operator'" + lexeme.str + "'"
      throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }

  var nextLexeme = parser.peekLexeme()

  if (nextLexeme == undefined) {
    var errorMessage = "expecting term or field, found nothing"
    throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }

  switch (nextLexeme.type) {
    case lunr.QueryLexer.FIELD:
      return lunr.QueryParser.parseField
    case lunr.QueryLexer.TERM:
      return lunr.QueryParser.parseTerm
    default:
      var errorMessage = "expecting term or field, found '" + nextLexeme.type + "'"
      throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
  }
}

/** @type {lunr.QueryParser.parserState} */
lunr.QueryParser.parseField = function (parser) {
  var lexeme = parser.consumeLexeme()

  if (lexeme == undefined) {
    return
  }

  var fieldIndex = parser.query.allFields.indexOf(lexeme.str)
  if (fieldIndex == -1) {
    var possibleFields = parser.query.allFields.map(function (f) { return "'" + f + "'" }).join(', '),
        errorMessage = "unrecognised field '" + lexeme.str + "', possible fields: " + possibleFields

    throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }

  parser.currentClause.fields = [lexeme.str]
  if (parser.query.allFieldTypes) {
    parser.currentClause.fieldTypes = [parser.query.allFieldTypes[fieldIndex]]
  }

  var nextLexeme = parser.peekLexeme()

  if (nextLexeme == undefined) {
    var errorMessage = "expecting term or operator, found nothing"
    throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }

  switch (nextLexeme.type) {
    case lunr.QueryLexer.TERM:
      return lunr.QueryParser.parseTerm
    case lunr.QueryLexer.RANGE_START:
      return lunr.QueryParser.parseRangeStart
    case lunr.QueryLexer.COMPARATOR:
      return lunr.QueryParser.parseComparator
    default:
      var errorMessage = "expecting term, found '" + nextLexeme.type + "'"
      throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
  }
}

/** @type {lunr.QueryParser.parserState} */
lunr.QueryParser.parseRangeStart = function (parser) {
  var lexeme = parser.consumeLexeme()

  if (lexeme == undefined) {
    return
  }

  if (parser.currentClause.fieldTypes) {
    for (const fieldType of parser.currentClause.fieldTypes) {
      if (fieldType !== "number") {
        var errorMessage = "ranges are only supported on fields of type 'number'"
        throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
      }
    }
  } else {
    var errorMessage = "ranges are only supported on fields of type 'number'"
    throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }

  parser.currentRange = {}

  if (lexeme.str == "*") {
    parser.currentRange.start = "*"
  } else {
    parser.currentRange.start = parseFloat(lexeme.str)
    if (isNaN(parser.currentRange.start)) {
      var errorMessage = "range start must be numeric or '*'"
      throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
    }
  }

  parser.currentClause.usePipeline = false

  var nextLexeme = parser.peekLexeme()

  if (nextLexeme == undefined) {
    var errorMessage = "expecting range end, found nothing"
    throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }

  switch (nextLexeme.type) {
    case lunr.QueryLexer.RANGE_END:
      return lunr.QueryParser.parseRangeEnd
    default:
      var errorMessage = "expecting range end, found '" + nextLexeme.type + "'"
      throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
  }
}

/** @type {lunr.QueryParser.parserState} */
lunr.QueryParser.parseRangeEnd = function (parser) {
  var lexeme = parser.consumeLexeme()

  if (lexeme == undefined) {
    return
  }

  if (!parser.currentRange) throw new Error()

  if (lexeme.str == "*") {
    parser.currentRange.end = "*"
  } else {
    parser.currentRange.end = parseFloat(lexeme.str)
    if (isNaN(parser.currentRange.end)) {
      var errorMessage = "range end must be numeric or '*'"
      throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
    }
  }

  parser.currentClause.term = /** @type {lunr.Query.RangeTerm} */(parser.currentRange)
  parser.currentRange = undefined

  var nextLexeme = parser.peekLexeme()

  if (nextLexeme == undefined) {
    parser.nextClause()
    return
  }

  switch (nextLexeme.type) {
    case lunr.QueryLexer.TERM:
      return lunr.QueryParser.parseTerm
    default:
      var errorMessage = "expecting term, found '" + nextLexeme.type + "'"
      throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
  }
}

/** @type {lunr.QueryParser.parserState} */
lunr.QueryParser.parseComparator = function (parser) {
  var lexeme = parser.consumeLexeme()

  if (lexeme == undefined) {
    return
  }

  if (parser.currentClause.fieldTypes) {
    for (const fieldType of parser.currentClause.fieldTypes) {
      if (fieldType !== "number") {
        var errorMessage = "comparators are only supported on fields of type 'number'"
        throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
      }
    }
  } else {
    var errorMessage = "comparators are only supported on fields of type 'number'"
    throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }

  parser.currentComparator = {}
  parser.currentClause.usePipeline = false

  switch (lexeme.str) {
    case "<":
    case "<=":
    case ">":
    case ">=":
      parser.currentComparator.comparator = lexeme.str
      break
  }

  var nextLexeme = parser.peekLexeme()

  if (nextLexeme == undefined) {
    var errorMessage = "expecting term, found nothing"
    throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }

  switch (nextLexeme.type) {
    case lunr.QueryLexer.COMPARAND:
      return lunr.QueryParser.parseComparand
    default:
      var errorMessage = "expecting comparand, found '" + nextLexeme.type + "'"
      throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
  }
}

/** @type {lunr.QueryParser.parserState} */
lunr.QueryParser.parseComparand = function (parser) {
  var lexeme = parser.consumeLexeme()

  if (lexeme == undefined) {
    return
  }

  if (!parser.currentComparator) throw new Error()

  parser.currentComparator.comparand = parseFloat(lexeme.str)
  if (isNaN(parser.currentComparator.comparand)) {
    var errorMessage = "comparand must be numeric"
    throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }

  parser.currentClause.term = /** @type {lunr.Query.ComparatorTerm} */(parser.currentComparator)
  parser.currentComparator = undefined

  var nextLexeme = parser.peekLexeme()

  if (nextLexeme == undefined) {
    parser.nextClause()
    return
  }

  switch (nextLexeme.type) {
    case lunr.QueryLexer.TERM:
      return lunr.QueryParser.parseTerm
    default:
      var errorMessage = "expecting term, found '" + nextLexeme.type + "'"
      throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
  }
}

/** @type {lunr.QueryParser.parserState} */
lunr.QueryParser.parseTerm = function (parser) {
  var lexeme = parser.consumeLexeme()

  if (lexeme == undefined) {
    return
  }

  parser.currentClause.term = lexeme.str.toLowerCase()

  if (lexeme.str.indexOf("*") != -1) {
    parser.currentClause.usePipeline = false
  }

  var nextLexeme = parser.peekLexeme()

  if (nextLexeme == undefined) {
    parser.nextClause()
    return
  }

  switch (nextLexeme.type) {
    case lunr.QueryLexer.TERM:
      parser.nextClause()
      return lunr.QueryParser.parseTerm
    case lunr.QueryLexer.FIELD:
      parser.nextClause()
      return lunr.QueryParser.parseField
    case lunr.QueryLexer.EDIT_DISTANCE:
      return lunr.QueryParser.parseEditDistance
    case lunr.QueryLexer.BOOST:
      return lunr.QueryParser.parseBoost
    case lunr.QueryLexer.PRESENCE:
      parser.nextClause()
      return lunr.QueryParser.parsePresence
    default:
      var errorMessage = "Unexpected lexeme type '" + nextLexeme.type + "'"
      throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
  }
}

/** @type {lunr.QueryParser.parserState} */
lunr.QueryParser.parseEditDistance = function (parser) {
  var lexeme = parser.consumeLexeme()

  if (lexeme == undefined) {
    return
  }

  var editDistance = parseInt(lexeme.str, 10)

  if (isNaN(editDistance)) {
    var errorMessage = "edit distance must be numeric"
    throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }

  parser.currentClause.editDistance = editDistance

  var nextLexeme = parser.peekLexeme()

  if (nextLexeme == undefined) {
    parser.nextClause()
    return
  }

  switch (nextLexeme.type) {
    case lunr.QueryLexer.TERM:
      parser.nextClause()
      return lunr.QueryParser.parseTerm
    case lunr.QueryLexer.FIELD:
      parser.nextClause()
      return lunr.QueryParser.parseField
    case lunr.QueryLexer.EDIT_DISTANCE:
      return lunr.QueryParser.parseEditDistance
    case lunr.QueryLexer.BOOST:
      return lunr.QueryParser.parseBoost
    case lunr.QueryLexer.PRESENCE:
      parser.nextClause()
      return lunr.QueryParser.parsePresence
    default:
      var errorMessage = "Unexpected lexeme type '" + nextLexeme.type + "'"
      throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
  }
}

/** @type {lunr.QueryParser.parserState} */
lunr.QueryParser.parseBoost = function (parser) {
  var lexeme = parser.consumeLexeme()

  if (lexeme == undefined) {
    return
  }

  var boost = parseInt(lexeme.str, 10)

  if (isNaN(boost)) {
    var errorMessage = "boost must be numeric"
    throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }

  parser.currentClause.boost = boost

  var nextLexeme = parser.peekLexeme()

  if (nextLexeme == undefined) {
    parser.nextClause()
    return
  }

  switch (nextLexeme.type) {
    case lunr.QueryLexer.TERM:
      parser.nextClause()
      return lunr.QueryParser.parseTerm
    case lunr.QueryLexer.FIELD:
      parser.nextClause()
      return lunr.QueryParser.parseField
    case lunr.QueryLexer.EDIT_DISTANCE:
      return lunr.QueryParser.parseEditDistance
    case lunr.QueryLexer.BOOST:
      return lunr.QueryParser.parseBoost
    case lunr.QueryLexer.PRESENCE:
      parser.nextClause()
      return lunr.QueryParser.parsePresence
    default:
      var errorMessage = "Unexpected lexeme type '" + nextLexeme.type + "'"
      throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
  }
}

/**
 * @callback lunr.QueryParser.parserState
 * @param {lunr.QueryParser} parser
 * @returns {lunr.QueryParser.parserState | void}
 */
  /**
   * export the module via AMD, CommonJS or as a browser global
   * Export code from https://github.com/umdjs/umd/blob/master/returnExports.js
   */
  ;(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
      // AMD. Register as an anonymous module.
      define(factory)
    } else if (typeof exports === 'object') {
      /**
       * Node. Does not work with strict CommonJS, but
       * only CommonJS-like enviroments that support module.exports,
       * like Node.
       */
      module.exports = factory()
    } else {
      // Browser globals (root is window)
      root.lunr = factory()
    }
  }(this, function () {
    /**
     * Just return a value to define the module export.
     * This example returns an object, but the module
     * can return a function as the exported value.
     */
    return lunr
  }))
})();
