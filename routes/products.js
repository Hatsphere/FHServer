let express = require('express');
let router = express.Router();

let firestore = require('../helpers/firestoreHelper');

// API for sending the products info
router.post('/send/:uid', (req, res, next) => {
    let uid = req.params.uid;
    const productRef = firestore.doc('seller/registered/' + uid + '/productInfo/');
    res.json({code: 200});
});

module.exports = router;