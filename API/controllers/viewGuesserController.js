const viewGuesserService = require('../services/viewGuesserService');

exports.startGame = async (req, res) => {
  try {
    const gameState = await viewGuesserService.initializeGame();
    res.status(200).json(gameState);
  } catch (error) {
    res.status(500).json({ error: 'Failed to start game' });
  }
};

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

exports.processGuess = async (req, res) => {
  const { sessionId, guess } = req.body;

  if (!sessionId || !guess) {
    console.log('Missing sessionId or guess');
    return res.status(400).json({ error: 'Session ID and guess are required' });
  }

  try {
    console.log(`Processing guess for session: ${sessionId}, guess: ${guess}`);
    const updatedGameState = await viewGuesserService.validateGuess(sessionId, guess);

    res.status(200).json(updatedGameState);
  } catch (error) {
    console.error('Error processing guess:', error);
    res.status(500).json({ error: 'Failed to process guess', details: error.message });
  }
};

// Endpoint to submit a score to the leaderboard
exports.submitScore = async (req, res) => {
  const { username, sessionId } = req.body;

  if (!username || !sessionId) {
    return res.status(400).json({ error: 'Username and session ID are required' });
  }

  try {
    const result = await viewGuesserService.updateLeaderboard(username, sessionId);

    // Check if the session has expired
    if (result.sessionExpired) {
      return res.status(400).json({
        sessionExpired: true,
        message: result.message
      });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error submitting score:', error.message);
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