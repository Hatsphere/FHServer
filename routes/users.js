var express = require('express');
var router = express.Router();
var admin = require('../helpers/firebaseAdmin');
var db = admin.database();
var rootRef = db.ref("/");

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
