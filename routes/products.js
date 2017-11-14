let express = require('express');
let admin = require('../helpers/firebaseAdmin');
let storage = admin.storage();
let router = express.Router();
let sellerHelper = require('../helpers/sellerHelper')
const multer = require('multer');

let firestore = require('../helpers/firestoreHelper');

/**
 *  API for sending the products info (only the textual based details)
 *  {
 *  pName: <Product Name>,
 *  pPrice: <Product Price>,
 *  pDescription: <Product Description>,
 *  pClass: <Product Class>
 * }
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
        Name: pName,
        Price: pPrice,
        Description: pDescription,
        Sale: pSale,
        Availability: true,
        Class: pClass,
        Images: {
            primaryImage: '',
            leftImage: '',
            rightImage: ''
        }
    };

    console.log('Object received', obj);

    // datastore reference for item
    let productRef = firestore.doc(uid + '/Products/Info/' + pName);
    let cateogryRef = firestore.collection(pClass)

    productRef.set(obj)
        .then(() => {
            console.log('Product added');
            sellerHelper.getSellerInfo(uid, (err, res) => {
                if (err) {
                    console.error(err)
                } else {
                    let planId = res.PlanChosen
                    cateogryRef.doc(pName)
                        .set({
                            uid: uid,
                            planId: planId
                        })
                        .then(() => {
                            console.log('Cateogry added', pName)
                        })
                        .catch(err => console.error(err))
                }
            })
            res.json({response: 200, data: req.body});
        })
        .catch(err => {
            console.error(err);
            res.json({response: 500});
        });

});

/**
 * API Endpoint for getting all products of a seller
 */
router.get('/all/:uid', (req, res, next) => {
    let uid = req.params.uid
    let sellerRef = firestore.collection(uid + '/Products/Info')

    sellerRef.get()
        .then(snapshot => {
            console.log('Getting data for ', uid)
            res.json(snapshot.data())
        })
})

/**
 * API Endpoint for getting all the cateogries of product
 */
router.get('/getcateogry', (req, res, next) => {
    let cateogryRef = firestore.doc('Cateogries/Details');
    cateogryRef.get()
        .then(snapShot => {
            let cateogries = snapShot.data()
            console.log(cateogries)
            res.json(snapShot.data())
        })
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

/**
 * API Endpoint for deleting a product
 * This will delete a selected product from the document reference from the 
 * database (firestore)
 */
router.post('/delete', (req, res, next) => {
    let key = req.body.productKey
    let productRef = firestore.doc(uid + '/Products/Info/' + key);
    productRef.delete()
        .then(() => res.json({response: 200}))
        .catch(err => res.json({response: 500}))
})

/**
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

    let productImageEndpoint = multer({storage: productStorage}).array(uid, 10);
    const productBucket = storage.bucket();
    let productRef = firestore.doc(uid + '/Products/Info/' + pName);

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
                        res.json({response: 500});
                    } else {
                        downloadLink(file, (err, link) => {
                            if (err) {
                                console.error('Download link not generated');
                                res.json({response: 500});
                            } else {
                                console.log('Download link generated', link);
                                if (i === 0) {
                                    productRef.update({
                                        'Images.primaryImage': link
                                    }).then(() => {
                                        console.log('Image saved');
                                    }).catch(err => {
                                        console.error(err);
                                    });

                                } else {
                                    productRef.update({
                                        'Images.leftImage': link
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
            res.json({response: 200});
        }
    });
});

module.exports = router;