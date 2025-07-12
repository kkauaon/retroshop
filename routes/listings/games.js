var express = require('express');
var router = express.Router();

const IGDB = require('../../database/igdb')

const platforms = require('../../igdb.json');
const listingsDAO = require('../../database/listingsDAO');

/*router.get('/games', (req, res) => {
    res.render('all-games')
})*/

router.get('/:consoleId/games/', async (req, res) => {
    const { consoleId } = req.params;

    const console = platforms.platforms.find(pl => pl.slug == consoleId)

    if (console) {
        let games = [];

        let hasQuery = false;

        if (req.query.q) {
            hasQuery = true;
            games = await listingsDAO.searchGamesByPlatform(req.query.q, console.id)
        } else {
            games = await listingsDAO.mostRatedGamesByPlatform(console.id)
        }

        res.render('games', { platform: console, games, hasQuery });
    } else { 
        res.render('404')
    }
});

router.get('/games/:gameId', async (req, res) => {
    const { gameId } = req.params;

    const info = await listingsDAO.getGameById(gameId);

    res.render('game', {game: info, platforms: platforms.platforms});
});

module.exports = router;