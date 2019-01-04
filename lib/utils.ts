/*!
 * lunr.utils
 * Copyright (C) @YEAR Oliver Nightingale
 */

// @ts-ignore
namespace lunr {
  /**
   * A namespace containing utils for the rest of the lunr library
   */
  export namespace utils {
    /** @hidden */
    let _warn = (function (global) {
      /* eslint-disable no-console */
      return function (message: string): void {
        if (global.console && console.warn) {
          console.warn(message)
        }
      }
      /* eslint-enable no-console */
      // @ts-ignore
    })(this)

    /**
     * Print a warning message to the console.
     *
     * @param message The message to be printed.
     */
    export const warn = function (message: string, ..._: any[]): void {
      return _warn(message);
    }

    /**
     * Convert an object to a string.
     *
     * In the case of `null` and `undefined` the function returns
     * the empty string, in all other cases the result of calling
     * `toString` on the passed object is returned.
     *
     * @param obj The object to convert to a string.
     * @return string representation of the passed object.
     */
    export const asString = function (obj: any) {
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
     * @hidden
     * @param obj The object to clone.
     * @return a clone of the passed object.
     * @throws {TypeError} when a nested object is passed.
     */
    export const clone = function<T extends object & Record<string, any>> (obj: T): T {
      if (obj === null || obj === undefined) {
        return obj
      }

      let clone = Object.create(null),
          keys = Object.keys(obj)

      for (const key of keys) {
        let val = obj[key]

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

    /** @hidden */
    export const identity = function<T> (x: T) {
      return x
    }

    /** @hidden */
    export const compare = function<T> (a: T, b: T) {
      return a < b ? -1 : a > b ? +1 : 0
    }

    /** @hidden */
    export const compareNumbers = function (a: number, b: number) {
      return a - b
    }

    /** @hidden */
    export const enum Bias {
      TWOS_COMPLEMENT,
      LEAST_UPPER_BOUND,
      GREATEST_LOWER_BOUND
    }

    /** @hidden */
    export const binarySearch = function<T> (array: T[], value: T, comparer: (a: T, b: T) => number = compare, step?: number, bias?: Bias) {
      return binarySearchKey(array, value, identity, comparer, step, bias)
    }

    /** @hidden */
    export const binarySearchKey = function<T, K> (array: T[], key: K, keySelector: (v: T) => K, comparer: (a: K, b: K) => number, step = 1, bias = Bias.TWOS_COMPLEMENT) {
      if (step < 1 || step !== (step | 0)) throw new RangeError("'step' must be a positive integer")
      if (array.length % step) throw new TypeError("'array' must have a length that is a multiple of 'step'")
      let l = 0,
          h = (array.length / step) - 1
      while (l <= h) {
        let m = l + ((h - l) >> 1),
            mKey = keySelector(array[m * step]),
            r = comparer(mKey, key)
        if (r < 0) {
          l = m + 1
        } else if (r > 0) {
          h = m - 1
        } else {
          return m * step
        }
      }
      switch (bias) {
        case Bias.LEAST_UPPER_BOUND: return l * step
        case Bias.GREATEST_LOWER_BOUND: return (l - 1) * step
        default: return ~(l * step)
      }
    }

    /** @hidden */
    const decimalPattern = /^[+-]?(?:(?:0|[1-9]\d*)(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/
    
    /** @hidden */
    const integerPattern = /^[+-]?0(?:[bB][01]+|[oO][0-7]+|[xX][0-9a-fA-F]+)$/

    /** @hidden */
    export const parseNumber = function (str: string) {
      str = str.trim()
      return decimalPattern.test(str) ? parseFloat(str) :
        integerPattern.test(str) ? parseInt(str) :
          NaN
    }
  }
}