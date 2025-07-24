const express = require('express');
const usersDAO = require('../database/usersDAO');
const requireAuth = require('../middlewares/requireAuth');
const listingsDAO = require('../database/listingsDAO');
const router = express.Router();

router.get('/new', requireAuth, async (req, res) => {    
    res.render('new', { error: null });
});

router.post('/new', requireAuth, async (req, res) => { // <--- Middleware de upload removido daqui
    try {
        const { gameId, platform, condition, price, description } = req.body;
        const vendorId = req.session.userId;

        // Verifica se os campos essenciais foram enviados
        if (!gameId || !platform || !price || !condition) {
            req.flash('message', { type: 'error', text: 'Campos obrigatórios estão faltando.' });
            return res.redirect('/new');
        }

        // --- A lógica de processar 'req.files' foi removida ---

        // Monta o objeto de dados para o DAO (sem o campo 'photos')
        const listingData = {
            gameId: parseInt(gameId),
            platform,
            vendorId,
            price: parseFloat(price),
            condition,
            description: description || "",
            // photos: photoUrls // <--- Linha removida
        };
        
        const result = await listingsDAO.createListing(listingData);

        if (result.insertedId) {
            req.flash('message', { type: 'success', text: 'Seu jogo foi anunciado com sucesso!' });
            res.redirect('/listings');
        } else {
            throw new Error("Falha ao inserir o anúncio no banco de dados.");
        }

    } catch (error) {
        console.error("Erro na rota de criação de anúncio:", error);
        req.flash('message', { type: 'error', text: 'Ocorreu um erro ao criar seu anúncio. Tente novamente.' });
        res.redirect('/new');
    }
});

module.exports = router;