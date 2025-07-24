const { Collection, MongoClient, ObjectId } = require("mongodb");
const igdb = require("./igdb");
const platforms = require('../igdb.json')

class ListingsDAO {
    async setClient(client) {
        /**
         * @type {Collection}
         * @private
         */
        this.db = client.db("retroshop").collection("listings")
    }

    setOffer(game) {
        this.offer = game
    }

    getOffer() {
        return this.offer
    }

    /**
     * Searches for games by name and platform matching IGDB data with MongoDB data.
     *
     * @param {string} query - The search query for the game name.
     * @param {string} platform - The platform ID to filter games by.
     * @returns {Promise<Array<{ id: number, name: string, cover: number, coverUrl: string, price: number }>>} 
     *   A promise that resolves to an array of game objects, each containing the game ID, name, cover ID, and cover image URL.
     */
    async searchGamesByPlatform(query, platform, onlyIGDBData = false) {
        try {
            const platData = platforms.platforms.find(p => p.id == platform)

            const gamesData = await igdb.searchGamesByPlatform(query, platform)

            let prices = [];
            if (!onlyIGDBData) prices = await this.findLowestPricesForGames(gamesData.map(z => z.id), platData.slug)

            for (let i = 0; i < gamesData.length; i++) {
                if (!gamesData[i].total_rating_count) gamesData[i].total_rating_count = 0
                if (!onlyIGDBData) gamesData[i].mongo = prices.find(z => z.gameId == gamesData[i].id)
            }

            return gamesData.filter(z => !z.name.toLowerCase().includes("digital")).sort((a,b) => b.mongo - a.mongo).sort((a,b) => b.total_rating_count - a.total_rating_count)
        } catch (error) {
            throw error;
        }
    }

    async mostRatedGamesByPlatform(platform) {
        try {
            const platData = platforms.platforms.find(p => p.id == platform)

            const gamesData = await igdb.mostRatedGamesByPlatform(platform)

            const prices = await this.findLowestPricesForGames(gamesData.map(z => z.id), platData.slug)

            for (let i = 0; i < gamesData.length; i++) {
                if (!gamesData[i].total_rating_count) gamesData[i].total_rating_count = 0
                gamesData[i].mongo = prices.find(z => z.gameId == gamesData[i].id)
            }

            return gamesData.filter(z => !z.name.toLowerCase().includes("digital")).sort((a,b) => b.mongo - a.mongo).sort((a,b) => b.total_rating_count - a.total_rating_count)
        } catch (error) {
            throw error;
        }
    }

    async getGameById(gameId) {
        try {
            // 1. Busca as informações do jogo na API da IGDB
            const igdbInfo = await igdb.getGameById(gameId);

            // 2. Cria a pipeline de agregação para buscar os anúncios e juntar com os dados dos vendedores
            const pipeline = [
                {
                    // Filtra os anúncios para pegar apenas os do jogo específico e que estão ativos
                    $match: {
                        gameId: parseInt(gameId),
                        status: 'active' 
                    }
                },
                {
                    // Ordena os resultados pelo menor preço
                    $sort: { price: 1 }
                },
                {
                    // Junta ("JOIN") com a coleção 'users'
                    $lookup: {
                        from: 'users',             // A coleção com a qual queremos juntar
                        localField: 'vendorId',    // O campo da coleção 'listings'
                        foreignField: '_id',       // O campo da coleção 'users'
                        as: 'vendorInfo'           // O nome do novo campo (um array) que conterá os dados do vendedor
                    }
                },
                {
                    // Como $lookup cria um array, $unwind o transforma em um objeto único,
                    // já que cada anúncio tem apenas um vendedor.
                    $unwind: '$vendorInfo'
                },
                {
                    // Remove o campo de senha do vendedor por segurança antes de enviar os dados.
                    // Isso é MUITO IMPORTANTE.
                    $project: {
                        'vendorInfo.password': 0
                    }
                }
            ];

            // 3. Executa a agregação
            const results = await this.db.aggregate(pipeline).toArray();

            // 4. Monta o objeto final
            let data = {
                ...igdbInfo,
                vendors: results // 'results' agora contém a lista de anúncios, cada um com um campo 'vendorInfo'
            };

                console.log(data.vendors[0])
            return data;
        } catch (error) {
            console.error("Error in getGameById:", error);
            throw error;
        }
    }

