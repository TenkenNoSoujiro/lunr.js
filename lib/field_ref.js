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
}