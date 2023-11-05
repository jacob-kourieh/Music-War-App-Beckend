const express = require('express');

const recordRoutes = express.Router();

const { v4: uuidv4 } = require('uuid');

// connect to db
const dbo = require('../db/connect');

// Detta hjälper att konvertera vårt id från en 
// sträng till ett objekt-id (_id)
const ObjectId = require('mongodb').ObjectId;

const verifyToken = require('./verifyToken');

// här skall vi få en lista över våra records
recordRoutes.route('/artists').get(function (req, res) {
    let db_connect = dbo.getDb('artistsDB');
    db_connect.collection('artists')
        .find({})
        .toArray(function (err, result) {
            if (err) {
                res.status(404).json({
                    err: 'There are not any artists'
                })
            }
            res.status(200).json(result)
        })
});


// Här skall vi få enbart en record via id
recordRoutes.route('/artist/:id').get(function (req, res) {
    let db_connect = dbo.getDb();
    let myquery = { _id: ObjectId(req.params.id) };
    db_connect
        .collection('artists')
        .findOne(myquery, function (err, result) {
            if (err) {
                res.status(404).json({
                    err: 'There not any artists'
                })
            }
            res.status(200).json(result)
        });
});


// Här skall vi skapa en ny record
recordRoutes.route('/artist').post(function (req, response) {
    let db_connect = dbo.getDb();
    let newArtist = {
        name: req.body.name,
        age: req.body.age,
        nationality: req.body.nationality,
        genres: req.body.genres,
        imgName: req.body.imgName,
        wins: 0,
        defeats: 0,
        games: 0
    };
    db_connect
        .collection('artists')
        .insertOne(newArtist, function (err, res) {
            if (err) {
                response.status(400).json('WRONG !!')
            }
            else {
                response.status(200).json(newArtist)
            }
        });
});


// Här skall vi uppdatera record via id
recordRoutes.route('/artists/:id').put(function (req, res) {
    let db_connect = dbo.getDb();
    let myquery = { _id: ObjectId(req.params.id) };
    let updatedArtist = {
        $set: {
            wins: req.body.wins,
            defeats: req.body.defeats,
            games: req.body.games
        }
    };
    db_connect
        .collection('artists')
        .updateOne(myquery, updatedArtist, function (err, result) {
            if (err) {
                res.status(400).json('WRONG !!')
                //res.json(err)
            }
            res.sendStatus(200)
        })
});

// Här skall vi ta bort record via id
recordRoutes.route('/artist/delete/:id').delete(function (req, res) {
    let db_connect = dbo.getDb();
    let myquery = { _id: ObjectId(req.params.id) };
    db_connect
        .collection('artists')
        .deleteOne(myquery, function (err, result) {
            if (err) throw err;
            res.status(200);
            res.json(result);
        })
});

//random  Ett slumpat artistobjekt
recordRoutes.route('/artists/random').get(function (req, res) {
    let db_connect = dbo.getDb('artistsDB');
    let randomArtist = [];
    let allArtists = [];
    db_connect
        .collection('artists')
        .find({})
        .toArray(function (err, result) {

            allArtists = result;
            let firstRandom = result[Math.floor(Math.random() * result.length)];
            randomArtist.push(firstRandom);
            allArtists = allArtists.filter((item) => item._id !== firstRandom._id);
            let secondRandom = allArtists[Math.floor(Math.random() * allArtists.length)];
            randomArtist.push(secondRandom);
            if (err) throw err;
            res.json([firstRandom, secondRandom]);
        })
});



// get BEST WINNERS
recordRoutes.route("/artists/winners").get(async function (req, response) {
    let db_connect = dbo.getDb();
    let bestWinners;
    db_connect
        .collection('artists')
        .find({})
        .toArray(function (err, result) {
            if (err) throw err;
            result.sort((a, b) => b.wins - a.wins);
            bestWinners = result.slice(0, 5);
            response.json(bestWinners);
        });
});


// get BEST LOSERS
recordRoutes.route("/artists/losers").get(async function (req, response) {
    let db_connect = dbo.getDb();
    let bestLosers;
    db_connect
        .collection('artists')
        .find({})
        .toArray(function (err, result) {
            if (err) throw err;
            result.sort((a, b) => b.defeats - a.defeats);
            bestLosers = result.slice(0, 5);
            response.json(bestLosers);
        });
});


recordRoutes.route('/game').post(verifyToken, function (req, response) {
    let db_connect = dbo.getDb();
    let myquery = { _id: ObjectId(req.user._id) };
    let newGameData = {
        gameId: uuidv4(),
        chosenArtistName: req.body.chosenArtistName,
        loserArtistName: req.body.loserArtistName,
    };
    db_connect.collection('users').updateOne(
        myquery,
        { $push: { gameData: newGameData } },
        function (err, res) {
            if (err) {
                response.status(400).json('Unable to save game data')
            }
            else {
                response.status(200).json('Game data saved successfully')
            }
        });
});


module.exports = recordRoutes;