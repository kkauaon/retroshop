require('dotenv').config()
require('./database/igdb')

const express = require('express')
const path = require('path')
const { MongoClient } = require('mongodb')
const listingsDAO = require('./database/listingsDAO')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const usersDAO = require('./database/usersDAO')
const userSession = require('./middlewares/userSession')
const client = new MongoClient(process.env.URI)

listingsDAO.setClient(client)
usersDAO.setClient(client)

listingsDAO.getRandomGame().then((dailyOffer) => {
    listingsDAO.setOffer(dailyOffer)
    console.log("Oferta do Momento setada com sucesso!")
    console.log(listingsDAO.getOffer())
})


const app = express()
const PORT = process.env.PORT || 3000

// Configuração do session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.URI,
    dbName: 'retroshop',
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 dia
  }
}));

app.use(userSession)

app.use(express.static(path.join(__dirname, 'public')))
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}))



app.use(require('./routes/index'))

app.use((req,res) => {
    res.render('404')
})

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`)
})