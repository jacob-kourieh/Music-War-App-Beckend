const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const ObjectId = require('mongodb').ObjectId;

// connect to db
const dbo = require('../db/connect');

// Get genres list
router.get('/api/genres', (req, res) => {
    let db_connect = dbo.getDb('artistsDB');
    db_connect.collection('genres')
        .find({})
        .toArray((err, result) => {
            if (err) {
                res.status(404).json({
                    err: 'There are not any genres'
                })
            }
            res.status(200).json(result)
        });
});

// Get random song
router.get('/api/randomsong', async (req, res) => {
    try {
        const genreId = req.query.genreId || null;
        const { artist, song, previewUrl, albumArtUrl } = await requestValidSong(genreId);
        res.json({ artist, song, previewUrl, albumArtUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

async function requestValidSong(genreId = null) {
    const searchUrl = `https://api.deezer.com/genre/${genreId}/artists`;
    const corsProxy = "https://jacob-website-jacob-kourieh.vercel.app/api/cors-proxy?url=";

    const response = await fetch(`${corsProxy}${searchUrl}`);
    const data = await response.json();

    if (data.data.length === 0) {
        return { info: 'No songs found', previewUrl: null };
    }

    const randomArtist = data.data[Math.floor(Math.random() * data.data.length)];
    const topTracksUrl = `${corsProxy}${randomArtist.tracklist}`;
    const topTracksResponse = await fetch(topTracksUrl);
    const topTracksData = await topTracksResponse.json();

    if (topTracksData.data.length === 0) {
        return { info: 'No songs found', previewUrl: null };
    }

    const randomSong = topTracksData.data[Math.floor(Math.random() * topTracksData.data.length)];
    const artist = randomSong.artist.name;
    const song = randomSong.title;
    const albumArtUrl = randomSong.album.cover_big;

    return { artist: artist, song: song, previewUrl: randomSong.preview, albumArtUrl };

}

module.exports = router;
