const express = require('express');

const recordRoutes = express.Router();

// connect to db
const dbo = require('../db/connect');

// Detta hjälper att konvertera vårt id från en 
// sträng till ett objekt-id (_id)
const ObjectId = require('mongodb').ObjectId;

const verifyToken = require('./verifyToken');



//lista över våra matches
recordRoutes.route('/matches').get(function (req, res) {
    dbo.getDb('artistsDB')
        .collection('matches')
        .find({})
        .toArray(function (err, result) {
            if (err) throw err;
            res.json(result);
        });
});


//GET match from ID
recordRoutes.route("/matches/:id").get(function (req, res) {
    console.log(req.params);
    let _id = req.params.id;
    console.log(_id);
    dbo.getDb('artistsDB')
        .collection('matches')
        .findOne({ _id: ObjectId(_id) }, function (err, result) {
            if (err) throw err;
            res.json(result);
        });
});




//POST new match
recordRoutes.route("/matches").post(function (req, res) {
    let newMatch = {
        winner: req.body.winner,
        loser: req.body.loser,
    };
    dbo.getDb('artistsDB')
        .collection('matches')
        .insertOne(newMatch, function (err, result) {
            if (err) {
                response.status(400).json('WRONG !!')
            }
            res.status(200).json(newMatch)
        });
});



//Delete match
recordRoutes.route('/matches/delete/:id').delete(function (req, res) {
    let db_connect = dbo.getDb();
    let myquery = { _id: ObjectId(req.params.id) };
    db_connect
        .collection('matches')
        .deleteOne(myquery, function (err, result) {
            if (err) throw err;
            res.status(200);
            res.json(result);
        })
});


module.exports = recordRoutes;