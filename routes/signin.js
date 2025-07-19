const express = require('express');
const usersDAO = require('../database/usersDAO');
const router = express.Router();

router.get('/signin', async (req, res) => {    
    res.render('signin', { error: null, email: '' });
});

router.post('/signin', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.render('signin', { error: 'Preencha todos os campos', email });
    }

    try {
        const user = await usersDAO.verifyUser(email, senha);
        req.session.userId = user._id.toString();
        req.session.userName = user.name;
        res.redirect('/');
    } catch (err) {
        res.render('signin', { error: err.message, email });
    }
});

module.exports = router;