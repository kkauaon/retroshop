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
    async searchGamesByPlatform(query, platform) {
        try {
            const platData = platforms.platforms.find(p => p.id == platform)

            const gamesData = await igdb.searchGamesByPlatform(query, platform)

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
            const igdbInfo = await igdb.getGameById(gameId);

            const results = await this.db.find({
                gameId: parseInt(gameId)
            })
                .sort({ price: 1 })
                .toArray();

            let data = {
                ...igdbInfo,
                vendors: results
            }

            return data;
        } catch (error) {
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
                    {platform: platform}
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
}

module.exports = new ListingsDAO();