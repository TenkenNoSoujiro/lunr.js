// @ts-ignore
namespace lunr.TokenSet {
  export class Builder {
    root = new TokenSet
    private previousWord = ""
    private uncheckedNodes: { parent: TokenSet, char: string, child: TokenSet }[] = []
    private minimizedNodes: Record<string, TokenSet> = {}

    constructor () {
    }

    insert (word: string) {
      let node,
          commonPrefix = 0

      if (word < this.previousWord) {
        throw new Error ("Out of order word insertion")
      }

      for (let i = 0; i < word.length && i < this.previousWord.length; i++) {
        if (word[i] != this.previousWord[i]) break
        commonPrefix++
      }

      this.minimize(commonPrefix)

      if (this.uncheckedNodes.length == 0) {
        node = this.root
      } else {
        node = this.uncheckedNodes[this.uncheckedNodes.length - 1].child
      }

      for (let i = commonPrefix; i < word.length; i++) {
        let nextNode = new TokenSet,
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

    minimize (downTo: number) {
      for (let i = this.uncheckedNodes.length - 1; i >= downTo; i--) {
        let node = this.uncheckedNodes[i],
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
}