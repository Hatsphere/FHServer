let express = require('express');
let router = express.Router();
const multer = require('multer');

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

    console.log('uid wants to store data: ', uid);

    let pName = req.body.pName;
    let pPrice = req.body.pPrice;
    let pDescription = req.body.pDescription;
    let pClass = req.body.pClass;
    let pSale = req.body.pSale;

    let obj = {
        'Name': pName,
        'Price': pPrice,
        'Description': pDescription,
        'Sale': pSale,
        'Availability': true,
        'Class': pClass,
        Images: {}
    };

    console.log('Object received', obj);

    // datastore reference for item
    const productRef = firestore.doc('products/' + uid).collection('product').doc(pName);

    productRef.set(obj).then(() => {
        console.log('Product pushed to firestore');
        res.json({response: 200, data: req.body});
    }).catch(err => {
        console.error(err);
        res.json({response: 500, error: err});
    });

});

/*
* API endpoint for uploading the images of product on the server
*/
router.post('/send/image/:uid', (req, res, next) => {
    let uid = req.params.uid;
    let productStorage = multer.diskStorage({
        destination: function(req, file, cb) {
            cb(null, 'uploads/seller/product/images/');
        },
        filename: function(req, file, cb) {
            cb(null, file.originalname.split('.')[0] + '.' + file.originalname.split('.')[1]);
        },
    });
    let productImageEndpoint = multer({storage: productStorage}).array(uid, 5);
    productImageEndpoint(req, res, err => {
        if (err) {
            console.error(err);
        } else {
            console.log('Image uploaded');
        }
    });
});

module.exports = router;