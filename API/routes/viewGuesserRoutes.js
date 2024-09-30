const express = require('express');
const router = express.Router();
const youtubeController = require('../controllers/viewGuesserController');

router.get('/video', youtubeController.getRandomVideo);

// Route to submit a score
router.post('/submit', youtubeController.submitScore);

// Route to get the leaderboard
router.get('/leaderboard', youtubeController.getLeaderboard);

module.exports = router;
