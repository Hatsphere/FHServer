let express = require('express');
let router = express.Router();

let firestore = require('../helpers/firestoreHelper');

/* API for sending the products info (only the textual based details)
* {
    pName: <Product Name>,
    pPrice: <Product Price>,
    pDescription: <Product Description>,
    pClass: <Product Class>
}
*/
router.post('/send/:uid', (req, res, next) => {
    let uid = req.params.uid;

    // datastore reference for item
    const productRef = firestore.doc('products/' + uid);

    let pName = req.body.pName;
    let pPrice = req.body.pPrice;
    let pDescription = req.body.pDescription;
    let pClass = req.body.pClass;

    productRef.push({
        'Name': pName,
        'Price': pPrice,
        'Description': pDescription,
        'Sale': false,
        'Availability': true,
        'Class': pClass,
        'Images': {}
    }).then(() => {
        console.log('Product pushed to firestore');
        res.json({response: 200, data: req.body});
    }).catch(err => {
        console.error(err);
        res.json({response: 500, error: err});
    });

});

module.exports = router;