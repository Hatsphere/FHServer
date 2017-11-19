let express = require('express');
let router = express.Router();
let admin = require('../helpers/firebaseAdmin');
let db = admin.database();
let rootRef = db.ref('/');
let bucket = admin.storage().bucket();
let sellerHelper = require('../helpers/sellerHelper');

let mkdirp = require('mkdirp');
let fs = require('fs');
let multer = require('multer');


/**
 * Function to save the seller details in the realtime
 * database for the future lookup
 * @param uid - Unique id for the seller
 * @param password - Password for the seller
 * @param callback - Callback for the function for further processing
 */
let saveData = function (uid, password, callback) {
    rootRef.child('seller/registered/' + uid).set({
        password: password,
    }, function (error) {
        if (error) {
            callback(error);
        } else {
            console.log('User pushed');
            callback(null);
        }
    });
};

/**
 * Function for checking existence of directory or not
 * directory : name or path of the directory from the present directory
 * callback : Callback function
 */
function checkDirectory(directory, callback) {
    fs.stat(directory, function (err, stats) {
        if (err) {
            mkdirp(directory, function (err) {
                if (err) {
                    callback(err);
                } else {
                    console.log('Created Directory');
                }
            });
        } else {
            callback(err);
        }
    });
}

/**
 * Function for checking the directory for profile images
 * If it doesn't exists, it create that directory recursively
 */
checkDirectory('uploads/seller/profile/', function (error) {
    if (error) {
        console.error(error);
    } else {
        console.log('Profile Images directory created');
    }
});

/**
 * Function for checking the directory for Product images
 * If it doesn't exists, it create that directory recursively
 */
checkDirectory('uploads/seller/product/images/', function (error) {
    if (error) {
        console.error(error);
    } else {
        console.log('Product Images directory created');
    }
});

// Function for generation of download link using file
function downloadLink(file, callback) {
    file.getSignedUrl({
        action: 'read',
        expires: '12-31-2030',
    }, function (err, url) {
        if (err) {
            callback(err);
        } else {
            callback(err, url);
        }
    });
}

/**
 * API Endpoint for updation of seller info
 * There will be a query get request for updation of the
 * seller information
 */
router.get('/update', (req, res, next) => {
    let field = req.query.field
    let value = req.query.value
    let uid = req.query.uid

    sellerHelper.updateSeller(uid, field, value, err => {
        if (err) {
            console.error(err)
            res.json({ response: 500 })
        } else {
            console.log('Updated successfully')
            res.json({ response: 200 })
        }
    })
})

/**
 * API endpoint for fetching the details of a particular seller
 * GET method
 * api url: /seller/info/all/<UID_of_user>
 * return (correct): Block of seller in json
 */
router.get('/seller/Info/all/:uid', (req, res, next) => {
    let uid = req.params.uid;
    sellerHelper.getSellerInfo(uid, (err, result) => {
        if (err) {
            console.error(err);
            res.json({ code: 500 });
        } else {
            console.log('Success get details');
            res.json({ code: 200, data: result });
        }
    });
});

/**
 * Function for profile image upload function for storing images using multer
 * Image saved will get uploaded to firebase storage using google-storage.
 * Key file name for the multi part request should be profile_<UID_of_user>
 * The image uploaded will get optimized and the optimized image will be store
 * in the bucket.
 */
function imageUpload(uid, req, res) {
    let profileStorage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads/seller/profile/');
        },
        filename: function (req, file, cb) {
            cb(null, file.fieldname + '-' + uid + '.' + file.originalname.split('.')[1]);
        },
    });

    let profileImageEndpoint = multer({ storage: profileStorage }).single('profile_' + uid);
    profileImageEndpoint(req, res, function (err) {
        if (err) {
            console.error(err);
        } else {
            console.log('Image Uploaded Successfully');
            bucket.upload(req.file.path, function (err, file, apiResponse) {
                if (err) {
                    console.error(err);
                } else {
                    downloadLink(file, function (err, link) {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log(link);
                            res.json({ response: 200, downloadLink: link });
                        }
                    });
                }
            });
        }
    });
}

/**
 * API endpoint for creating profile of the seller
 * Json contains:
 * name: name_value
 * planId: plan_value
 * address: Address_value
 * contactNo : phone_number_value
 * uid : Id of the user in firebase
 */
router.post('/profile/:uid', function (req, res, next) {
    const userId = req.params.uid;
    console.log('uid: ', userId);
    rootRef.child('seller/registered/' + userId).on('value', function (snapshot) {
        console.log(snapshot.toJSON());
        // Valid seller
        if (snapshot.exists()) {
            console.log('Seller authenticated');
            let name = req.body.name;
            let planChosen = req.body.planId;
            let address = req.body.address;
            let contactNo = req.body.contactNo;

            const data = {
                Name: name,
                PlanChosen: planChosen,
                Address: address,
                ContactNo: contactNo
            };

            sellerHelper.writeSellerInfo(userId, data, (response) => {
                if (response === 200) {
                    res.json({ Code: 200, Updated: userId, dataSent: data });
                } else {
                    res.json({ Code: 500 });
                }
            });

            // imageUpload(uid, req, res);
        } else {
            console.log('Seller unauthenticated');
        }
    });
});

