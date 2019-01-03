// @ts-ignore
namespace lunr {
  /**
   * Contains and collects metadata about a matching document.
   * A single instance of lunr.MatchData is returned as part of every
   * lunr.Index.Result.
   *
   * @memberOf lunr
   * @property {Object<string, string[]>} metadata - A cloned collection of metadata associated with this document.
   * @see {@link lunr.Index~Result}
   */
  export class MatchData {
    metadata: Record<string, Record<string, Record<string, string[]>>>

    /**
     * @param {string} [term] - The term this match data is associated with
     * @param {string} [field] - The field in which the term was found
     * @param {Object<string, string[]>} [metadata] - The metadata recorded about this term in this field
     */
    constructor (term?: string, field?: string, metadata: Record<string, string[]> = {}) {
      let clonedMetadata: Record<string, string[]> = Object.create(null),
          metadataKeys = Object.keys(metadata)

      // Cloning the metadata to prevent the original
      // being mutated during match data combination.
      // Metadata is kept in an array within the inverted
      // index so cloning the data can be done with
      // Array#slice
      for (const key of metadataKeys) {
        clonedMetadata[key] = metadata[key].slice()
      }

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
     * @see {@link lunr.Index~Result}
     */
    combine (otherMatchData: MatchData) {
      let terms = Object.keys(otherMatchData.metadata)

      for (const term of terms) {
        let fields = Object.keys(otherMatchData.metadata[term])

        if (this.metadata[term] == undefined) {
          this.metadata[term] = Object.create(null)
        }

        for (const field of fields) {
          let keys = Object.keys(otherMatchData.metadata[term][field])

          if (this.metadata[term][field] == undefined) {
            this.metadata[term][field] = Object.create(null)
          }

          for (const key of keys) {
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
     * @param {Object<string, string>} metadata - The metadata recorded about this term in this field
     */
    add (term: string, field: string, metadata: Record<string, string[]>) {
      if (!(term in this.metadata)) {
        this.metadata[term] = Object.create(null)
        this.metadata[term][field] = metadata
        return
      }

      if (!(field in this.metadata[term])) {
        this.metadata[term][field] = metadata
        return
      }

      let metadataKeys = Object.keys(metadata)

      for (const key of metadataKeys) {
        if (key in this.metadata[term][field]) {
          this.metadata[term][field][key] = this.metadata[term][field][key].concat(metadata[key])
        } else {
          this.metadata[term][field][key] = metadata[key]
        }
      }
    }
  }
}
