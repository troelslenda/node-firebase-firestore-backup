const _ = require('lodash')
const fs = require('fs')
const path = require('path')

const unzip = require('unzip')
const concat = require('concat-stream')

module.exports = function restore ({
  admin, cmd, filename
}) {
  const db = admin.firestore()

  const blackList = cmd.parent.except && cmd.parent.except.split(',')
  const whiteList = cmd.parent.only && cmd.parent.only.split(',')

  const batchWrite = (collection, docs) => {
    const parseArray = array => array.map(parseField)
    const parseObj = obj => _.keys(obj).reduce((parsed, field) => {
      parsed[field] = parseField(obj[field])
      return parsed
    }, {})

    const parseField = field => {
      const isRef = field => !!(field._segments)
      const isGeo = field => !!(field._latitude && field._longitude)
      const isDate = field => !!(field._ts)

      if (isRef(field)) { return db.doc(field._segments.join('/')) }
      if (isGeo(field)) {
        return new admin.firestore.GeoPoint(field._latitude, field._longitude)
      }
      if (isDate(field)) { return new Date(field._ts) }
      if (_.isObject(field) && !_.isArray(field)) { return parseObj(field) }
      if (_.isArray(field)) { return parseArray(field) }

      return field
    }

    const parseDoc = doc => {
      return _.keys(doc).reduce((obj, key) => {
        obj[key] = parseField(doc[key])
        return obj
      }, {})
    }

    // TK: fake collection
    collection = collection + '_restored'
    let batch = db.batch()
    let colRef = db.collection(collection)

    _.forEach(docs, (doc, key) => {
      batch.set(colRef.doc(key), parseDoc(doc))
    })

    batch.commit().then(() => console.log(`wrote ${_.size(docs)} to ${collection}`))
  }

  const fullPath = path.join(__dirname, filename)

  fs.createReadStream(fullPath)
    .pipe(unzip.Parse())
    .on('entry', entry => {
      let collection = entry.path.split('.')[0]
      if (whiteList && !_.includes(whiteList, collection)) {
        entry.autodrain()
        return
      } else if (blackList && _.includes(blackList, collection)) {
        entry.autodrain()
        return
      }

      console.log('restoring', collection)
      entry.pipe(concat({ encoding: 'string' }, res => {
        let json = JSON.parse(res)
        batchWrite(collection, json)
      }))
    })
}
