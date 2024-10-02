const express = require('express');
const router = express.Router();
const youtubeController = require('../controllers/viewGuesserController');

router.post('/start-game', youtubeController.startGame);

router.get('/video', youtubeController.getRandomVideo);

router.post('/guess', youtubeController.processGuess);

router.post('/submit', youtubeController.submitScore);

router.get('/leaderboard', youtubeController.getLeaderboard);

module.exports = router;
