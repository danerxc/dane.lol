const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const app = express();

// Load environment variables from .env file
require('dotenv').config();

app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Check if YouTube API key is set
if (!process.env.VIEWGUESSER_YOUTUBE_API_KEY) {
  console.error('Error: VIEWGUESSER_YOUTUBE_API_KEY is not set in the environment variables.');
  process.exit(1);
}

// Check if Postgres Connection String is set
if (!process.env.PG_DATABASE_URL) {
  console.error('Error: PG_DATABASE_URL is not set in the environment variables.');
  process.exit(1);
}

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API routes
const viewGuesserRoutes = require('./routes/viewGuesserRoutes');
app.use('/api/viewguesser', viewGuesserRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

