var express = require('express');
var router = express.Router();
var admin = require('../helpers/firebaseAdmin');
var db = admin.database();
var rootRef = db.ref("/");
var bucket = admin.storage().bucket();

var mkdirp = require('mkdirp');
var fs = require('fs');
var multer = require('multer');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});


var saveData = function (userRecord, password) {
  var uid = userRecord.uid;
  rootRef.child("seller/registered/" + uid).set({
    password: password
  }, function (error) {
    if (error) {
      console.error(error);
    } else {
      console.log("User pushed");
    }
  })
};

/* Function for checking existence of directory or not
* directory : name or path of the directory from the present directory
* callback : Callback function
*/
function checkDirectory(directory, callback) {
  fs.stat(directory, function (err, stats) {
    if (err) {
      mkdirp(directory, function (err) {
        if (err) {
          callback(err)
        } else {
          console.log("Created profile Image")
        }
      })
    } else {
      callback(err)
    }
  })
}

checkDirectory("uploads/seller/profile/", function (error) {
  if (error) {
    console.error(error)
  } else {
    console.log("Profile Images directory created")
  }
});

function imageUpload(uid, req, res) {
  var profileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/seller/profile/')
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + uid + '.' + file.originalname.split('.')[1])
    }
  });

  var profileImageEndpoint = multer({storage: profileStorage}).single('profile_' + uid);
  profileImageEndpoint(req, res, function (err) {
    if (err) {
      console.error(err);
    } else {
      console.log("Image Uploaded Successfully");
      bucket.upload(req.file.path, function (err, file, apiResponse) {
        if (err) {
          console.error(err);
        } else {
          console.log(file);
          res.json({response: 200})
        }
      })
    }
  })
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
router.post('/profile/:uid', function (req, res, next) {
  var uid = req.params.uid;
  rootRef.child("seller/registered/" + uid).on("value", function (snapshot) {

    // Valid seller
    if (snapshot.exists()) {
      var name = req.body.name;
      var planChosen = req.body.planId;
      var address = req.body.address;
      var contactNo = req.body.contactNo;

      imageUpload(uid, req, res);

    }

  })
});


// API endpoint for creation of seller
router.post('/signUp', function (req, res, next) {
  var email_ = req.body.email;
  var password_ = req.body.password;

  admin.auth().createUser({
    email: email_,
    password: password_
  }).then(function (userRecord) {
    console.log("User record created successfully: " + userRecord.uid);
    status = saveData(userRecord, password_);
    res.json({response: 200});
  }).catch(function (error) {
    console.error("Error creating user: " + error);
    res.json({response: 500})
  })

});


// API endpoint for authenticating seller
router.post('/login', function (req, res, next) {

  var email_ = req.body.email;
  var password_ = req.body.password;

  admin.auth().getUserByEmail(email_)
    .then(function (userRecord) {
      var uid = userRecord.uid;
      rootRef.child("seller/registered/" + uid).on("value", function (snapshot) {
        if (snapshot.val().password === password_) {
          res.json({response: 200, flag: true})
        } else {
          res.json({response: 200, flag: false})
        }
      });
    }).catch(function (error) {
    console.error("Error authenticating user " + error);
    res.json({response: 500})
  })

});
module.exports = router;
