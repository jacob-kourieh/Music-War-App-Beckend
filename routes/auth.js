const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const dbo = require('../db/connect');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const verifyToken = require('./verifyToken');

// Register new user
router.post('/register', async (req, res) => {
    let db = dbo.getDb();
    let user = await db.collection('users').findOne({ username: req.body.username });

    // Check if username already exists
    if (user) {
        return res.status(409).send('Username already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create new user
    user = {
        username: req.body.username,
        password: hashedPassword,
        gameData: [],
        favoriteArtists: [],
        favoriteSongs: []
    };

    // Save new user to database
    db.collection('users').insertOne(user, function (err, result) {
        if (err) {
            res.status(400).send('Error registering new user');
        } else {
            res.status(200).send('User registered successfully');
        }
    });
});

// Login user
router.post('/login', async (req, res) => {
    let db = dbo.getDb();
    let user = await db.collection('users').findOne({ username: req.body.username });

    // Check if username exists
    if (!user) {
        return res.status(401).send('Invalid username or password');
    }

    // Check if password is correct
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) {
        return res.status(401).send('Invalid username or password');
    }

    // Create and assign a token
    const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);
    res.header('auth-token', token).send({ token, username: user.username });
});

// Profile route
router.get('/profile/:username', verifyToken, async (req, res) => {
    let db = dbo.getDb();
    let user = await db.collection('users').findOne({ username: req.params.username });
    if (!user) {
        return res.status(404).send('User not found');
    }
    // remove password from the returned user data
    const { password, ...userData } = user;
    res.status(200).send(userData);
});


// Update favorite artists
router.post('/profile/updateFavoriteArtists', verifyToken, async (req, res) => {
    let db = dbo.getDb();
    let user = await db.collection('users').findOne({ username: req.body.username });
    if (!user) {
        return res.status(404).send('User not found');
    }

    // if favoriteArtists is undefined, set it to an empty array
    if (!user.favoriteArtists) {
        user.favoriteArtists = [];
    }

    // Add new favorite artist
    if (req.body.action === 'add') {
        if (user.favoriteArtists.find(artist => artist._id === req.body.artistId)) {
            return res.status(400).send('Artist is already in favorite list');
        }
        let updatedFavoriteArtists = [...user.favoriteArtists, { _id: req.body.artistId }];

        db.collection('users').updateOne(
            { username: req.body.username },
            { $set: { favoriteArtists: updatedFavoriteArtists } },
            function (err, result) {
                if (err) {
                    res.status(400).send('Error updating favorite artists');
                } else {
                    res.status(200).send('Favorite artists updated successfully');
                }
            }
        );
    }

    // Remove favorite artist
    if (req.body.action === 'remove') {
        let updatedFavoriteArtists = user.favoriteArtists.filter((artist) => artist._id !== req.body.artistId);

        db.collection('users').updateOne(
            { username: req.body.username },
            { $set: { favoriteArtists: updatedFavoriteArtists } },
            function (err, result) {
                if (err) {
                    res.status(400).send('Error updating favorite artists');
                } else {
                    res.status(200).send('Favorite artists updated successfully');
                }
            }
        );
    }
});

// Delete a game data
router.post('/profile/updateGameData', verifyToken, async (req, res) => {
    let db = dbo.getDb();
    let user = await db.collection('users').findOne({ username: req.body.username });
    if (!user) {
        return res.status(404).send('User not found');
    }

    let updatedGameData = user.gameData.filter((game) => game.gameId !== req.body.gameId);

    db.collection('users').updateOne(
        { username: req.body.username },
        { $set: { gameData: updatedGameData } },
        function (err, result) {
            if (err) {
                res.status(400).send('Error updating game data');
            } else {
                res.status(200).send('Game data updated successfully');
            }
        }
    );
});

// Add favorite song
router.post('/profile/addFavoriteSong', verifyToken, async (req, res) => {
    let db = dbo.getDb();
    let user = await db.collection('users').findOne({ username: req.body.username });
    if (!user) {
        return res.status(404).send('User not found');
    }

    if (!user.favoriteSongs) {
        user.favoriteSongs = [];
    }

    let updatedFavoriteSongs = [...user.favoriteSongs, { title: req.body.title, artist: req.body.artist, albumArtUrl: req.body.albumArtUrl, previewUrl: req.body.previewUrl }];
    db.collection('users').updateOne(
        { username: req.body.username },
        { $set: { favoriteSongs: updatedFavoriteSongs } },
        function (err, result) {
            if (err) {
                res.status(400).send('Error updating favorite songs');
            } else {
                res.status(200).send('Favorite songs updated successfully');
            }
        }
    );
});


// Remove favorite song
router.post('/profile/removeFavoriteSong', verifyToken, async (req, res) => {
    let db = dbo.getDb();
    let user = await db.collection('users').findOne({ username: req.body.username });
    if (!user) {
        return res.status(404).send('User not found');
    }

    let updatedFavoriteSongs = user.favoriteSongs.filter((song) => song.title !== req.body.title);

    db.collection('users').updateOne(
        { username: req.body.username },
        { $set: { favoriteSongs: updatedFavoriteSongs } },
        function (err, result) {
            if (err) {
                res.status(400).send('Error updating favorite songs');
            } else {
                res.status(200).send('Favorite songs updated successfully');
            }
        }
    );
});


module.exports = router;