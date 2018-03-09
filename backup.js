const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')

const archiver = require('archiver')

const padZero = str => ('0' + str).slice(-2)
const formatDate = date => [date.getFullYear(), '-', padZero(date.getMonth() + 1), '-', padZero(date.getDate()), '_', padZero(date.getHours()), '.', padZero(date.getMinutes()), '.', padZero(date.getSeconds())].join('')

module.exports = function backup ({
  admin, cmd
}) {
  const db = admin.firestore()
  const storage = admin.storage()

  const blackList = cmd.parent.except && cmd.parent.except.split(',')
  const whiteList = cmd.parent.only && cmd.parent.only.split(',')

  /** Create and archive files */
  const filename = path.join(__dirname, 'backup-' + formatDate(new Date()) + '.zip')
  const output = fs.createWriteStream(filename)
  const archive = archiver('zip', { zlib: { level: 9 } })

  archive.pipe(output)

  /** Get database */

  const handleCollection = collection => {
    const parseArray = array => array.map(parseField)
    const parseObj = obj => _.keys(obj).sort().reduce((parsed, field) => {
      parsed[field] = parseField(obj[field])
      return parsed
    }, {})

    const parseField = field => {
      if (field == null) { return field }
      const isRef = field => !!(field.id && field.parent && field.get)
      const isGeo = field => !!(field.latitude && field.longitude)
      const isDate = field => !!(field instanceof Date)

      if (isRef(field)) { return { _segments: [field.parent.id, field.id] } }
      if (isGeo(field)) {
        return { _latitude: field.latitude, _longitude: field.longitude }
      }

      if (isDate(field)) { return { _ts: field.getTime() } }
      if (_.isObject(field) && !_.isArray(field)) { return parseObj(field) }
      if (_.isArray(field)) { return parseArray(field) }

      return field
    }

    const parseDoc = doc => {
      return _.keys(doc.data()).sort().reduce((parsed, key) => {
        parsed[key] = parseField(doc.data()[key])
        return parsed
      }, { id: doc.id, collections: doc.collections })
    }

    return collection
      .get()
      .then(querySnapshot => {
        let promises = []
        querySnapshot.docs.map(doc => {
          doc.collections = []
          promises.push(doc.ref.getCollections().then(cols => {
            let promisesDocs = []
            cols.map(col => promisesDocs.push(handleCollection(col)))
            return Promise.all(promisesDocs).then(data => doc.collections.push(data))
          }))
        })
        return Promise.all(promises).then(() => querySnapshot)
      })
      .then(querySnapshot => {
        let docs = querySnapshot.docs.map(parseDoc).reduce((docs, doc) => {
          docs[doc.id] = _.omit(doc, 'id')
          return docs
        }, {})
        return {
          id: collection.id,
          docs
        }
      })
  }

  db.getCollections().then(collections => {
    console.log('Start')
    return Promise.all(
      collections
        .filter(collection => {
          if (whiteList) {
            return _.includes(whiteList, collection.id)
          } else if (blackList) {
            return !_.includes(blackList, collection.id)
          }
          return true
        })
        .map(collection => {
          return handleCollection(collection)
        }))
      .then(parsedCollections => {
        console.log('...parsed')
        parsedCollections.forEach(({ id, docs }) => {
          return archive.append(JSON.stringify(docs, null, 2), { name: id + '.json' })
        })
        return archive.finalize()
      })
      .then(() => {
        console.log('...zipped')
        return storage.bucket('dripdrop-727b4-backups').upload(filename)
      })
      .then(() => {
        console.log('...uploaded')
        if (!cmd.save) {
          console.log('...removing local copy')
          rimraf.sync(filename)
        }
        console.log('Done!')
      })
  })
}
