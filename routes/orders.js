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

module.exports = router;
