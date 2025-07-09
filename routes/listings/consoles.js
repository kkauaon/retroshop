var express = require('express');
var router = express.Router();

const platforms = require('../../igdb.json');

router.get('/:consoleId', (req, res) => {
    const consoleId = req.params.consoleId;

    const console = platforms.platforms.find(pl => pl.slug == consoleId)

    res.render('games', { platform: consoleId, games: [] });
});



module.exports = router;