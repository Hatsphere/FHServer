let express = require('express');
let router = express.Router();

router.post('/send/:uid', (req, res, next) => {
    let uid = req.params.uid;
    res.json({code: 200});
});

module.exports = router;