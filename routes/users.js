let express = require('express');
let router = express.Router();
let admin = require('../helpers/firebaseAdmin');
let db = admin.database();
let rootRef = db.ref('/');
let bucket = admin.storage().bucket();
let imageOptimize = require('../imagemin')

let mkdirp = require('mkdirp');
let fs = require('fs');
let multer = require('multer');

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});


// save seller data to the realtime database
let saveData = function(userRecord, password, callback) {
    let uid = userRecord.uid;
    rootRef.child('seller/registered/' + uid).set({
        password: password,
    }, function(error) {
        if (error) {
            callback(error);
        } else {
            console.log('User pushed');
        }
    });
};

/* Function for checking existence of directory or not
* directory : name or path of the directory from the present directory
* callback : Callback function
*/
function checkDirectory(directory, callback) {
    fs.stat(directory, function(err, stats) {
        if (err) {
            mkdirp(directory, function(err) {
                if (err) {
                    callback(err);
                } else {
                    console.log('Created profile Image');
                }
            });
        } else {
            callback(err);
        }
    });
}

/* Function for checking the directory for profile images
* If it doesn't exists, it create that directory recursively
*/
checkDirectory('uploads/seller/profile/', function(error) {
    if (error) {
        console.error(error);
    } else {
        console.log('Profile Images directory created');
    }
});

// Function for generation of download link using file
function downloadLink(file, callback) {
    file.getSignedUrl({
        action: 'read',
        expires: '12-31-2030',
    }, function(err, url) {
        if (err) {
            callback(err);
        } else {
            callback(err, url);
        }
    });
}


/*
* profile image upload function for storing images using multer
* Image saved will get uploaded to firebase storage using google-storage
*/
function imageUpload(uid, req, res) {
    let profileStorage = multer.diskStorage({
        destination: function(req, file, cb) {
            cb(null, 'uploads/seller/profile/');
        },
        filename: function(req, file, cb) {
            cb(null, file.fieldname + '-' + uid + '.' + file.originalname.split('.')[1]);
        },
    });

    let profileImageEndpoint = multer({storage: profileStorage}).single('profile_' + uid);
    profileImageEndpoint(req, res, function(err) {
        if (err) {
            console.error(err);
        } else {
            console.log('Image Uploaded Successfully');
            imageOptimize.optimize(req.file.path, req.file.destination, function(file) {
                console.log('File optimized: ', file.path)
                bucket.upload(file.path, function(err, file, apiResponse) {
                    if (err) {
                        console.error(err);
                    } else {
                        downloadLink(file, function(err, link) {
                            if (err) {
                                console.error(err);
                            } else {
                                console.log(link);
                                res.json({response: 200, downloadLink: link});
                            }
                        });
                    }
                });
            })
        }
    });
}

/* API endpoint for creating profile of the seller
* Json contains:
* name: name_value
* planId: plan_value
* address: Address_value
* contactNo : phone_number_value
* profileImage to be uploaded with key ; profile_uid
* uid : Id of the user in firebase
*/
router.post('/profile/:uid', function(req, res, next) {
    let uid = req.params.uid;
    rootRef.child('seller/registered/' + uid).on('value', function(snapshot) {
    // Valid seller
        if (snapshot.exists()) {
            let name = req.body.name;
            let planChosen = req.body.planId;
            let address = req.body.address;
            let contactNo = req.body.contactNo;

            imageUpload(uid, req, res);
        }
    });
});


// API endpoint for creation of seller
router.post('/signUp', function(req, res, next) {
    let email_ = req.body.email;
    let password_ = req.body.password;

    admin.auth().createUser({
        email: email_,
        password: password_,
    }).then(function(userRecord) {
        console.log('Seller created: ' + userRecord.uid);
        saveData(userRecord, password_, function(error) {
            if (error) {
                console.error(error);
            } else {
                console.log('Pushed Successfully');
            }
        });
    }).catch(function(error) {
        if (error.code === 'auth/email-already-exists') {
            admin.auth().getUserByEmail(email_)
                .then(function(userRecord) {
                    let uid = userRecord.uid;
                    rootRef.child('seller/registered/' + uid).on('value', function(snapshot) {
                        if (snapshot.val().password === password_) {
                            res.json({response: 200});
                        } else {
                            res.json({response: 500});
                        }
                    });
                })
                .catch(function(error) {
                    console.log('Error fetching user data:', error);
                });
        } else {
            res.json({response: 500});
        }
    });
});


// API endpoint for authenticating seller
router.post('/login', function(req, res, next) {
    let email_ = req.body.email;
    let password_ = req.body.password;

    admin.auth().getUserByEmail(email_)
        .then(function(userRecord) {
            let uid = userRecord.uid;
            rootRef.child('seller/registered/' + uid).on('value', function(snapshot) {
                if (snapshot.val().password === password_) {
                    res.json({response: 200, flag: true});
                } else {
                    res.json({response: 200, flag: false});
                }
            });
        }).catch(function(error) {
            console.error('Error authenticating user ' + error);
            res.json({response: 500});
        });
});
module.exports = router;

