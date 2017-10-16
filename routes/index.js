var express = require('express'),
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
    console.log(file);
    cb(null, file.fieldname + '-' + Date.now() + '.' + file.originalname.split('.')[1])
  }
});

var upload = multer({ storage: storage }).any();


router.post('/upload', function (req, res, next) {
  upload(req, res, function (err) {
    if (err) {
      console.error(err)
    } else {
      console.log("Image uploaded Successfully ");
      console.log(req.files[0]);
      var data = {
        response: 200,
        filename: req.files[0].filename
      };
      res.sendFile(process.env.PWD + "/" + req.files[0].path)
    }
  })
});

router.get('/', function (req, res, next) {
  res.send('index.jade')
});

router.post('/updateToken', function (req, res, next) {
  var uid = req.body.uid;
  var token = req.body.token;
  regToken = token;
  ref.child('Tokens').child(uid).set({
    Token: token
  }, function (error) {
    if (error) {
      console.error(error)
    } else {
      console.log("Token Updated Successfully");
      res.json({Code: 200, Status: "Updated Successfully"})
    }
  })
});

module.exports = router;
