#!/usr/bin/env node
const commander = require('commander')

const admin = require('firebase-admin')
const fs = require('fs')

const backup = require('./backup')
const restore = require('./restore')

if (!process.argv.slice(2).length) {
  commander.outputHelp()
  process.exit(0)
}


const handleCmd = cmd => {
  if (!cmd.parent.credentialsFile) {
    console.log('You have to specify a credentials file using the -C option.')
    process.exit(-1)
  }

  let serviceAccount = ''
  //let serviceAccount = require(cmd.parent.credentialsFile)
  if (cmd.parent.credentialsString) {
    serviceAccount = cmd.parent.credentialsString
  } else {
    const serviceAccountBuffer = fs.readFileSync(cmd.parent.credentialsFile)
    serviceAccount = JSON.parse(serviceAccountBuffer.toString())
  }
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
  return admin
}

commander
  .option('-x, --credentials-string <string>', 'The credentials as string. Trumps --credentials-file.')
  .option('-C, --credentials-file <file>', 'The credentials file to use.')
  .option('-B, --bucket-name <string>', 'The name of the bucket to upload backups')
  .option('-o, --only [collections...]', 'Only use these collections. Trumps --except.')
  .option('-e, --except [collections...]', 'Don\'t use these collections.')

commander
  .command('backup')
  .option('-S, --save', 'Save copy of backup locally')
  .action((cmd) => {
    handleCmd(cmd)
    backup({
      admin,
      cmd
    })
  })

commander
  .command('restore <backup.zip>')
  .action((filename, cmd) => {
    handleCmd(cmd)
    restore({
      admin,
      cmd,
      filename
    })
  })

commander.parse(process.argv)
