const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config({ path: "./config.env" });
const port = process.env.PORT || 1335;
app.use(cors());
app.use(express.json());

app.use(require('./routes/artists'));
app.use(require('./routes/matches'));
app.use(require('./routes/randomSong'));


const authRoutes = require('./routes/auth');
app.use('/api/user', authRoutes);


const dbo = require('./db/connect');


app.listen(port, () => {
    dbo.connectToServer(function (err) {
        if (err) {
            console.error(err);
        }
    })
    console.log('Server is running on ', port);
});