    /**
     * Finds a document by a specific gameId and returns the document
     * that has the lowest price among those matching the gameId.
     *
     * @param {string} gameId The ID of the game to search for.
     * @returns {Promise<{ _id: ObjectId, gameId: number, price: number, vendorName: string, condition: string }|null>} A promise that resolves to the document with the lowest price,
     * or null if no documents are found.
     */
    async findLowestPriceForGame(gameId, platform) {
        try {
            const lowestPriceGame = await this.db.find({
                $and: [
                    {gameId: gameId},
                    {platform: platform},
                    {status: "active"}
                ]
            })
                .sort({ price: 1 })
                .limit(1)
                .toArray();

            // Check if any document was found
            if (lowestPriceGame.length > 0) {
                return lowestPriceGame[0];
            } else {
                return null;
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * Finds a document by a specific gameId and returns the document
     * that has the lowest price among those matching the gameId.
     *
     * @param {string} gameId The ID of the game to search for.
     * @returns {Promise<Array<{ _id: ObjectId, gameId: number, price: number, vendorName: string, vendorCount: number, condition: string }>|null>} A promise that resolves to the document with the lowest price,
     * or null if no documents are found.
     */
    async findLowestPricesForGames(gameIds, platform) {
        try {
            const lowestPrices = await this.db.aggregate([
                {
                    $match: {
                        $and: [
                           {gameId: { $in: gameIds } }, 
                           {platform: platform},
                           {status: "active"}
                        ],
                    }
                },
                {
                    $sort: {
                        gameId: 1, // Sort by gameId first to group similar gameIds together
                        price: 1   // Then sort by price in ascending order to get the lowest price first for each gameId
                    }
                },
                {
                    $group: {
                        _id: "$gameId", // Group by the gameId field
                        // Use $first to get the entire document that appears first in each group
                        // Due to the preceding $sort, this will be the document with the lowest price
                        lowestPriceDocument: { $first: "$$ROOT" },
                        vendorCount: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        // Project fields from the lowestPriceDocument
                        _id: "$lowestPriceDocument._id", // Include the original _id of the lowest priced document
                        gameId: "$_id", // The grouped _id is our gameId
                        name: "$lowestPriceDocument.name",
                        price: "$lowestPriceDocument.price",
                        vendorName: "$lowestPriceDocument.vendorName",
                        condition: "$lowestPriceDocument.condition",
                        platform: "$lowestPriceDocument.platform",
                        vendorCount: 1 // Include the newly calculated count
                    }
                }
            ]).toArray(); // Execute the aggregation pipeline and convert results to an array

            return lowestPrices;
        } catch (error) {
            console.error("Error finding lowest prices for games:", error);
            throw error; // Re-throw the error for further handling
        }
    }

    async getTrendingGames() {
        const pipeline = [
            { $sort: { "gameId": 1, "price": 1 } },
            {
                $group: {
                    _id: "$gameId",
                    count: { $sum: 1 },
                    cheapestListing: { $first: "$$ROOT" }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { $replaceRoot: { newRoot: "$cheapestListing" } }
        ];

        try {
            const games = await this.db.aggregate(pipeline)
                .toArray();

           

            const igdbGames = await igdb.getGamesByIds(games.map(z => z.gameId))

            const parsedGames = []

            for (let i = 0; i < games.length; i++) {
                let correspondente = igdbGames.find(z => z.id == games[i].gameId);
                
                let struct = {
                    ...correspondente
                }

                if (!struct.total_rating_count) struct.total_rating_count = 0
                struct.mongo = games[i]

                parsedGames.push(struct)
            }

            return parsedGames
        } catch (error) {
            console.error("Error finding trending games:", error);
            throw error; // Re-throw the error for further handling
        }
    }

    async getRandomGame() {
        try {
            const randomGames = await this.db.aggregate([
                { $match: { status: "active" } },
                { $sample: { size: 1 } }
            ])
                .toArray();

            if (randomGames.length > 0) {
                const gameIgdb = await igdb.getGameById(randomGames[0].gameId);

                const gameData = {
                    ...gameIgdb,
                    mongo: randomGames[0]
                }

                if (!gameData.total_rating_count) gameData.total_rating_count = 0

                return gameData;
            } else {
                return null;
            }
        } catch (error) {
            throw error;
        }
    }

        /**
     * Cria um novo anúncio no banco de dados.
     * @param {object} listingData - Dados do anúncio a ser criado.
     * @param {number} listingData.gameId - ID do jogo na IGDB.
     * @param {string} listingData.platform - Slug da plataforma.
     * @param {ObjectId} listingData.vendorId - ID do usuário vendedor.
     * @param {number} listingData.price - Preço do jogo.
     * @param {string} listingData.condition - Condição do jogo.
     * @param {string} [listingData.description] - Descrição opcional.
     * @returns {Promise<import('mongodb').InsertOneResult>} O resultado da operação de inserção.
     */
    async createListing(listingData) {
        try {
            const newListing = {
                ...listingData,
                vendorId: new ObjectId(listingData.vendorId),
                status: "active", // Anúncios começam como ativos
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            return await this.db.insertOne(newListing);
        } catch (error) {
            console.error("Error creating listing:", error);
            throw error;
        }
    }

    /**
     * Encontra um anúncio específico pelo seu ID e anexa as informações do vendedor.
     * @param {string} listingId - O ID do anúncio a ser encontrado.
     * @returns {Promise<object|null>} O documento do anúncio com os dados do vendedor, ou null se não encontrado.
     */
    async findListingById(listingId) {
        try {
            const pipeline = [
                {
                    $match: { _id: new ObjectId(listingId) }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "vendorId",
                        foreignField: "_id",
                        as: "vendorInfo"
                    }
                },
                {
                    $unwind: "$vendorInfo" // Transforma o array 'vendorInfo' em um objeto
                },
                {
                    $project: { // Remove campos sensíveis do vendedor
                        "vendorInfo.password": 0
                    }
                }
            ];
            const result = await this.db.aggregate(pipeline).toArray();
            return result.length > 0 ? result[0] : null;
        } catch (error) {
            console.error("Error finding listing by ID:", error);
            throw error;
        }
    }

    /**
     * Encontra todos os anúncios de um vendedor específico.
     * @param {string} vendorId - O ID do usuário vendedor.
     * @returns {Promise<Array<object>>} Uma lista dos anúncios do vendedor.
     */
    async findListingsByVendor(vendorId) {
        try {
            return await this.db.find({ vendorId: new ObjectId(vendorId) })
                .sort({ createdAt: -1 })
                .toArray();
        } catch (error) {
            console.error("Error finding listings by vendor:", error);
            throw error;
        }
    }

    /**
     * Atualiza os dados de um anúncio, verificando a propriedade.
     * @param {string} listingId - O ID do anúncio a ser atualizado.
     * @param {string} vendorId - O ID do vendedor (para segurança).
     * @param {object} updateData - Os campos a serem atualizados (ex: { price, description }).
     * @returns {Promise<import('mongodb').UpdateResult>} O resultado da operação de atualização.
     */
    async updateListing(listingId, vendorId, updateData) {
        try {
            // Garante que o updatedAt seja sempre atualizado
            const dataToSet = { ...updateData, updatedAt: new Date() };

            return await this.db.updateOne(
                { _id: new ObjectId(listingId), vendorId: new ObjectId(vendorId) },
                { $set: dataToSet }
            );
        } catch (error) {
            console.error("Error updating listing:", error);
            throw error;
        }
    }

    /**
     * Exclui um anúncio, verificando a propriedade.
     * @param {string} listingId - O ID do anúncio a ser excluído.
     * @param {string} vendorId - O ID do vendedor (para segurança).
     * @returns {Promise<import('mongodb').DeleteResult>} O resultado da operação de exclusão.
     */
    async deleteListing(listingId, vendorId) {
        try {
            return await this.db.deleteOne(
                { _id: new ObjectId(listingId), vendorId: new ObjectId(vendorId) }
            );
        } catch (error) {
            console.error("Error deleting listing:", error);
            throw error;
        }
    }
}

module.exports = new ListingsDAO();