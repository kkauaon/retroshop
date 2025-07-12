require('dotenv').config()

const { default: axios } = require("axios");
const { default: apicalypse } = require('apicalypse')
const fs = require('fs')

function getIGDBAccessToken() {
    axios({
        url: `https://id.twitch.tv/oauth2/token?client_id=${process.env.IGDB_CLIENT_ID}&client_secret=${process.env.IGDB_SECRET}&grant_type=client_credentials`,
        method: "POST",
        responseType: "json"
    }).then(async response => {
        const base = response.data

        const platforms = await apicalypse({
            queryMethod: "body",
            method: "post",
            headers: {
                'Authorization': 'Bearer ' + base.access_token,
                'Client-ID': process.env.IGDB_CLIENT_ID,
                'Accept': 'application/json'
            },
            responseType: 'json',
        })
            .fields(["id", "name", "slug"])
            .limit(500)
            .request("https://api.igdb.com/v4/platforms")

        base["platforms"] = platforms.data;

        fs.writeFileSync('./igdb.json', JSON.stringify(base), { encoding: 'utf-8' })

        fs.writeFileSync('./public/jsons/platforms.json', JSON.stringify(platforms.data), { encoding: 'utf-8' })

        console.log("Arquivo criado com sucesso contendo as novas credenciais.")
    })
}

getIGDBAccessToken();