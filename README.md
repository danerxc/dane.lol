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
### Website
The frontend website can be used on any web server by uploading the files, or run locally with something like <a href="https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer">Live Server</a>.

### Backend
#### Node.JS
1. Clone the repository from GitHub:
```
git clone https://github.com/your-username/your-repository.git
```
2. Navigate to the API directory
```
cd dane.lol/API
```

3. Create a ``.env`` file
```
VIEWGUESSER_YOUTUBE_API_KEY=your-api-key # YouTube API key
DANE_LOL_PG_DATABASE_URL=postgresql://username:password@postgres:5432/database-name # PostgreSQL Connection String (scoreboard only)
VIEWGUESSER_SEARCH_QUERY_AMOUNT=40 #Amount of queries to run when collecting videos from API
```

3. Install the required packages by running:
```
npm install
```

4. Run the project
```
npm start
```

#### Docker
1. Pull the image
```
docker pull ghcr.io/danexrc/danexrc/dane.lol:latest
```

2. Start the container
```
docker run -d -p 3000:3000 --name dane.lol-api -e DANE_LOL_PG_DATABASE_URL=postgresql://username:password@postgres:5432/database-name VIEWGUESSER_YOUTUBE_API_KEY=your-api-key VIEWGUESSER_SEARCH_QUERY_AMOUNT=40 dane.lol:latest
```
