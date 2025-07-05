var express = require('express');
var router = express.Router();

router.get('/:consoleId/acs/', (req, res) => {
    const { consoleId } = req.params;

    console.log(consoleId)

    res.render('index');
});

router.get('/:consoleId/acs/:acsId', (req, res) => {
    const { consoleId, acsId } = req.params;

    console.log(consoleId, acsId)

    res.render('index');
});

module.exports = router;