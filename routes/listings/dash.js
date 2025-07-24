const express = require('express');
const router = express.Router();
const requireAuth = require('../../middlewares/requireAuth');
const listingsDAO = require('../../database/listingsDAO');
const igdb = require('../../database/igdb');
const { ObjectId } = require('mongodb');
const platforms = require('../../igdb.json');

/**
 * Rota GET para exibir a página "Meus Anúncios"
 */
router.get('/listings', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;

        // 1. Busca todos os anúncios do usuário no nosso banco
        const userListings = await listingsDAO.findListingsByVendor(userId);

       

        let enrichedListings = [];
        if (userListings.length > 0) {
            // 2. Pega os IDs dos jogos para buscar na IGDB
            const gameIds = userListings.map(listing => listing.gameId);
            const igdbDetails = await igdb.getGamesByIds(gameIds);

            // 3. "Enriquece" nossos anúncios com os dados da IGDB (nome, capa)
            enrichedListings = userListings.map(listing => {
                const gameInfo = igdbDetails.find(g => g.id === listing.gameId);
                const console = platforms.platforms.find(pl => pl.slug == listing.platform)

                return {
                    ...gameInfo,
                    
                    mongo: {
                        ...listing,
                        platform: console.name
                    },
                    
                };
            });
        }
        
        res.render('dash', {
            title: "Meus Anúncios",
            listings: enrichedListings,
            message: req.flash('message')
        });

    } catch (error) {
        console.error("Erro ao carregar 'Meus Anúncios':", error);
        res.status(500).send("Ocorreu um erro ao carregar seus anúncios.");
    }
});

/**
 * Rota POST para ativar/desativar um anúncio
 */
router.post('/listings/status/:listingId', requireAuth, async (req, res) => {
    try {
        const { listingId } = req.params;
        const userId = req.session.userId;

        // Busca o anúncio para verificar o dono e o status atual
        const listing = await listingsDAO.db.findOne({ _id: new ObjectId(listingId), vendorId: new ObjectId(userId) });

        if (listing) {
            const newStatus = listing.status === 'active' ? 'inactive' : 'active';
            await listingsDAO.updateListing(listingId, userId, { status: newStatus });
            req.flash('message', { type: 'success', text: 'Status do anúncio alterado!' });
        } else {
            req.flash('message', { type: 'error', text: 'Anúncio não encontrado ou você não tem permissão.' });
        }
    } catch (error) {
        console.error("Erro ao alterar status do anúncio:", error);
        req.flash('message', { type: 'error', text: 'Ocorreu um erro.' });
    }
    res.redirect('/listings');
});


/**
 * Rota POST para excluir um anúncio
 */
router.post('/listings/delete/:listingId', requireAuth, async (req, res) => {
    try {
        const { listingId } = req.params;
        const userId = req.session.userId;

        const result = await listingsDAO.deleteListing(listingId, userId);

        if (result.deletedCount > 0) {
            req.flash('message', { type: 'success', text: 'Anúncio excluído com sucesso.' });
        } else {
            req.flash('message', { type: 'error', text: 'Anúncio não encontrado ou você não tem permissão.' });
        }
    } catch (error) {
        console.error("Erro ao excluir anúncio:", error);
        req.flash('message', { type: 'error', text: 'Ocorreu um erro ao excluir o anúncio.' });
    }
    res.redirect('/listings');
});


module.exports = router;