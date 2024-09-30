const axios = require('axios');
const NodeCache = require('node-cache');
const { Pool } = require('pg');
const config = require('../config/config');

// TTL (Time-to-Live) for the shared cache
const videoCache = new NodeCache({ stdTTL: config.nodeCacheTTLSeconds, checkperiod: config.nodeCacheCheckPeriodSeconds });
// Map to store user-specific video queues
const userQueues = {};
// Map to store the last activity timestamp of each user
const userLastActivity = {};

// PostgreSQL connection pool for leaderboard functionality
const pool = new Pool({
  connectionString: config.PG_DATABASE_URL
});

// Fetch videos for a specific query from the YouTube API
async function fetchVideosForQuery(query) {
  try {
    console.log(`Fetching videos for query: "${query}"`); // Log the query

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
    console.log(`Fetched ${videoDetails.length} videos for query: "${query}"`);
    return videoDetails.filter(video => video); // Filter out any invalid videos
  } catch (error) {
    console.error(`Error fetching videos for query "${query}":`, error.message);
    return [];
  }
}

// Fetch and cache new videos from YouTube API
async function fetchAndCacheVideos() {
  console.log('Fetching new videos from the YouTube API...');
  
  console.log(`Current set query amount is ${config.queryAmount}`);
  const queries = generateRandomQueries(config.queryAmount); // Generate random queries
  const videoResults = await Promise.all(queries.map(query => fetchVideosForQuery(query)));
  const allVideos = [].concat(...videoResults);

  if (allVideos.length > 0) {
    videoCache.set('cachedVideos', allVideos);
    console.log(`Fetched and cached ${allVideos.length} new videos.`);
    return allVideos;
  }

  throw new Error('Failed to fetch videos from multiple queries.');
}

// Function to get or replenish user-specific queue
async function getUserQueue(userId) {
  // Update the user's last activity timestamp
  userLastActivity[userId] = Date.now();

  if (!userQueues[userId]) {
    userQueues[userId] = [];
  }

  if (userQueues[userId].length === 0) {
    let cachedVideos = videoCache.get('cachedVideos');
    
    if (!cachedVideos || cachedVideos.length === 0) {
      console.log('Cache is empty, fetching more videos...');
      cachedVideos = await fetchAndCacheVideos();
      videoCache.set('cachedVideos', cachedVideos);
    }

    userQueues[userId] = cachedVideos.slice();
    console.log(`Replenished video queue for user ${userId}.`);
  }

  return userQueues[userId];
}

// Function to get a random video for a specific user
exports.getRandomVideo = async (userId) => {
  const userQueue = await getUserQueue(userId);

  console.log(`User ${userId} has ${userQueue.length} videos in their queue.`);

  if (userQueue.length === 0) {
    throw new Error('No videos available in the queue');
  }

  const randomIndex = Math.floor(Math.random() * userQueue.length);
  const selectedVideo = userQueue[randomIndex];

  console.log(`Returning video for user ${userId}: ${selectedVideo.snippet.title} from user cache.`);

  // Log the remaining videos after one has been returned
  console.log(`User ${userId} has ${userQueue.length} videos in their queue.`);

  return selectedVideo;
};

// Helper function to generate random search queries
function generateRandomQueries(count) {
  const randomWords = [
    'fun', 'music', 'game', 'news', 'travel', 'food', 'art', 'science',
    'technology', 'sports', 'education', 'comedy', 'entertainment', 'vlog',
    'nature', 'history', 'health', 'fitness', 'documentary', 'animals',
    'MrBeast', 'PewDiePie', 'Markiplier', 'Ninja', 'KSI', 'Dream', 'Corpse Husband',
  ];

  const queries = [];
  for (let i = 0; i < count; i++) {
    const randomQuery = randomWords[Math.floor(Math.random() * randomWords.length)];
    queries.push(randomQuery);
  }

  return queries;
}

// Leaderboard Functions

// Function to add or update a user's score in the leaderboard
exports.updateLeaderboard = async (username, score) => {
  try {
    console.log(`Received new score submission: Username = ${username}, Score = ${score}`);

    const existingEntry = await pool.query('SELECT * FROM leaderboards.viewguesser WHERE "Name" = $1', [username]);

    if (existingEntry.rows.length > 0) {
      // Update the score if the user already exists
      const currentScore = existingEntry.rows[0].Score;
      console.log(`User ${username} already exists with current score: ${currentScore}. Updating if necessary...`);

      await pool.query(
        'UPDATE leaderboards.viewguesser SET "Score" = GREATEST("Score", $2), "Updated" = NOW() WHERE "Name" = $1',
        [username, score]
      );
      console.log(`Updated score for user: ${username}. New score: ${Math.max(currentScore, score)}`);
    } else {
      // Insert a new entry if the user does not exist
      console.log(`User ${username} does not exist. Inserting new entry with score: ${score}.`);
      
      await pool.query(
        'INSERT INTO leaderboards.viewguesser ("Name", "Score") VALUES ($1, $2)',
        [username, score]
      );
      console.log(`Added new user: ${username} with score: ${score}`);
    }
  } catch (error) {
    console.error(`Error updating leaderboard for user: ${username} with score: ${score}. Error: ${error.message}`);
    throw error;
  }
};

// Function to fetch the top players from the leaderboard
exports.getTopPlayers = async (limit = 10) => {
  try {
    console.log(`Fetching top ${limit} players from the leaderboard...`);

    const result = await pool.query(
      'SELECT "Name", "Score" FROM leaderboards.viewguesser ORDER BY "Score" DESC, "Updated" ASC LIMIT $1',
      [limit]
    );

    console.log(`Fetched ${result.rows.length} players from the leaderboard.`);
    return result.rows;
  } catch (error) {
    console.error(`Error fetching top ${limit} players from the leaderboard. Error: ${error.message}`);
    throw error;
  }
};


// Periodically clean up inactive user queues
setInterval(() => {
  const now = Date.now();
  Object.keys(userLastActivity).forEach(userId => {
    if (now - userLastActivity[userId] > config.userQueueTTLMilliseconds) {
      delete userQueues[userId];
      delete userLastActivity[userId];
      console.log(`Purged inactive user cache for ${userId}`);
    }
  });
}, 60000); // Check every minute