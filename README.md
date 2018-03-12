# node-firebase-firestore-backup

> Backup and restore documents from Firebase Firestore.


![npm](https://img.shields.io/npm/v/firebase-firestore-backup.svg)
[![dependencies Status](https://david-dm.org/makeabledk/node-firebase-firestore-backup/status.svg)](https://david-dm.org/makeabledk/node-firebase-firestore-backup)

## Install

```bash
npm i -g firebase-firestore-backup
```

## Setup

serviceAccountKeyFile.json is downloaded from firebase console. The bucketName is the name of the Firebase Storage bucket you wish to upload your backups. You might need to create this manually.

## Usage

After installation a binary `firebase-firestore` is available.

```
Usage: firebase-firestore [options] [command]

  Options:

    -C, --credentials-file <file>  The credentials file to use.
    -B, --bucket-name <string>     The name of the bucket to upload backups
    -o, --only [collections...]    Only use these collections. Trumps --except.
    -e, --except [collections...]  Don't use these collections.
    -h, --help                     output usage information

  Commands:

    backup [options]
    restore <backup.zip>
```

## License
CC BY-SA

This project was brought to you by [Makeable ApS](https://github.com/makeabledk) 