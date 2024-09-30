const express = require('express');
const cors = require('cors');
const morgan = require('morgan'); // Import morgan
const app = express();

// Load environment variables from .env file
require('dotenv').config();

// Use CORS middleware
app.use(cors());

// Use morgan middleware to log requests
app.use(morgan('combined'));

app.use(express.json());

// Check if YouTube API key is set
if (!process.env.VIEWGUESSER_YOUTUBE_API_KEY) {
  console.error('Error: VIEWGUESSER_YOUTUBE_API_KEY is not set in the environment variables.');
  process.exit(1);
}

// Check if Postgres Connection String is set
if (!process.env.DANE_LOL_PG_DATABASE_URL) {
  console.error('Error: PG CONNECTION URL is not set in the environment variables.');
  process.exit(1);
}

// Your existing routes and middleware
const viewGuesserRoutes = require('./routes/viewGuesserRoutes');
app.use('/viewguesser', viewGuesserRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
});
