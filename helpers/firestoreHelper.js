const Firestore = require('@google-cloud/firestore');

const firestore = new Firestore({
    projectId: 'hatsphere',
    keyFilename: './TestApp-bc5766f47e99.json'
});

module.exports = firestore;