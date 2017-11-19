let express = require('express');
let router = express.Router();

let firestore = require('../helpers/firestoreHelper');
let batch = firestore.batch()

/**
 * API Endpoint for getting all the orders
 * for the seller
 */
router.get('/all/:uid', (req ,res, next) => {
    let uid = req.params.uid
    let orderRef = firestore.collection(uid + '/orders/waiting')

    orderRef.get()
        .then(snapShot => {
            let response = {}
            snapShot.forEach(item =>{
                console.log(item.id, '=>', item.data());
                response[item.id] = item.data()
            })
            res.json(response)
        })
        .catch(err => res.json({response: 500}))
})


/**
 * API Endpoint for accepting the order
 * from the seller. Will move the order in the seller waiting
 * instance and user waiting instance to the order 
 * placed instance
 */
router.post('/accept', (req, res, next) => {
    let orderId = req.body.orderId
    let sellerId = req.body.sellerId

    let orderRef = firestore.doc(sellerId + '/orders/waiting/' + orderId)
    
})

module.exports = router;
