var express = require('express');
const usersDAO = require('../database/usersDAO');
var router = express.Router();

router.get('/signup', async (req, res) => {
    res.render('signup', { error: null, email: '', nome: '' });
});

router.post('/signup', async (req, res) => {
    const { email, nome, senha } = req.body;

    if (!email || !nome || !senha) {
        return res.render('signup', { error: 'Preencha todos os campos', email, nome });
    }

    try {
        const user = await usersDAO.createUser({ email, nome, senha });
        // Cria a sessão do usuário automaticamente após cadastro
        req.session.userId = user._id.toString();
        req.session.userName = user.name;
        res.redirect('/');
    } catch (err) {
        res.render('signup', { error: err.message, email, nome });
    }
});


module.exports = router;