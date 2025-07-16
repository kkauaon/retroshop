var express = require('express');
const usersDAO = require('../database/usersDAO');
var router = express.Router();

router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Erro ao sair');
        }
        res.redirect('/');
    });
});


module.exports = router;