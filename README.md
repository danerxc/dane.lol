<p align="center">
  <img src="https://i.imgur.com/e68dtaZ.png" alt="dane.lol logo"/>
</p>

<p align='center'>
  <b>A web project where I make random things when I'm bored.</b>
</p>

<p align='center'>
<a href="https://dane.lol"><img src="https://img.shields.io/website-up-down-green-red/http/dane.lol.svg"/></a>
  <a href="https://GitHub.com/danexrc/dane.lol/graphs/commit-activity"><img src="https://img.shields.io/badge/Maintained%3F-yes-green.svg"/></a>
</p>

<hr>

## 🕹️ Projects

<details>
<summary><h4>Viewguesser</h4></summary>
<b>Viewguesser is a higher-lower guessing game based on YouTube video views.</b>
<br><br>
<b>🚀 Features</b>
<ul>
  <li>Automatic pulling from YouTube's API (videos are cached for 12 hours)</li>
  <li>Scoreboard functionality.</li>
  <li>Easy score sharing on social media.</li>
</ul>
<b>🪄 Details</b>
<br>
The player is presented with two videos, one video on the left and a different video on the right. These will be different random videos pulled from YouTube. This uses the YouTube API to fetch videos using the backend API calls.
<br><br>
Each video will display the title, the name of the creator that made the video, the video's view count & the video's thumbnail in the background.
<br><br>
The view count of the first video will be displayed on the left. The video on the right will have two buttons, one for higher and one for lower. The player must guess if this video has higher or lower views than the video on the left.
<br><br>
<img src="https://dane.lol/assets/viewguesser/instructions/example.gif" alt="Viewguesser example"/>
<br><br>
Once the player has made their selection, the view count of the video will then be displayed. If correct, the video will then move to the left and a new video will be populated on the right. If incorrect, the game will end and a losing screen is displayed. The losing screen will change depending on the final score.
</details>

## 📦 Build
### Docker (Recommended)
#### Running with Docker Compose
##### 1. Pull the Docker Image
You can pull the latest version of the pre-built Docker image from GitHub's Container Registry:
```
docker pull ghcr.io/danexrc/danexrc/dane.lol:latest
```

##### 2. Start the Services with Docker Compose
To start both the server and PostgreSQL database, use the provided docker-compose.yml file. This will automatically set up the environment, including creating the necessary database schema.
```
version: '3'
services:
  dane.lol:
    image: ghcr.io/danexrc/danexrc/dane.lol:latest
    container_name: dane.lol
    restart: unless-stopped
    environment:
      - PG_DATABASE_URL=postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@postgres:5432/yourdatabase
      - VIEWGUESSER_YOUTUBE_API_KEY=$VIEWGUESSER_YOUTUBE_API_KEY
      - VIEWGUESSER_SEARCH_QUERY_AMOUNT=$VIEWGUESSER_SEARCH_QUERY_AMOUNT
      - VIEWGUESSER_NODE_CACHE_TTL_SECONDS=$VIEWGUESSER_NODE_CACHE_TTL_SECONDS
      - VIEWGUESSER_USER_QUEUE_TTL_MILLISECONDS=$VIEWGUESSER_USER_QUEUE_TTL_MILLISECONDS
      - VIEWGUESSER_NODE_CACHE_CHECK_PERIOD_SECONDS=$VIEWGUESSER_NODE_CACHE_CHECK_PERIOD_SECONDS
      - VIEWGUESSER_JWT_SECRET=$VIEWGUESSER_JWT_SECRET
      - VIEWGUESSER_BLOCK_DURATION_MILLISECONDS=$VIEWGUESSER_BLOCK_DURATION_MILLISECONDS
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    networks:
      - web

  postgres:
    image: postgres:16-bullseye
    hostname: postgresql
    container_name: postgresql
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: $POSTGRES_USER
      POSTGRES_PASSWORD: $POSTGRES_PASSWORD
      POSTGRES_DB: $DATABASE_NAME
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./sql/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    restart: unless-stopped
    networks:
      - web

volumes:
  pgdata:
  
networks:
  web:
```
```
docker-compose up -d
```

This will start both dane.lol and the postgres services, with the server accessible on port 3000 and the database on port 5432.

#### Running Standalone with Docker (Optional)

If you want to run only the server container without PostgreSQL, you can do so by setting the required environment variables inline:

```
docker run -d \
  -p 3000:3000 \
  --name dane.lol-api \
  -e PG_DATABASE_URL=postgresql://username:password@postgres:5432/database-name \
  -e VIEWGUESSER_YOUTUBE_API_KEY=your-api-key \
  -e VIEWGUESSER_SEARCH_QUERY_AMOUNT=40 \
  -e VIEWGUESSER_NODE_CACHE_TTL_SECONDS=3600 \
  -e VIEWGUESSER_USER_QUEUE_TTL_MILLISECONDS=10000 \
  -e VIEWGUESSER_NODE_CACHE_CHECK_PERIOD_SECONDS=60 \
  -e VIEWGUESSER_JWT_SECRET=your-jwt-secret \
  -e VIEWGUESSER_BLOCK_DURATION_MILLISECONDS=5000 \
  ghcr.io/danexrc/danexrc/dane.lol:latest
```
The server will now be accessible at ``http://localhost:3000``

### Node.js
##### 1. Clone the Repository
Clone the repository from GitHub:
```
git clone https://github.com/your-username/your-repository.git
```

##### 2. Navigate to the Project Directory
```
cd dane.lol
```

##### 3. Set Up PostgreSQL
If you're running outside of Docker, you need to have PostgreSQL installed and configured.
  - Create a Database and User:
    Open a psql session and run the following commands, replacing placeholders with your desired database name, username, and password:

    ```
    CREATE DATABASE yourdatabase;
    CREATE USER youruser WITH PASSWORD 'yourpassword';
    GRANT ALL PRIVILEGES ON DATABASE yourdatabase TO youruser;
    ```

- Run the Database Schema:
    Execute the schema.sql file to set up the necessary tables. Run this command in your terminal:
  
    ```
    psql -U youruser -d yourdatabase -f path/to/sql/schema.sql
    ```
    Replace ``youruser``, ``yourdatabase``, and the ``path`` as necessary.

##### 4. Create a .env File
In the root directory of the project, create a .env file and add the necessary environment variables:

```
# YouTube API key
VIEWGUESSER_YOUTUBE_API_KEY=your-api-key 

# PostgreSQL Connection String (for scoreboard)
PG_DATABASE_URL=postgresql://youruser:yourpassword@localhost:5432/yourdatabase 

# Number of search queries to run when collecting videos from the YouTube API
VIEWGUESSER_SEARCH_QUERY_AMOUNT=40

# Cache and Queue Settings
VIEWGUESSER_NODE_CACHE_TTL_SECONDS=3600
VIEWGUESSER_USER_QUEUE_TTL_MILLISECONDS=10000
VIEWGUESSER_NODE_CACHE_CHECK_PERIOD_SECONDS=60

# JWT Secret
VIEWGUESSER_JWT_SECRET=your-jwt-secret

# Block duration for incorrect attempts
VIEWGUESSER_BLOCK_DURATION_MILLISECONDS=5000
```

##### 5. Install Required Packages
Run the following command to install all dependencies:
```
npm install
```

##### 6. Run the Project
To start the server, use:
```
npm start
```

The server should now be running on http://localhost:3000.


