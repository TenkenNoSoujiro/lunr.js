/*!
 * TokenSet
 * Copyright (C) @YEAR Oliver Nightingale
 */

// @ts-ignore
namespace lunr {
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
   * @memberOf lunr
   */
  export class TokenSet {
    /**
     * Keeps track of the next, auto increment, identifier to assign
     * to a new tokenSet.
     *
     * TokenSets require a unique identifier to be correctly minimised.
     *
     * @private
     */
    private static _nextId = 1

    final = false
    edges: Record<string, TokenSet> = {}
    id = TokenSet._nextId++

    /** @internal */
    _str?: string

    constructor () {
    }

    /**
     * Converts this TokenSet into an array of strings
     * contained within the TokenSet.
     *
     * @returns {string[]}
     */
    toArray (): string[] {
      interface Frame { prefix: string, node: TokenSet }

      let words = []

      let stack: Frame[] = [{
        prefix: "",
        node: this
      }]

      while (stack.length) {
        let frame = stack.pop()!,
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

        for (let i = 0; i < len; i++) {
          let edge = edges[i]

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
    toString (): string {
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

      let str = this.final ? '1' : '0',
          labels = Object.keys(this.edges).sort(),
          len = labels.length

      for (let i = 0; i < len; i++) {
        let label = labels[i],
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
     * @param {lunr.TokenSet} b An other TokenSet to intersect with.
     * @returns {lunr.TokenSet}
     */
    intersect (b: TokenSet): TokenSet {
      interface Frame { qNode: TokenSet, output: TokenSet, node: TokenSet }

      let output = new TokenSet

      let stack: Frame[] = [{
        qNode: b,
        output: output,
        node: this
      }]

      while (stack.length) {
        let frame = stack.pop()!

        // NOTE: As with the #toString method, we are using
        // Object.keys and a for loop instead of a for-in loop
        // as both of these objects enter 'hash' mode, causing
        // the function to be de-optimised in V8
        let qEdges = Object.keys(frame.qNode.edges),
            qLen = qEdges.length,
            nEdges = Object.keys(frame.node.edges),
            nLen = nEdges.length

        for (let q = 0; q < qLen; q++) {
          let qEdge = qEdges[q]

          for (let n = 0; n < nLen; n++) {
            let nEdge = nEdges[n]

            if (nEdge == qEdge || qEdge == '*') {
              let node = frame.node.edges[nEdge],
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
                next = new TokenSet
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

    /**
     * Creates a TokenSet instance from the given sorted array of words.
     *
     * @param {string[]} arr A sorted array of strings to create the set from.
     * @returns {lunr.TokenSet}
     * @throws Will throw an error if the input array is not sorted.
     */
    static fromArray (arr: string[]): TokenSet {
      let builder = new TokenSet.Builder

      for (let i = 0, len = arr.length; i < len; i++) {
        builder.insert(arr[i])
      }

      builder.finish()
      return builder.root
    }

    /**
     * Creates a token set from a query clause.
     *
     * @private
     * @param {lunr.Query~Clause} clause A single clause from lunr.Query.
     * @returns {lunr.TokenSet}
     */
    static fromClause (clause: Query.Clause): TokenSet {
      if (typeof clause.term === "object") {
        if (!clause.numberMap) throw new Error("A comparator or range clause requires a number map")
        return "comparator" in clause.term
          ? clause.numberMap.matchComparator(clause.term.comparator, clause.term.comparand)
          : clause.numberMap.matchRange(clause.term.start, clause.term.end)
      }
      return 'editDistance' in clause
        ? TokenSet.fromFuzzyString(clause.term, clause.editDistance!)
        : TokenSet.fromString(clause.term)
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
     * @param {string} str The string to create the token set from.
     * @param {number} editDistance The allowed edit distance to match.
     * @returns {lunr.TokenSet}
     */
    static fromFuzzyString (str: string, editDistance: number): TokenSet {
      interface Frame { node: TokenSet, editsRemaining: number, str: string }

      let root = new TokenSet

      let stack: Frame[] = [{
        node: root,
        editsRemaining: editDistance,
        str: str
      }]

      while (stack.length) {
        let frame = stack.pop()!

        // no edit
        if (frame.str.length > 0) {
          let char = frame.str.charAt(0),
              noEditNode

          if (char in frame.node.edges) {
            noEditNode = frame.node.edges[char]
          } else {
            noEditNode = new TokenSet
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
          let char = frame.str.charAt(1),
              deletionNode

          if (char in frame.node.edges) {
            deletionNode = frame.node.edges[char]
          } else {
            deletionNode = new TokenSet
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
          let substitutionNode: TokenSet
          if ("*" in frame.node.edges) {
            substitutionNode = frame.node.edges["*"]
          } else {
            substitutionNode = new TokenSet
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
          let insertionNode: TokenSet
          if ("*" in frame.node.edges) {
            insertionNode = frame.node.edges["*"]
          } else {
            insertionNode = new TokenSet
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
          let charA = frame.str.charAt(0),
              charB = frame.str.charAt(1),
              transposeNode: TokenSet

          if (charB in frame.node.edges) {
            transposeNode = frame.node.edges[charB]
          } else {
            transposeNode = new TokenSet
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
     * @param {string} str The string to create a TokenSet from.
     * @returns {lunr.TokenSet}
     */
    static fromString (str: string): TokenSet {
      let node = new TokenSet,
          root = node

      /*
      * Iterates through all characters within the passed string
      * appending a node for each character.
      *
      * When a wildcard character is found then a self
      * referencing edge is introduced to continually match
      * any number of any characters.
      */
      for (let i = 0, len = str.length; i < len; i++) {
        let char = str[i],
            final = (i == len - 1)

        if (char == "*") {
          node.edges[char] = node
          node.final = final

        } else {
          let next = new TokenSet
          next.final = final

          node.edges[char] = next
          node = next
        }
      }

      return root
    }
  }
}