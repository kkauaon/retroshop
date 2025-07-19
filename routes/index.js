const express = require('express');
const listingsDAO = require('../database/listingsDAO');
const router = express.Router();

router.use(require('./listings/games'))
router.use(require('./signin'))
router.use(require('./signup'))
router.use(require('./logout'))

router.get('/', async (req, res) => {
    const game = listingsDAO.getOffer();

    const trending = await listingsDAO.getTrendingGames();
    
    res.render('index', { offer: game, trending });
});

module.exports = router;