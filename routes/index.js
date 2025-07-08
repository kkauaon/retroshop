var express = require('express');
const listingsDAO = require('../database/listingsDAO');
var router = express.Router();

router.get('/', async (req, res) => {
    const game = listingsDAO.getOffer();
    
    res.render('index', { offer: game });
});

module.exports = router;