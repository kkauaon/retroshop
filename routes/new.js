const express = require('express');
const usersDAO = require('../database/usersDAO');
const requireAuth = require('../middlewares/requireAuth');
const router = express.Router();

router.get('/new', requireAuth, async (req, res) => {    
    res.render('new', { error: null });
});

router.post('/new', requireAuth, async (req, res) => {
    console.log(req.body)
    res.redirect('/new')
})

module.exports = router;