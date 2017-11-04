const firestore = require('./firestoreHelper');

const express = require('express');
const router = express.Router();

router.get('/test', (req, res, next) => {
    const userRef = firestore.collection('users');
    let query = userRef.where('address', '==', '');

    userRef.get().then(snapshot => {
        console.log(snapshot)
    });

    // query.get().then(querySnapshot => {
    //     console.log(querySnapshot.query);
    // });
});

module.exports = router;
