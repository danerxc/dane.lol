const axios = require('axios');
const NodeCache = require('node-cache');
const { Pool } = require('pg');
const config = require('../config/config');

// Cache and session data storage
const videoCache = new NodeCache({ stdTTL: config.nodeCacheTTLSeconds, checkperiod: config.nodeCacheCheckPeriodSeconds });
const userSessions = {};
const userLastActivity = {};

// PostgreSQL connection pool for leaderboard functionality
const pool = new Pool({ connectionString: config.PG_DATABASE_URL });

// Initialize a new game session
exports.initializeGame = async () => {
  try {
    const sessionId = generateSessionId();
    
    let videos = videoCache.get('cachedVideos');
    if (!videos || videos.length < 2) {
      videos = await fetchAndCacheVideos();
    }

    const leftVideo = videos.pop();
    const rightVideo = videos.pop();

    videoCache.set('cachedVideos', videos);

    // Initialize game state for the user
    const gameState = {
      sessionId,
      score: 0,
      leftVideo,
      rightVideo,
      videos
    };

    userSessions[sessionId] = gameState;
    userLastActivity[sessionId] = Date.now();

    console.log(`New session created with Session ID: ${sessionId}`);

    return gameState;
  } catch (error) {
    console.error('Error initializing game:', error.message);
    throw new Error('Failed to initialize game');
  }
};

exports.validateGuess = async (sessionId, guess) => {
  try {
    // Retrieve the game state
    const gameState = userSessions[sessionId];
    if (!gameState) {
      return { sessionExpired: true };
    }

    const { leftVideo, rightVideo } = gameState;
    const leftViews = parseInt(leftVideo.statistics.viewCount);
    const rightViews = rightVideo && rightVideo.statistics ? parseInt(rightVideo.statistics.viewCount) : null;

    if (rightViews === null) throw new Error('Invalid right video data');

    let isCorrectGuess = (guess === 'higher' && rightViews >= leftViews) || (guess === 'lower' && rightViews <= leftViews);

    if (isCorrectGuess) {
      gameState.score += 1;
      gameState.leftVideo = gameState.rightVideo;

      let newRightVideo = gameState.videos.pop();

      if (!newRightVideo) {
        const newVideos = await fetchAndCacheVideos();
        newRightVideo = newVideos.pop();
        gameState.videos = newVideos;
      }

      if (!newRightVideo || !newRightVideo.statistics) throw new Error('Failed to fetch a valid right video');

      gameState.rightVideo = newRightVideo;

      return {
        isCorrect: true,
        score: gameState.score,
        leftVideo: gameState.leftVideo,
        rightVideo: gameState.rightVideo
      };
    } else {
      gameState.gameOver = true;
      console.log(`Session ${sessionId} ended with final score: ${gameState.score}`);

      return {
        isCorrect: false,
        score: gameState.score
      };
    }
  } catch (error) {
    console.error('Error validating guess:', error.message);
    throw new Error('Failed to validate guess');
  }
};

// Add new leaderboard submission with score from backend gamestate
exports.updateLeaderboard = async (username, sessionId) => {
  try {
    const gameState = userSessions[sessionId];

    if (!gameState || typeof gameState.score !== 'number') {
      return { sessionExpired: true, message: 'Session has expired or is invalid. Please start a new game.' };
    }

    const score = gameState.score;
    console.log(`Submitting score for sessionId: ${sessionId}, username: ${username}, score: ${score}`);

    const existingEntry = await pool.query('SELECT * FROM leaderboards.viewguesser WHERE "Name" = $1', [username]);

    if (existingEntry.rows.length > 0) {
      await pool.query(
        'UPDATE leaderboards.viewguesser SET "Score" = GREATEST("Score", $2), "Updated" = NOW(), "SessionID" = $3 WHERE "Name" = $1',
        [username, score, sessionId]
      );
    } else {
      await pool.query(
        'INSERT INTO leaderboards.viewguesser ("Name", "Score", "Updated", "SessionID") VALUES ($1, $2, NOW(), $3)',
        [username, score, sessionId]
      );
    }

    console.log(`Cleaning up session ${sessionId}...`);

    delete userSessions[sessionId];  // Ensure this is deleting properly
    delete userLastActivity[sessionId];  // Ensure this is deleting properly

    console.log(`Session ${sessionId} deleted after score submission.`);
    return { message: 'Score submitted successfully' };
  } catch (error) {
    console.error(`Error updating leaderboard for user: ${username}. Error: ${error.message}`);
    throw error;
  }
};

// Fetch and cache videos from YouTube API
async function fetchAndCacheVideos() {
  console.log('Fetching new videos from YouTube...');
  const queries = await generateRandomQueries(config.queryAmount);
  const videoResults = await Promise.all(queries.map(query => fetchVideosForQuery(query)));
  const allVideos = [].concat(...videoResults);

  if (allVideos.length > 0) {
    videoCache.set('cachedVideos', allVideos);
    console.log(`Fetched and cached ${allVideos.length} new videos.`);
    return allVideos;
  }

  throw new Error('Failed to fetch videos');
}

// Fetch videos from YouTube API for a specific query
async function fetchVideosForQuery(query) {
  try {
    const searchResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        maxResults: 10,
        q: query,
        type: 'video',
        videoEmbeddable: 'true',
        key: config.YOUTUBE_API_KEY,
      },
    });

    const videos = searchResponse.data.items;
    const videoDetailsPromises = videos.map(async (video) => {
      const videoId = video.id.videoId;
      const videoResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
          part: 'snippet,contentDetails,statistics',
          id: videoId,
          key: config.YOUTUBE_API_KEY,
        },
      });
      return videoResponse.data.items[0];
    });

    const videoDetails = await Promise.all(videoDetailsPromises);
    return videoDetails.filter(video => video && video.statistics);
  } catch (error) {
    console.error(`Error fetching videos for query "${query}":`, error.message);
    return [];
  }
}

// Helper function to generate random search queries
async function generateRandomQueries(count) {
  try {
    const response = await axios.get('https://raw.githubusercontent.com/danexrc/dane.lol/main/Website/projects/assets/viewguesser/json/keywords.json');
    const randomWords = response.data;
    const queries = [];
    for (let i = 0; i < count; i++) {
      const randomQuery = randomWords[Math.floor(Math.random() * randomWords.length)];
      queries.push(randomQuery);
    }
    return queries;
  } catch (error) {
    console.error('Error fetching random words from GitHub:', error);
    throw error;
  }
}

// Helper function to generate session ID
function generateSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Fetch top players for leaderboard
exports.getTopPlayers = async (limit = 10) => {
  try {
    const result = await pool.query('SELECT "Name", "Score" FROM leaderboards.viewguesser ORDER BY "Score" DESC, "Updated" ASC LIMIT $1', [limit]);
    return result.rows;
  } catch (error) {
    console.error(`Error fetching top players. Error: ${error.message}`);
    throw error;
  }
};

// Periodically clean up inactive user sessions
setInterval(() => {
  const now = Date.now();
  Object.keys(userLastActivity).forEach(userId => {
    if (now - userLastActivity[userId] > config.userQueueTTLMilliseconds) {
      delete userSessions[userId];
      delete userLastActivity[userId];
      console.log(`Purged inactive user session for ${userId}`);
    }
  });
}, 60000);

