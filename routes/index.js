var express = require('express');
var router = express.Router();

var admin = require('../helpers/firebaseAdmin');
var db = admin.database();
var ref = db.ref("/");

ref.on("child_changed", function (snapshot) {
  console.log("child_changed: " + snapshot.val())
})

ref.on("child_added", function (snapshot, prevChildKey) {
  console.log("child_added: " + snapshot.val())
  var payload = {
    notification: {
      title: snapshot.toJSON().toString(),
      body: 'Notification Message'
    }
  }

  var options = {
    priority: "high",
    timeToLive: 60 * 60 * 24
  };

  var regToken = 'c6SbvOo94cE:APA91bFJbsBZHEtJWTSrgDI_9XOFTF26lo9lBKMRT3lgiAfUGb6TCH6bwYuKila5ogouZX1bUtbJgvkM3b10Um0cGSq5TVVoizZlElfCCsvaK2QkdKNUbdRs2rXJpw5Q20GK6tohPHu4'
  admin.messaging().sendToDevice(regToken, payload, options)
    .then(function (response) {
      console.log("Message Sent Successfully")
    })
    .catch(function (error) {
      console.error(error)
    })
})

ref.on("child_removed", function (snapshot) {
  console.log("child_removed: " + snapshot.val())
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
      res.json("{ Code: 200 }")
    }
  })
})

module.exports = router;
