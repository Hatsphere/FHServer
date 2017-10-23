let express = require('express'),
    multer = require('multer');
let router = express.Router();
let admin = require('../helpers/firebaseAdmin');
let db = admin.database();
let ref = db.ref('/');

let storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        console.log(file);
        cb(null, file.fieldname + '-' + Date.now() + '.' + file.originalname.split('.')[1]);
    },
});

let upload = multer({storage: storage}).any();


router.post('/upload', function(req, res, next) {
    upload(req, res, function(err) {
        if (err) {
            console.error(err);
        } else {
            console.log('Image uploaded Successfully!');
            console.log(req.files[0]);
            let data = {
                response: 200,
                filename: req.files[0].filename,
            };
            res.sendFile(process.env.PWD + '/' + req.files[0].path);
        }
    });
});

router.get('/', function(req, res, next) {
    res.send('index.jade');
});

router.post('/updateToken', function(req, res, next) {
    let uid = req.body.uid;
    let token = req.body.token;
    let regToken = token;
    ref.child('Tokens').child(uid).set({
        Token: token,
    }, function(error) {
        if (error) {
            console.error(error);
        } else {
            console.log('Token Updated Successfully');
            res.json({Code: 200, Status: 'Updated Successfully'});
        }
    });
});

module.exports = router;
