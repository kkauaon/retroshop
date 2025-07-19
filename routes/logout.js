const express = require('express');
const usersDAO = require('../database/usersDAO');
const router = express.Router();

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.log("Erro ao sair da sessão: ", err);
            return res.redirect('/');
        }
        res.redirect('/');
    });
});


module.exports = router;