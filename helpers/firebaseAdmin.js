let admin = require('firebase-admin');

let serviceAccount = require('../TestApp-bc5766f47e99.json');


// credential for firebase account
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://hatsphere.firebaseio.com',
    storageBucket: 'hatsphere.appspot.com',
});

module.exports = admin;
