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

    async searchGamesByPlatform(query, platform) {
        const gamesData = await apicalypse(this.requestOptions)
            .fields(["id", "name", "cover"])
            .search(query)
            .where([`platforms = (${platform})`, `version_parent = null`, `game_type = (0,10,11,8)`])
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

                if (index > -1) gamesData.data[index].coverUrl = `https://images.igdb.com/igdb/image/upload/t_720p/${coverData.image_id}.jpg`
            }
        }

        return gamesData.data
    }
}

module.exports = new IGDB()