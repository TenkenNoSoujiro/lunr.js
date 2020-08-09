/*!
 * Set
 * Copyright (C) @YEAR Oliver Nightingale
 */

// @ts-ignore
namespace lunr {
  // These sentinel values exist purely for the purposes of static initialization of `Set.complete`
  // and `Set.empty`
  let completeSentinel: string[] | undefined
  let emptySentinel: string[] | undefined
  completeSentinel = emptySentinel = []

  /**
   * A lunr set.
   *
   * @memberOf lunr
   */
  export class Set {
    /**
     * A complete set that contains all elements.
     * @type {lunr.Set}
     */
    static readonly complete: Set = new class CompleteSet extends Set {
      constructor () {
        if (!completeSentinel) throw new TypeError()
        super(completeSentinel)
        completeSentinel = undefined
      }
      contains (_value: string) {
        return true
      }
      intersect (other: Set) {
        return other
      }
      union (_other: Set) {
        return this
      }
    }

    /**
     * An empty set that contains no elements.
     * @type {lunr.Set}
     */
    static readonly empty: Set = new class EmptySet extends Set {
      constructor () {
        if (!emptySentinel) throw new TypeError()
        super(emptySentinel)
        emptySentinel = undefined
      }
      contains (_value: string) {
        return false
      }
      intersect (_other: Set) {
        return this
      }
      union (other: Set) {
        return other
      }
    }

    private elements!: Record<string, true>
    private length!: number

    /**
     * @param {string[]} [elements] The elements of the set.
     */
    constructor (elements?: string[]) {
      if (completeSentinel && elements === completeSentinel ||
          emptySentinel && elements === emptySentinel) {
        this.elements = undefined!
        this.length = undefined!
        return
      }

      if (!elements || elements.length === 0) {
        return Set.empty
      }

      this.elements = Object.create(null)
      this.length = elements.length
      for (const element of elements) {
        this.elements[element] = true
      }
    }

    /**
     * Returns true if this set contains the specified object.
     *
     * @param {string} object Object whose presence in this set is to be tested.
     * @returns {boolean} True if this set contains the specified object.
     */
    contains (object: string) {
      return !!this.elements[object]
    }

    /**
     * Returns a new set containing only the elements that are present in both
     * this set and the specified set.
     *
     * @param {lunr.Set} [other] set to intersect with this set.
     * @returns {lunr.Set} a new set that is the intersection of this and the specified set.
     */

    intersect (other: Set) {
      let a, b, elements, intersection = []

      if (other === Set.complete) {
        return this
      }

      if (other === Set.empty) {
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

      for (const element of elements) {
        if (b.elements[element]) {
          intersection.push(element)
        }
      }

      if (intersection.length == 0) {
        return Set.empty
      }

      return new Set (intersection)
    }

    /**
     * Returns a new set combining the elements of this and the specified set.
     *
     * @param {lunr.Set} other set to union with this set.
     * @return {lunr.Set} a new set that is the union of this and the specified set.
     */

    union (other: Set) {
      if (other === Set.complete) {
        return Set.complete
      }

      if (other === Set.empty) {
        return this
      }

      return new Set(Object.keys(this.elements).concat(Object.keys(other.elements)))
    }
  }
}