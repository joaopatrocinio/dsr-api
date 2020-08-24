const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser")
const session = require('express-session');
const passport = require('passport');
const MongoStore = require('connect-mongo')(session);
const app = express()
const http = require("http").createServer(app)
const database = require("./database.js")

require('dotenv').config()

app.use(cors({ origin: 'http://localhost:8080', credentials: true }));
app.use(express.static('www'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port = process.env.PORT

const passportMongo = require('./authentication/passport-mongo');
const authenticationRoutes = require('./authentication/routes');

var options = {
    url: 'mongodb://localhost/dsr'
};

const store = new MongoStore(options)

const sessionMiddleware = session({
    key: 'session_id',
    secret: process.env.SESSION_SECRET,
    store: store,
    saveUninitialized: true,
    resave: false
})

app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());
passportMongo(passport);

app.use('/authentication', authenticationRoutes);
app.use('/songs', require("./routes/songs"));

app.get("/", (req, res) => {
    res.send("Server is running.")
})

database.connectToServer((err) => {
    if (err) return console.log(err)
    console.log("DatabaseConnect")
    app.listen(process.env.PORT, () => console.log(`Server running at http://localhost:${process.env.PORT}/`))
})