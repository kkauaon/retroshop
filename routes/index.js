var express = require('express');
const listingsDAO = require('../database/listingsDAO');
var router = express.Router();

router.use(require('./listings/games'))
router.use(require('./signin'))
router.use(require('./signup'))

router.get('/', async (req, res) => {
    const game = listingsDAO.getOffer();

    const trending = await listingsDAO.getTrendingGames();
    
    res.render('index', { offer: game, trending });
});

module.exports = router;