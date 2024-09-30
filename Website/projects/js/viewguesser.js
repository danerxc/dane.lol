let leftVideo = null;
let rightVideo = null;

let losingBackgrounds = [];
let decentBackgrounds = [];
let winningBackgrounds = [];

let score = 0;
let sessionId = null;

$(document).ready(function() {
  initializeGame();
});

async function initializeGame() {
  // Generate or retrieve session ID for this user
  sessionId = sessionStorage.getItem('sessionId') || generateSessionId();
  sessionStorage.setItem('sessionId', sessionId);

  const isFirstLoad = !sessionStorage.getItem('gameInitialized');

  if (isFirstLoad) {
    sessionStorage.setItem('gameInitialized', 'true');

    const videosPromise = fetchInitialVideos();
    const backgroundsPromise = getEndscreenBackgrounds();

    await Swal.fire({
      title: '<b style="color: white;">How to play!',
      icon: 'info',
      html:
        '<p style="color: white;">You will be presented with two videos, one video on the left and a different video on the right (top and bottom if you\'re on mobile). These will be different random videos pulled from YouTube.</p>' +
        '<p style="color: white;">Each video will display the title, the name of the creator that made the video, the video\'s view count & the video\'s thumbnail in the background. There is also an option to preview each video.</p>' +
        '<p style="color: white;">The view count of the first video will be displayed on the left. The video on the right will have two buttons, one for higher and one for lower. You have to guess if this video has higher or lower views than the video on the left.</p>' +
        '<img src="assets/viewguesser/instructions/example.gif" style="max-width:450px;">' +
        '<p style="color: white; margin-top: 10px;">Once you make your selection, the view count of the video will then be displayed. If you picked correctly, the video will then move to the left and a new video will be populated on the right. If you picked incorrectly, the game will end and you will see a losing screen. The losing screen will change depending on your final score.</p>' +
        '<p style="color: white;"><b>I hope you enjoy!</b></p>',
      showCloseButton: false,
      showCancelButton: false,
      background: '#363636',
      confirmButtonColor: "#ffffff",
      confirmButtonText: 'Great, let\'s play!',
    });

    // Wait for the videos and backgrounds to load
    await Promise.all([videosPromise, backgroundsPromise]);

    // Populate the videos after the tutorial is shown
    populateLeftVideo();
    populateRightVideo();
  } else {
    // If not the first load, just load the videos and backgrounds without showing the modal
    const videosPromise = fetchInitialVideos();
    const backgroundsPromise = getEndscreenBackgrounds();

    await Promise.all([videosPromise, backgroundsPromise]);

    populateLeftVideo();
    populateRightVideo();
  }
}

// Function to generate a random session ID for each user session
function generateSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function fetchInitialVideos() {
  const sessionId = sessionStorage.getItem('sessionId') || generateSessionId();
  sessionStorage.setItem('sessionId', sessionId);

  console.log(`Session ID: ${sessionId}`); // Logging to check the session ID

  fetch(`/api/viewguesser/video?sessionId=${sessionId}`)
    .then(response => response.json())
    .then(data => {
      leftVideo = data;
      populateLeftVideo();
      fetchRightVideo();
    })
    .catch(error => {
      console.log('Error fetching left video:', error);
    });
}

function fetchRightVideo() {
  const sessionId = sessionStorage.getItem('sessionId');

  console.log(`Fetching right video with Session ID: ${sessionId}`); // Logging

  fetch(`/api/viewguesser/video?sessionId=${sessionId}`)
    .then(response => response.json())
    .then(data => {
      if (data.id === leftVideo.id) {
        fetchRightVideo(); // Avoid showing the same video on both sides
      } else {
        rightVideo = data;
        populateRightVideo();
      }
    })
    .catch(error => {
      console.log('Error fetching right video:', error);
    });
}

function getEndscreenBackgrounds() {
  fetch('assets/viewguesser/json/endscreen-backgrounds.json')
    .then(response => response.json())
    .then(data => {
      losingBackgrounds = data.losingbackgrounds;
      decentBackgrounds = data.decentbackgrounds;
      winningBackgrounds = data.winningbackgrounds;
    })
    .catch(error => {
      console.log('Error fetching end screen backgrounds:', error);
    });
}

function populateLeftVideo() {
  const leftTitle = leftVideo.snippet.title;
  const leftCreator = leftVideo.snippet.channelTitle;
  const leftViews = leftVideo.statistics.viewCount;
  const leftThumbnail = leftVideo.snippet.thumbnails.high.url;

  $("#left-video-title").html(`<b>${leftTitle}</b>`);
  $("#left-video-subheading").html(`by <span style="color: red;">${leftCreator}</span> currently has`);
  $("#left-video-viewcount").html(`<b><span style="color: red;">${parseInt(leftViews).toLocaleString()}</span></b> views`);
  $("#leftside").css('background-image', `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url("${leftThumbnail}")`);
}

function populateRightVideo() {
  const rightTitle = rightVideo.snippet.title;
  const rightCreator = rightVideo.snippet.channelTitle;
  const comparisonVideo = leftVideo.snippet.title;
  const rightThumbnail = rightVideo.snippet.thumbnails.high.url;

  $("#higherlower-buttons").css("display", "block");
  $("#right-video-bottom-text").css("display", "block");
  $("#right-video-end-viewcount").css("display", "none");
  $("#right-video-bottom-correct-text").css("display", "none");

  $("#right-video-title").html(`<b>${rightTitle}</b>`);
  $("#right-video-subheading").html(`by <span style="color: red;">${rightCreator}</span> has`);
  $("#right-video-bottom-text").html(`views than "${comparisonVideo}"`);
  $("#rightside").css('background-image', `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url("${rightThumbnail}")`);
}

