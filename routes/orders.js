let express = require('express');
let router = express.Router();

let firestore = require('../helpers/firestoreHelper');

/**
 * API Endpoint for accepting orders
 * by a seller havng id : uid
 */
router.post('/accept', (req, res, next) => {
    let uid = req.body.uid;
    let orderId = req.body.orderId;
    
    let sellerOrderRef = firestore.doc(uid + '/orders/waiting/' + orderId);
})

module.exports = router;
