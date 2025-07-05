require('dotenv').config()
require('./database/igdb')

const express = require('express')
const path = require('path')
const { MongoClient } = require('mongodb')
const client = new MongoClient(process.env.URI)

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.static(path.join(__dirname, 'public')))
app.set('view engine', 'ejs');

app.use(require('./routes/index'))
app.use(require('./routes/listings/consoles'))

app.use((req,res) => {
    res.render('404')
})

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`)
})