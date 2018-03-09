# node-firebase-firestore-backup

> Backup and restore documents from Firebase Firestore.

[![NPM Version][npm-image]][npm-url]

## Install

```bash
npm i -S firebase-firestore-backup
```

## Usage

In the terminal type `node index.js backup -C serviceAccountKeyFile.json -B bucketName` where serviceAccountKeyFile.json is downloaded from firebase console. The bucketName is the name of the Firebase Storage bucket you wish to upload your backups. You might need to create this manually.


Type `node index.js -h` for information on how to use the backup utility.




## License
CC BY-SA

This project was brought to you by [Makeable A/S](https://github.com/makeabledk) 