let leftVideo = null;
let rightVideo = null;
let sessionId = null;
let losingBackgrounds = [];
let decentBackgrounds = [];
let winningBackgrounds = [];

$(document).ready(function() {
  initializeGame();
});

async function initializeGame() {
  try {
    const response = await fetch('http://localhost:3500/viewguesser/start-game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const gameState = await response.json();

    sessionId = gameState.sessionId;
    sessionStorage.setItem('sessionId', sessionId);

    leftVideo = gameState.leftVideo;
    rightVideo = gameState.rightVideo;

    await getEndscreenBackgrounds();

    populateLeftVideo();
    populateRightVideo();
  } catch (error) {
    console.error('Error initializing game:', error);
  }
}

async function submitGuess(guess) {
  try {
    $("#higherlower-buttons").css("display", "none");

    if (rightVideo && rightVideo.statistics && rightVideo.statistics.viewCount) {
      const rightVideoViews = rightVideo.statistics.viewCount;

      // Display the view count and start the animation
      $("#right-video-end-viewcount").css("display", "block");
      $("#right-video-bottom-text").css("display", "none");
      $("#right-video-bottom-correct-text").css("display", "block");

      await new Promise((resolve) => {
        animateViewCount("#right-video-end-viewcount", rightVideoViews, resolve);
      });

      setTimeout(async function () {
        const response = await fetch('http://localhost:3500/viewguesser/guess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, guess })
        });

        const gameState = await response.json();
        console.log('Game State:', gameState);

        if (gameState.sessionExpired) {
          Swal.fire({
            title: 'Session Expired',
            text: 'Your session has expired. Please start a new game.',
            icon: 'warning',
            confirmButtonText: 'Start New Game'
          }).then(() => {
            window.location.reload();
          });
          return;
        }

        if (gameState.isCorrect) {
          $("#score-counter").html(`<b>Score: ${gameState.score}</b>`);

          leftVideo = gameState.leftVideo;
          rightVideo = gameState.rightVideo;

          populateLeftVideo();
          populateRightVideo();

          playCorrectGuessSound();
          $("#higherlower-buttons").css("display", "block");

        } else {
          $("#losing-score").html(gameState.score);
          loadLeaderboard();
          $("#losingModal").modal("show");
          playIncorrectGuessSound();
        }
      }, 500); // Delay before moving to next video

    } else {
      throw new Error('Invalid right video data');
    }

  } catch (error) {
    console.error('Error submitting guess:', error);

    Swal.fire({
      title: 'Error!',
      text: error.message || 'Something went wrong. Please try again.',
      icon: 'error',
      confirmButtonText: 'OK'
    });
  }
}

async function submitScore() {
  const usernameInput = document.getElementById('username');
  const username = usernameInput.value;
  const sessionId = sessionStorage.getItem('sessionId');

  if (!username.trim()) {
    Swal.fire({
      title: 'Error!',
      text: 'Please enter a name before submitting.',
      icon: 'error',
      confirmButtonText: 'OK'
    });
    return;
  }

  if (!sessionId) {
    Swal.fire({
      title: 'Error!',
      text: 'Session has expired or is invalid. Please start a new game.',
      icon: 'error',
      confirmButtonText: 'OK'
    });
    return;
  }

  try {
    const response = await fetch('http://localhost:3500/viewguesser/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        sessionId: sessionId
      })
    });

    const result = await response.json();

    // Handle session expiration
    if (result.sessionExpired) {
      Swal.fire({
        title: 'Session Expired',
        text: 'Your session has expired. Please start a new game.',
        icon: 'warning',
        confirmButtonText: 'Start New Game'
      }).then(() => {
        window.location.reload();
      });
      return;
    }

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

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
    const response = await fetch('http://localhost:3500/viewguesser/leaderboard');
    const leaderboard = await response.json();

    const leaderboardElement = document.getElementById('leaderboard');
    leaderboardElement.innerHTML = ''; // Clear previous entries

    leaderboard.slice(0, 10).forEach((entry, index) => {
      const listItem = document.createElement('li');
      listItem.textContent = `${index + 1}. ${entry.Name} - ${entry.Score}`;
      leaderboardElement.appendChild(listItem);
    });

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

function animateViewCount(selector, count, resolve) {
  $(selector).prop('Counter', 0).animate({
    Counter: count
  }, {
    duration: 1500,
    easing: 'swing',
    step: function (now) {
      $(selector).text(Math.ceil(now).toLocaleString());
    },
    complete: function () {
      if (resolve) resolve();
    }
  });
}

function highGuess() {
  submitGuess('higher');
}

function lowGuess() {
  submitGuess('lower');
}

function getEndscreenBackgrounds() {
  return fetch('assets/viewguesser/json/endscreen-backgrounds.json')
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

function playCorrectGuessSound() {
  setTimeout(function() { 
    var audio = new Audio('assets/viewguesser/sounds/correct.mp3');
    audio.play();
  }, 1400);
}

function playIncorrectGuessSound() {
  setTimeout(function() { 
    var audio = new Audio('assets/viewguesser/sounds/incorrect.mp3');
    audio.play();
  }, 1400);
}

document.getElementById('username').addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    submitScore(); // Call the submitScore function when Enter is pressed
  }
});

if(gameState.score >= 15) {
  var randomwinningBackground = _.sample(winningBackgrounds[0]);
  $(".modal-body").css('background-image', 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url("' + randomwinningBackground.backgroundURL + '")')
  $("#losing-comment").html(randomwinningBackground.endComment)
  $("#twitter-button").html("<a href=\"https://twitter.com/intent/tweet?text=I%20just%20scored%20" + score + "%20on%20ViewGuesser.%20Think%20you%20can%20do%20better?%20https://dane.lol/games/viewguesser\" id=\"tweet-button\" class=\"button\"><i class=\"fab fa-twitter\"></i> Tweet</a>")
} else if(gameState.score >= 7) {
  var randomdecentBackground = _.sample(decentBackgrounds[0]);
  $(".modal-body").css('background-image', 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url("' + randomdecentBackground.backgroundURL + '")')
  $("#losing-comment").html(randomdecentBackground.endComment)
  $("#twitter-button").html("<a href=\"https://twitter.com/intent/tweet?text=I%20just%20scored%20" + score + "%20on%20ViewGuesser.%20Think%20you%20can%20do%20better?%20https://dane.lol/games/viewguesser\" id=\"tweet-button\" class=\"button\"><i class=\"fab fa-twitter\"></i> Tweet</a>")
} else {
  var randomlosingBackground = _.sample(losingBackgrounds[0]);
  $(".modal-body").css('background-image', 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url("' + randomlosingBackground.backgroundURL + '")')
  $("#losing-comment").html(randomlosingBackground.endComment)
  $("#twitter-button").html("<a href=\"https://twitter.com/intent/tweet?text=I%20just%20scored%20" + score + "%20on%20ViewGuesser.%20Think%20you%20can%20do%20better?%20https://dane.lol/games/viewguesser\" id=\"tweet-button\" class=\"button\"><i class=\"fab fa-twitter\"></i> Tweet</a>")
}

window.onload = loadLeaderboard;