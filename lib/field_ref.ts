// @ts-ignore
namespace lunr {
  /** @hidden */
  export class FieldRef {
    static readonly joiner = "/"

    docRef: any
    fieldName: string

    private _stringValue?: string

    constructor (docRef: any, fieldName: string, stringValue?: string) {
      this.docRef = docRef
      this.fieldName = fieldName
      this._stringValue = stringValue
    }

    toString () {
      if (this._stringValue == undefined) {
        this._stringValue = this.fieldName + FieldRef.joiner + this.docRef
      }
      return this._stringValue
    }

    /**
     * @param {string} s
     */
    static fromString (s: string) {
      var n = s.indexOf(FieldRef.joiner)

      if (n === -1) {
        throw "malformed field ref string"
      }

      var fieldRef = s.slice(0, n),
          docRef = s.slice(n + 1)

      return new FieldRef (docRef, fieldRef, s)
    }
  }
}