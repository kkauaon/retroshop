var express = require('express');
var router = express.Router();

router.get('/signin', async (req, res) => {    
    res.render('signin');
});

module.exports = router;