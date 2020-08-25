const router = require('express').Router();
const database = require("../database.js")
const ObjectId = require('mongodb').ObjectId; 
const moment = require("moment")
const https = require('https')

function addSong(req, res) {

	const db = database.getDb()
	const songs = db.collection("songs")
	songs.find({
		"user": req.user._id,
		"datetime": {
			"$gte": moment().subtract(1, 'days').toISOString()
		}
	}).toArray((err, result) => {
		if (result.length > 0) {
			return res.status(400).json({ message: "You have already recommended a song in the last 24 hours" })
		} else {
			const string = req.body.artist + " " + req.body.title;
			console.log(string)
			const options  = {
				hostname: 'api.genius.com',
				port: 443,
				path: '/search?q=' + encodeURIComponent(string),
				method: 'GET',
				headers: {
					'Authorization': 'Bearer ' + process.env.GENIUS_API_KEY
				}
			};
			https.get(options, (resp) => {
				let data = '';
				resp.on('data', (chunk) => {
					data += chunk;
				});
				resp.on('end', () => {
					var search = JSON.parse(data);
					const options  = {
						hostname: 'api.genius.com',
						port: 443,
						path: '/songs/' + search.response.hits[0].result.id,
						method: 'GET',
						headers: {
							'Authorization': 'Bearer ' + process.env.GENIUS_API_KEY
						}
					};
					https.get(options, (resp) => {
						let data = '';
						resp.on('data', (chunk) => {
							data += chunk;
						});
						resp.on('end', () => {
							var search = JSON.parse(data);
							songs.insertOne({
								artist: search.response.song.primary_artist.name,
								title: search.response.song.title_with_featured,
								user: req.user._id,
								datetime: new Date(Date.now()).toISOString(),
								image: search.response.song.algum ? search.response.song.album.cover_art_url : search.response.song.song_art_image_url
							}, (err, result) => {
								if (err) throw err;
								res.json({
									message: "Song added successfully"
								})
							})
						});
				
					}).on("error", (err) => {
						console.log("Error: " + err.message);
					});
				});
		
			}).on("error", (err) => {
				console.log("Error: " + err.message);
			});
		}
	})

}

function getAllSongs(req, res) {
	const db = database.getDb()
	const songs = db.collection("songs")
	songs.find({}).toArray((err, result) => {
		if (err) throw err;
		res.json(result)
	})
}

function getUserQueue(req, res) {
	const db = database.getDb()
	const songs = db.collection("songs")
	songs.find({
		"user": {
			"$ne": req.user._id
		}
	}).toArray((err, result) => {
		if (err) throw err;
		res.json(result)
	})
}

function rateSong(req, res) {
	const db = database.getDb()
	const songs = db.collection("songs")
	songs.updateOne({
		_id: new ObjectId(req.body.song_id)
	}, {
		$push: {
			scores: {
				user: new ObjectId(req.user._id),
				score: req.body.score
			}
		}
	}, (err, result) => {
		if (err) throw err;
		return res.json({ message: "Rate sent successfully" })
	})
}

router.post('/add', require('../authentication/check-login'), addSong);
router.get('/all', getAllSongs);
router.get("/queue", require('../authentication/check-login'), getUserQueue);
router.post("/rate", require('../authentication/check-login'), rateSong);

module.exports = router;