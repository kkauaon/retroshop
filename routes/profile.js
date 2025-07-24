const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/requireAuth');
const usersDAO = require('../database/usersDAO');

/**
 * Rota GET para exibir a página de perfil do usuário.
 * Busca os dados mais recentes do usuário no banco e os exibe no formulário.
 */
router.get('/profile', requireAuth, async (req, res) => {
    try {
        // Pega o ID do usuário da sessão
        const userId = req.session.userId;
        
        // Busca os dados completos e atualizados do usuário no banco
        const user = await usersDAO.findById(userId);

        if (!user) {
            // Caso raro em que o usuário da sessão não existe mais no DB
            req.session.destroy();
            return res.redirect('/signin');
        }

        // Renderiza a página 'profile.ejs', passando os dados do usuário
        // e qualquer mensagem de feedback (ex: "Perfil atualizado com sucesso!")
        res.render('profile', { 
            title: "Meu Perfil",
            user: user,
            error: false,
            success: false,
        });
    } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        res.status(500).send("Ocorreu um erro ao carregar seu perfil.");
    }
});

/**
 * Rota POST para atualizar as informações de contato do usuário.
 * Recebe os dados do formulário e chama o DAO para atualizar o banco.
 */
router.post('/profile', requireAuth, async (req, res) => {
    const userId = req.session.userId;
    const { name, whatsapp, city, state } = req.body;

    // Busca os dados completos e atualizados do usuário no banco
    let user = await usersDAO.findById(userId);

    try {


        // Estrutura os dados para enviar ao DAO, conforme a função updateUser espera
        const updateData = {
            name,
            contactInfo: {
                whatsapp,
                city,
                state
            }
        };

        // Chama o método do DAO para atualizar o usuário
        const result = await usersDAO.updateUser(userId, updateData);

        user = await usersDAO.findById(userId);

        if (result.modifiedCount > 0) {
            res.render('profile', { 
                title: "Meu Perfil",
                user: user,
                error: false,
                success: true
            });
        } else {
            res.render('profile', { 
                title: "Meu Perfil",
                user: user,
                error: false,
                success: true
            });
        }

        return;
        
    } catch (error) {
        user = await usersDAO.findById(userId);
        console.error("Erro ao atualizar perfil:", error);
        res.render('profile', { 
            title: "Meu Perfil",
            user: user,
            error: true,
            success: false
        });
        return;
    }
});

module.exports = router;