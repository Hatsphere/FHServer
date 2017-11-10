let express = require('express');
let admin = require('../helpers/firebaseAdmin');
let storage = admin.storage();
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
    };

    console.log('Object received', obj);

    // datastore reference for item
    let productRef = firestore.collection('products');

    productRef.doc(uid).collection(pName).doc('Info').set(obj)
        .then(() => {
            console.log('Product added');
            productRef.doc(uid).collection(pName).doc('Images').set({
                primaryImage: '',
                leftImage: '',
                rightImage: ''
            }).then(() => {
                console.log('Dummy image data created');
                res.json({ response: 200, data: req.body });
            }).catch(err => {
                console.error(err);
                res.json({ response: 200, data: req.body });
            });
        })
        .catch(err => {
            console.error(err);
        });

});

// Function for generation of download link using file
function downloadLink(file, callback) {
    file.getSignedUrl({
        action: 'read',
        expires: '12-31-2018',
    }, function (err, url) {
        if (err) {
            callback(err);
        } else {
            callback(err, url);
        }
    });
}


/*
* API endpoint for uploading the images of product on the server
*/
router.post('/send/image/:uid/:pName', (req, res, next) => {
    let uid = req.params.uid;
    let pName = req.params.pName;
    let productStorage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads/seller/product/images/');
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname.split('.')[0] + '.' + file.originalname.split('.')[1]);
        },
    });

    let productImageEndpoint = multer({ storage: productStorage }).array(uid, 10);
    const productBucket = storage.bucket();
    let productRef = firestore.collection('products').doc(uid).collection(pName).doc('Images');
    
    productImageEndpoint(req, res, err => {
        if (err) {
            console.error(err);
        } else {
            console.log('Image uploaded');
            let filesList = req.files;
            for (let i = 0; i < filesList.length; ++i) {
                const path = filesList[i].path;
                console.log(path);
                productBucket.upload(path, (err, file, apiResponse) => {
                    if (err) {
                        console.error(err);
                        res.json({ response: 500 });
                    } else {
                        downloadLink(file, (err, link) => {
                            if (err) {
                                console.error('Download link not generated');
                                res.json({ response: 500 });
                            } else {
                                console.log('Download link generated', link);
                                if (i === 0) {
                                    productRef.update({
                                        primaryImage: link
                                    }).then(() => {
                                        console.log('Image saved');
                                    }).catch(err => {
                                        console.error(err);
                                    });
                                
                                } else {
                                    productRef.update({
                                        leftImage: link
                                    }).then(() => {
                                        console.log('Image saved');
                                    }).catch(err => {
                                        console.error(err);
                                    });
                                }
                            }
                        });
                    }
                });
            }
            res.json({ response: 200 });
        }
    });
});

module.exports = router;