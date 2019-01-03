/*!
 * lunr.Vector
 * Copyright (C) @YEAR Oliver Nightingale
 */

// @ts-ignore
namespace lunr {
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
   *
   * @memberOf lunr
   */
  export class Vector {
    elements: number[]

    private _magnitude = 0

    /**
     * @param {number[]} elements The flat list of element index and element value pairs.
     */
    constructor (elements: number[] = []) {
      this._magnitude = 0
      this.elements = elements
    }

    /**
     * Calculates the position within the vector to insert a given index.
     *
     * This is used internally by insert and upsert. If there are duplicate indexes then
     * the position is returned as if the value for that index were to be updated, but it
     * is the callers responsibility to check whether there is a duplicate at that index
     *
     * @param {number} index The index at which the element should be inserted.
     * @returns {number}
     */
    positionForIndex (index: number) {
      // For an empty vector the tuple can be inserted at the beginning
      if (this.elements.length == 0) {
        return 0
      }

      return lunr.utils.binarySearch(this.elements, index, lunr.utils.compareNumbers, 2, lunr.utils.Bias.LEAST_UPPER_BOUND)
    }

    /**
     * Inserts an element at an index within the vector.
     *
     * Does not allow duplicates, will throw an error if there is already an entry
     * for this index.
     *
     * @param {number} insertIdx The index at which the element should be inserted.
     * @param {number} val The value to be inserted into the vector.
     */
    insert (insertIdx: number, val: number) {
      this.upsert(insertIdx, val, function () {
        throw "duplicate index"
      })
    }

    /**
     * Inserts or updates an existing index within the vector.
     *
     * @param {number} insertIdx - The index at which the element should be inserted.
     * @param {number} val - The value to be inserted into the vector.
     * @param {function(number, number): number} fn - A function that is called for updates, the existing value and the
     * requested value are passed as arguments
     */
    upsert (insertIdx: number, val: number, fn: (a: number, b: number) => number) {
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
    dot (otherVector: lunr.Vector) {
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
    similarity (otherVector: lunr.Vector) {
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

}
