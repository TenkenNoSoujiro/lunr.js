/**
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
  constructor(term, field, metadata) {
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
  combine(otherMatchData) {
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
  add(term, field, metadata) {
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

