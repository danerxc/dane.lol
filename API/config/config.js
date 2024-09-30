require('dotenv').config();

module.exports = {
  PG_DATABASE_URL: process.env.DANE_LOL_PG_DATABASE_URL,
  YOUTUBE_API_KEY: process.env.VIEWGUESSER_YOUTUBE_API_KEY,
  queryAmount: parseInt(process.env.VIEWGUESSER_SEARCH_QUERY_AMOUNT, 10) || 25,  // Default to 25 queries if not set
  nodeCacheTTLSeconds: parseInt(process.env.VIEWGUESSER_NODE_CACHE_TTL_SECONDS, 10) || 12 * 60 * 60,  // Default to 12 hours in seconds
  userQueueTTLMilliseconds: parseInt(process.env.VIEWGUESSER_USER_QUEUE_TTL_MILLISECONDS, 10) || 30 * 60 * 1000,  // Default to 30 minutes in milliseconds
  nodeCacheCheckPeriodSeconds: parseInt(process.env.VIEWGUESSER_NODE_CACHE_CHECK_PERIOD_SECONDS, 10) || 600  // Default to 10 minutes in seconds
};