function updateEntries() {
  leftVideo = rightVideo;
  populateLeftVideo();
  fetchRightVideo();
}

function highGuess() {
  const leftVideoViews = parseInt(leftVideo.statistics.viewCount);
  const rightVideoViews = parseInt(rightVideo.statistics.viewCount);

  if (rightVideoViews >= leftVideoViews) {
    handleCorrectGuess(rightVideoViews);
  } else {
    handleIncorrectGuess(rightVideoViews);
  }
}

function lowGuess() {
  const leftVideoViews = parseInt(leftVideo.statistics.viewCount);
  const rightVideoViews = parseInt(rightVideo.statistics.viewCount);

  if (rightVideoViews <= leftVideoViews) {
    handleCorrectGuess(rightVideoViews);
  } else {
    handleIncorrectGuess(rightVideoViews);
  }
}

function handleCorrectGuess(rightVideoViews) {
  $("#higherlower-buttons").css("display", "none");
  $("#right-video-bottom-text").css("display", "none");
  $("#right-video-end-viewcount").css("display", "block");
  $("#right-video-bottom-correct-text").css("display", "block");

  animateViewCount('#right-video-end-viewcount', rightVideoViews);

  setTimeout(function() { 
    var audio = new Audio('assets/viewguesser/sounds/correct.mp3');
    audio.play();
  }, 1400);

  setTimeout(function() {
    score += 1;
    $("#score-counter").html(`<b>Score: ${score}</b>`);
    updateEntries();
  }, 1600);
}

function handleIncorrectGuess(rightVideoViews) {
  $("#higherlower-buttons").css("display", "none");
  $("#right-video-bottom-text").css("display", "none");
  $("#right-video-end-viewcount").css("display", "block");
  $("#right-video-bottom-correct-text").css("display", "block");

  animateViewCount('#right-video-end-viewcount', rightVideoViews);

  losingScreen();

  setTimeout(function() { 
    var audio = new Audio('assets/viewguesser/sounds/incorrect.mp3');
    audio.play();
  }, 1400);

  setTimeout(function() {
    $("#losing-score").html(score);
    $("#losingModal").modal("show");
  }, 1600);
}

function animateViewCount(elementId, viewCount) {
  $(elementId).each(function() {
    var $this = $(this);
    $({ countNum: 0 }).animate({ countNum: viewCount }, {
      duration: 1500,
      easing: 'linear',
      step: function() {
        $this.text(Math.floor(this.countNum));
      },
      complete: function() {
        $this.text(this.countNum.toLocaleString());
      }
    });
  });
}

function losingScreen() {
  let backgroundData = [];

  if (score >= 15) {
    backgroundData = winningBackgrounds;
  } else if (score >= 7) {
    backgroundData = decentBackgrounds;
  } else {
    backgroundData = losingBackgrounds;
  }

  const randomBackground = _.sample(backgroundData);

  $(".modal-body").css(
    'background-image',
    `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url("${randomBackground.backgroundURL}")`
  );
  $("#losing-comment").html(randomBackground.endComment);
  $("#twitter-button").html(
    `<a href="https://twitter.com/intent/tweet?text=I%20just%20scored%20${score}%20on%20ViewGuesser.%20Think%20you%20can%20do%20better?%20https://dane.lol/viewguesser" id="tweet-button" class="button"><i class="fa-brands fa-x-twitter"></i> Post</a>`
  );
}

async function submitScore() {
  const usernameInput = document.getElementById('username');
  const username = usernameInput.value;

  if (!username.trim()) {
    Swal.fire({
      title: 'Error!',
      text: 'Please enter a name before submitting.',
      icon: 'error',
      confirmButtonText: 'OK'
    });
    return;
  }

  try {
    const response = await fetch('/api/viewguesser/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, score })
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const result = await response.json();

    Swal.fire({
      title: 'Success!',
      text: result.message,
      icon: 'success',
      confirmButtonText: 'OK'
    });

    loadLeaderboard(); 
    usernameInput.value = '';

  } catch (error) {
    Swal.fire({
      title: 'Error!',
      text: error.message || 'Something went wrong. Please try again.',
      icon: 'error',
      confirmButtonText: 'OK'
    });
  }
}

async function loadLeaderboard() {
  try {
    const response = await fetch('/api/viewguesser/leaderboard');
    const leaderboard = await response.json();

    const leaderboardElement = document.getElementById('leaderboard');
    leaderboardElement.innerHTML = ''; // Clear previous entries

    leaderboard.slice(0, 10).forEach((entry, index) => {
      const listItem = document.createElement('li');
      listItem.textContent = `${index + 1}. ${entry.Name} - ${entry.Score}`; // Add numbering
      leaderboardElement.appendChild(listItem);
    });

    // Handle case when there are less than 10 entries
    if (leaderboard.length < 10) {
      for (let i = leaderboard.length; i < 10; i++) {
        const listItem = document.createElement('li');
        listItem.textContent = `${i + 1}. --`;
        leaderboardElement.appendChild(listItem);
      }
    }
  } catch (error) {
    console.error('Error loading leaderboard:', error);
  }
}

document.getElementById('username').addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    submitScore(); // Call the submitScore function when Enter is pressed
  }
});

// Load the leaderboard when the page loads
window.onload = loadLeaderboard;
