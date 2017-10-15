var express = require('express'),
  fs = require('fs'),
  multer = require('multer');
var router = express.Router();
var admin = require('../helpers/firebaseAdmin');
var db = admin.database();
var ref = db.ref("/");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    console.log(file)
    cb(null, file.fieldname + '-' + Date.now() + '.' + file.originalname.split('.')[1])
  }
})

var upload = multer({ storage: storage }).any()


router.post('/upload', function (req, res, next) {
  upload(req, res, function (err) {
    if (err) {
      console.error(err)
    } else {
      console.log("Image uploaded Successfully")
      res.json({response: 200})
    }
  })
});


// // child node changed/updated
// ref.on("child_changed", function (snapshot) {
//   console.log("child_changed: " + snapshot.val())
// })
//
// // child added at the reference
// ref.on("child_added", function (snapshot, prevChildKey) {
//   console.log("child_added: " + snapshot.val())
//   var payload = {
//     data: {
//       title: "Message",
//       body: "Message"
//     }
//   };
//
//   var options = {
//     priority: "high",
//     timeToLive: 60 * 60 * 24
//   };
//
//   // regToken to be fetched (from the firebase server)
//   // needs to be totally updated for receiving notifications/data
//   // messages and also payload
//   console.log(regToken)
//   admin.messaging().sendToDevice(regToken, payload, options)
//     .then(function (response) {
//       console.log("Message Sent Successfully")
//     })
//     .catch(function (error) {
//       console.error(error)
//     })
// })
//
// // listener for child_removed and gets the snapshot of that removed child
// ref.on("child_removed", function (snapshot) {
//   console.log("child_removed: " + snapshot.val())
// })

router.get('/', function (req, res, next) {
  res.send('index.jade')
})

router.get('/db', function (req, res, next) {
  ref.once("value", function (snapshot) {
    console.log(snapshot.val())
  }, function (errorObject) {
      console.log("Read failed: " + errorObject.code)
  })
})

router.post('/send', function (req, res, next) {
  var name = req.param("Name", null)
  console.log(req.param("Token"))
  ref.push({
    Name: name
  }, function (error) {
    if (error) {
      console.error(error.message)
    } else {
      console.log("Data Sent Successfully")
      res.json({Code: 200})
    }
  })
})

router.post('/updateToken', function (req, res, next) {
  var uid = req.body.uid
  var token = req.body.token
  regToken = token
  ref.child('Tokens').child(uid).set({
    Token: token
  }, function (error) {
    if (error) {
      console.error(error)
    } else {
      console.log("Token Updated Successfully")
      res.json({Code: 200, Status: "Updated Successfully"})
    }
  })
})

module.exports = router;