/**
 * API Endpoint for changing user password
 * user will send the uid and the new password in 
 * the post request and the new password will replace the
 * old password
 */
router.post('/change/password', (req, res, next) => {
    let uid = req.body.uid;
    let newPassword = req.body.password;

    rootRef
        .child('seller/registered/' + uid)
        .on('value', snapshot => {
            if (snapshot.exists()) {
                rootRef.child('seller/registered/' + uid)
                    .update({
                        password: newPassword
                    })
                    .then(() => {
                        admin.auth().updateUser(uid, {
                            password: newPassword
                        }).then(userRecord => {
                            console.log('Successfully updated user Record: ', userRecord.toJSON())
                        }).catch(err => console.error('Error updating the user: ', err))
                        res.json({ response: 200 })
                    })
                    .catch(err => res.json({ response: 500 }))
            }
        })
});

/** 
 * API endpoint for deleting the user data
 * taking uid from the ref and deleting.
 */
router.get('/deleteUser/:uid', function (req, res, next) {
    let uid = req.params.uid;
    let del_ref = admin.database().ref('seller/registered/' + uid);
    del_ref.remove()
        .then(function () {
            return admin.auth().deleteUser(uid)
        })
        .then(() => res.json({response: 200, status: 'DELETED'}))
        .catch(function (error) {
            console.log('Error deleting data:', error);
            res.send({ response: 500, status: 'error', error: error });
        });
});

/**
 * API endpoint for sending seller image
 * Image key should be profile_<uid>
 */
router.post('/profile/:uid/image/', (req, res, next) => {
    let uid = req.params.uid;
    rootRef.child('seller/registered/' + uid).on('value', function (snapshot) {
        // Valid seller
        if (snapshot.exists()) {
            imageUpload(uid, req, res);
        }
    });
});

/**
 * API endpoint for checking existence of user
 * Checks the email id exists or not.
 * POST: {
 *  email: "Email of the user"
 * }
 * returns the existence of user in the database
 */
router.post('/check/email', (req, res, next) => {
    let email = req.body.email;
    admin.auth().getUserByEmail(email).then(userRecord => {
        res.json({ code: 201, message: 'User already exists' });
    }).catch(err => {
        res.json({ code: 200, message: 'User doesnot exists' });
    });
});

// API endpoint for creation of seller
router.post('/signUp', function (req, res, next) {
    let email_ = req.body.email;
    let password_ = req.body.password;


    admin.auth().createUser({
        email: email_,
        password: password_,
    }).then(function (userRecord) {
        res.json({ response: 200, uid: userRecord.uid });
    }).catch(function (error) {
        console.error(error);
        res.json({ response: 500, err: error });
    });
});

function profileUpload(uid, req, res) {
    let profileStorage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads/seller/profile/');
        },
        filename: function (req, file, cb) {
            cb(null, file.fieldname + '-' + uid + '.' + file.originalname.split('.')[1]);
        },
    });

    let profileImageEndpoint = multer({ storage: profileStorage }).single('UID');
    profileImageEndpoint(req, res, function (err) {
        if (err) {
            console.error(err);
        } else {
            console.log('Image Uploaded Successfully');
            bucket.upload(req.file.path, function (err, file, apiResponse) {
                if (err) {
                    console.error(err);
                } else {
                    downloadLink(file, function (err, link) {
                        if (err) {
                            console.error(err);
                            res.json({ response: 500 })
                        } else {
                            console.log(link);
                            sellerHelper.updateProfileImage(uid, link, err => {
                                if (err) {
                                    console.error(err);
                                    res.json({ response: 500 });
                                }
                            });
                            res.json({ response: 200, downloadLink: link });
                        }
                    });
                }
            });
        }
    });
}

/**
 * API endpoint for uploading the profile image of the user
 */
router.post('/seller/profile/:uid', (req, res, next) => {
    let uid = req.params.uid;
    profileUpload(uid, req, res);
});

/**
 * Function to the uid from the email of the user
 */
router.get('/getuid', (req, res, next) => {
    let email = req.query.email;
    console.log('Email', email);

    admin.auth().getUserByEmail(email)
        .then(record => {
            let uid_ = record.uid;
            res.json({ response: 200, uid: uid_ });
        })
        .catch(err => {
            console.log(err);
            res.json({ response: 500 });
        });
});

// API endpoint for creation of entry of seller into firestore
router.post('/push/seller', (req, res, next) => {
    let password_ = req.body.password;
    let uid = req.body.uid;

    saveData(uid, password_, err => {
        if (err) {
            console.error(err);
            res.json({ response: 500, reason: err });
        } else {
            res.json({ response: 200 });
        }
    });
});


// API endpoint for authenticating seller
router.post('/login', function (req, res, next) {
    let email_ = req.body.email;
    let password_ = req.body.password;

    admin.auth().getUserByEmail(email_)
        .then(function (userRecord) {
            let uid = userRecord.uid;
            rootRef
                .child('seller/registered/' + uid)
                .on('value', function (snapshot) {
                    if (snapshot.val().password === password_) {
                        res.json({ response: 200, flag: true, uid: uid });
                    } else {
                        res.json({ response: 200, flag: false });
                    }
                });
        })
        .catch(function (error) {
            console.error('Error authenticating user ' + error);
            res.json({ response: 500 });
        });
});
module.exports = router;

