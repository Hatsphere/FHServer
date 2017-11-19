let express = require('express');
let router = express.Router();

let firestore = require('../helpers/firestoreHelper');

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
    let order = req.body.order
    let sellerId = order['sellerId']
    let timeStamp = req.body.timeStamp
    let acceptOrder = order
    acceptOrder['completedTimeStamp'] = timeStamp

    console.log(order)

    let batch = firestore.batch()
    let orderRef = firestore.doc(sellerId + '/orders/waiting/' + order['order_id'])
    let acceptRef = firestore.doc(sellerId + '/orders/accept/' + order['order_id'])

    batch.delete(orderRef)
    batch.set(acceptRef, acceptOrder)

    batch.commit().then(() => {
        res.json({response: 200, status: 'accepted'})
    }).catch(err => res.json({response: 500}))
    
})

module.exports = router;
