var express = require('express');
var router = express.Router();

const IGDB = require('../../database/igdb')

const platforms = require('../../igdb.json')

/*router.get('/games', (req, res) => {
    res.render('all-games')
})*/

router.get('/:consoleId/games/', async (req, res) => {
    const { consoleId } = req.params;

    const console = platforms.platforms.find(pl => pl.slug == consoleId)

    if (console) {
        games = [];

        if (req.query.q) {
            games = await IGDB.searchGamesByPlatform(req.query.q, console.id)
        }

        res.render('games', { platform: console, games });
    } else { 
        res.render('404')
    }
});

router.get('/games/:gameId', (req, res) => {
    const { gameId } = req.params;

    console.log(gameId)

    res.render('index');
});

module.exports = router;