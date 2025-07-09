const fs = require('fs')
const { default: apicalypse } = require('apicalypse')

class IGDB {    
    constructor() {
        if (!fs.existsSync('./igdb.json')) {
            console.warn("Credenciais da API IGDB não foram configuradas. Funcionalidades cruciais podem não funcionar.")
        } else {
            const buffer = fs.readFileSync('./igdb.json', { encoding: 'utf-8' })

            const json = JSON.parse(buffer)

            const requestOptions = {
                queryMethod: 'body',
                method: 'post', // The default is `get`
                baseURL: 'https://api.igdb.com/v4',
                headers: {
                    'Authorization': 'Bearer ' + json.access_token,
                    'Client-ID': process.env.IGDB_CLIENT_ID,
                    'Accept': 'application/json'
                },
                responseType: 'json',
            };

            this.requestOptions = requestOptions
        }
    }


    /**
     * Searches for games by name and platform using the IGDB API.
     *
     * @param {string} query - The search query for the game name.
     * @param {string} platform - The platform ID to filter games by.
     * @returns {Promise<Array<{ id: number, name: string, cover: number, coverUrl: string, total_rating_count?: string }>>} 
     *   A promise that resolves to an array of game objects, each containing the game ID, name, cover ID, and cover image URL.
     */
    async searchGamesByPlatform(query, platform) {
        const gamesData = await apicalypse(this.requestOptions)
            .fields(["id", "name", "cover", "total_rating_count"])
            .search(query)
            .where([`platforms = (${platform})`, `game_type = (0,3,4,10,11,8)`, `(game_status = (0,4,5,8) | game_status = null)`])
            .limit(500)
            .request('/games')

        if (gamesData.data.length > 0) {
            const coversData = await apicalypse(this.requestOptions)
                .fields(["id","image_id"])
                .where(`id = (${gamesData.data.filter(z => z.cover).map(z => z.cover).join(',')})`)
                .limit(500)
                .request('/covers')

            for (let i = 0; i < coversData.data.length; i++) {
                const coverData = coversData.data[i];

                const index = gamesData.data.findIndex((z) => z.cover == coverData.id)

                //gamesData.data[index].price = 124.59

                if (index > -1) gamesData.data[index].coverUrl = `https://images.igdb.com/igdb/image/upload/t_720p/${coverData.image_id}.jpg`
            }
        }

        return gamesData.data
    }

    async getGameById(gameId) {
        const gamesData = await apicalypse(this.requestOptions)
            .fields(["id", "name", "cover", "total_rating_count"])
            .where([`id = ${gameId}`])
            .limit(1)
            .request('/games')

        if (gamesData.data.length > 0) {
            const coversData = await apicalypse(this.requestOptions)
                .fields(["id","image_id"])
                .where(`id = (${gamesData.data.filter(z => z.cover).map(z => z.cover).join(',')})`)
                .limit(1)
                .request('/covers')

            for (let i = 0; i < coversData.data.length; i++) {
                const coverData = coversData.data[i];

                const index = gamesData.data.findIndex((z) => z.cover == coverData.id)

                //gamesData.data[index].price = 124.59

                if (index > -1) gamesData.data[index].coverUrl = `https://images.igdb.com/igdb/image/upload/t_720p/${coverData.image_id}.jpg`
            }
        }

        return gamesData.data[0]
    }

    async getGamesByIds(gameIds) {
        const gamesData = await apicalypse(this.requestOptions)
            .fields(["id", "name", "cover", "total_rating_count"])
            .where([`id = (${gameIds.join(',')})`])
            .limit(500)
            .request('/games')

        if (gamesData.data.length > 0) {
            const coversData = await apicalypse(this.requestOptions)
                .fields(["id","image_id"])
                .where(`id = (${gamesData.data.filter(z => z.cover).map(z => z.cover).join(',')})`)
                .limit(500)
                .request('/covers')

            for (let i = 0; i < coversData.data.length; i++) {
                const coverData = coversData.data[i];

                const index = gamesData.data.findIndex((z) => z.cover == coverData.id)

                //gamesData.data[index].price = 124.59

                if (index > -1) gamesData.data[index].coverUrl = `https://images.igdb.com/igdb/image/upload/t_720p/${coverData.image_id}.jpg`
            }
        }

        return gamesData.data
    }
}

module.exports = new IGDB()