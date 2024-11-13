-- ViewGuesser
-- ====================
-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS leaderboards;

-- Create the viewguesser table
CREATE TABLE IF NOT EXISTS leaderboards.viewguesser (
    "Name" TEXT PRIMARY KEY,
    "Score" INTEGER,
    "Updated" TIMESTAMP WITHOUT TIME ZONE,
    "SessionID" TEXT
);
-- =====================