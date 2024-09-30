const viewGuesserService = require('../services/viewGuesserService');

exports.getRandomVideo = async (req, res) => {
  const sessionId = req.query.sessionId;

  if (!sessionId) {
    console.error('No sessionId provided');
    return res.status(400).json({ error: 'Session ID is required' });
  }

  try {
    const video = await viewGuesserService.getRandomVideo(sessionId);
    res.json(video);
  } catch (error) {
    console.error('Error fetching video:', error.message);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
}

// Endpoint to submit a score to the leaderboard
exports.submitScore = async (req, res) => {
  const { username, score } = req.body;

  if (!username || typeof score !== 'number') {
    return res.status(400).json({ error: 'Username and valid score are required' });
  }

  try {
    await viewGuesserService.updateLeaderboard(username, score);
    res.status(200).json({ message: 'Score submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit score' });
  }
};

// Endpoint to get the top players from the leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const topPlayers = await viewGuesserService.getTopPlayers();
    res.status(200).json(topPlayers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};