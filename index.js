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


  //let serviceAccount = require(cmd.parent.credentialsFile)
  const serviceAccountBuffer = fs.readFileSync(cmd.parent.credentialsFile)
  let serviceAccount = JSON.parse(serviceAccountBuffer.toString())
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
  return admin
}

commander
  .option('-C, --credentials-file <file>', 'The credentials file to use.')
  .option('-B, --bucket-name <string>', 'The name of the bucket to upload backups')
  .option('-o, --only [collections...]', 'Only use these collections. Trumps --except.')
  .option('-e, --except [collections...]', 'Don\'t use these collections.')
  .option('-p, --prefix <string>', 'Prefix the backup filename.')

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
