var admin = require('firebase-admin');

var serviceAccount = require('../TestApp-bc5766f47e99.json');


// credential for firebase account
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://testapp-932ba.firebaseio.com"
});

module.exports = admin;