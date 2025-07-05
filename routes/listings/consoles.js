var express = require('express');
var router = express.Router();

router.use(require('./games'))
router.use(require('./acessories'))

router.get('/:consoleId', (req, res) => {
    const consoleId = req.params.consoleId;

    console.log(consoleId)

    res.render('index');
});



module.exports = router;