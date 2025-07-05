const { Collection, MongoClient, ObjectId } = require("mongodb");
const igdb = require("./igdb");

class ListingsDAO {
    async setClient(client) {
        /**
         * @type {Collection}
         * @private
         */
        this.db = client.db("retroshop").collection("listings")
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
            const gamesData = await igdb.searchGamesByPlatform(query, platform)

            const prices = await this.findLowestPricesForGames(gamesData.map(z => z.id))

            console.log(prices)

            for (let i = 0; i < gamesData.length; i++) {
                gamesData[i].mongo = prices.find(z => z.gameId == gamesData[i].id)
            }

            return gamesData
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
    async findLowestPriceForGame(gameId) {
        try {
            const lowestPriceGame = await this.db.find({
                gameId: gameId // Filter documents by the provided gameId
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
    async findLowestPricesForGames(gameIds) {
        try {
            const lowestPrices = await this.db.aggregate([
                {
                    $match: {
                        gameId: { $in: gameIds } // Match documents where gameId is in the provided array
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
}

module.exports = new ListingsDAO();