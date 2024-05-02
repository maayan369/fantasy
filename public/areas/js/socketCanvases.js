const usersContainer = document.getElementById('usersContainer');
const clickingContainer = document.getElementById('clickingContainer');

function getRoomFromPath(url) {
  const parts = url.split('/');
  const fileName = parts[parts.length - 1];
  const room = fileName.split('.')[0];
  return room;
}

const currentRoom = getRoomFromPath(window.location.pathname);
// console.log(currentRoom);

const socket = io({ query: { tabId: currentTabId } });

const backgroundImage = document.getElementById('backgroundImage');
const groundImage = document.getElementById('groundImage');

const tempCanvas = document.createElement('canvas');
const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

// Get the existing chat form and input field
const sendButton = document.getElementById('send-button');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('msgInput');
let charactersData = [];

// Original canvas dimensions
const originalBackgroundWidth = 1920;
const originalBackgroundHeight = 1080;

// Resized canvas dimensions
let currentBackgroundWidth = backgroundImage.width;
let currentBackgroundHeight = backgroundImage.height;

// Resized canvas dimensions
let currentTempCanvasWidth = backgroundImage.width;
let currentTempCanvasHeight = backgroundImage.height;


// Preload character images
const characterImages = {};
const imageSources = ['faceDown.png', 'faceUp.png', 'faceLeft.png', 'faceRight.png', 'faceUpRight.png', 'faceRightDown.png', 'faceDownLeft.png', 'faceLeftUp.png'];

imageSources.forEach((src) => {
  const img = new Image();
  img.src = `../media/${src}`;
  characterImages[src] = img;
});



chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const message = messageInput.value.trim();

  if (message !== '') {
    socket.emit('chatMessage', message);

    messageInput.value = '';
  }
});

function isPixelTransparent(x, y) {
  const pixelData = tempCtx.getImageData(x, y, 1, 1).data;
  const alpha = pixelData[3]; 
  return alpha === 0; 
}



socket.on('newPositions', (data) => {
  charactersData = data.filter(player => player.room === currentRoom);
  socket.emit('joinRoom', currentRoom);

  drawCharacters();
});



// Function to draw characters based on original canvas size
// Function to draw characters based on original canvas size
function drawCharacters() {
  usersContainer.innerHTML = '';
  const rect = groundImage.getBoundingClientRect();

  for (let i = 0; i < charactersData.length; i++) {

    const user = charactersData[i];

    const xPos = (user.x / originalBackgroundWidth) * currentBackgroundWidth + rect.left;
    const yPos = (user.y / originalBackgroundHeight) * currentBackgroundHeight + rect.top;

    const userDiv = document.createElement('div');
    userDiv.classList.add('userCharacter');    
    userDiv.id = user.username;    
    usersContainer.appendChild(userDiv);

    // Move this line below where mouseDirection is set
    // console.log(`../media/${user.direction}.png`);
    
    const characterImage = characterImages[user.direction + '.png'];
    characterImage.classList.add('characterImage');
    userDiv.appendChild(characterImage);

    const usernameText = document.createElement('span');
    usernameText.classList.add('usernameText');
    usernameText.textContent = user.username;
    userDiv.appendChild(usernameText);

    userDiv.style.width = (currentBackgroundWidth / 12) +'px';
    userDiv.style.height = (currentBackgroundWidth / 12) +'px';
    userDiv.style.zIndex = user.zIndex;

    usernameText.style.fontSize = (currentBackgroundWidth / 60) +'px';

    const userWidth = userDiv.offsetWidth;
    const userHeight = userDiv.offsetHeight;

    const userLeft = xPos - userWidth / 2;
    const userTop = yPos - userHeight / 1.7;

    // Set user position dynamically
    userDiv.style.left = userLeft + 'px';
    userDiv.style.top = userTop + 'px';
    // console.log(usersContainer.innerHTML);

    if (user.message !== '') {
      const messageDiv = document.createElement('div');
      messageDiv.classList.add('messageText');
      userDiv.appendChild(messageDiv);
      messageDiv.textContent = user.message || '';
    }
  }
}



function resizeCanvases() {
  currentBackgroundWidth = backgroundImage.width;
  currentBackgroundHeight = backgroundImage.height;

  drawCharacters();

  tempCanvas.width = backgroundImage.width;
  tempCanvas.height = backgroundImage.height;

  tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
  tempCtx.drawImage(groundImage, 0, 0, tempCanvas.width, tempCanvas.height);

}


window.addEventListener('load', function() {
  resizeCanvases();
});


window.addEventListener('resize', resizeCanvases);

window.addEventListener('popstate', console.log('i should seperate the socket varible from here and refrsh the things to work here in popstate'));


function findClickedUser(x, y) {
  const rect = groundImage.getBoundingClientRect();

  for (let i = 0; i < charactersData.length; i++) {
    const user = charactersData[i];
    const userDiv = document.getElementById(user.username);
    const userRect = userDiv.getBoundingClientRect();
    const userLeft = userRect.left - rect.left;
    const userTop = userRect.top - rect.top;
    const userRight = userLeft + userRect.width;
    const userBottom = userTop + userRect.height;

    if (x >= userLeft && x <= userRight && y >= userTop && y <= userBottom) {
      return user;
    }
  }

  return null;
}



clickingContainer.addEventListener('click', (event) => {
  const rect = groundImage.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const clickX = (x / currentBackgroundWidth) * originalBackgroundWidth;
  const clickY = (y / currentBackgroundHeight) * originalBackgroundHeight;

  const clickedUser = findClickedUser(x, y);

  if (clickedUser && clickedUser.username !== currentUsername) {
    console.log(clickedUser.username);
    // Perform actions for the clicked user (like opening their profile)
    // openUserProfilePopup(clickedUser);
  } else {
    const isTransparent = isPixelTransparent(x, y);
    // console.log(charactersData);

    if (!isTransparent) {
      socket.emit('clickPosition', { x: clickX, y: clickY });
    }
    
    drawCharacters();
    // console.log(usersContainer.innerHTML);
  }
});


/////
document.addEventListener('mousemove', (e) => {
  const { clientX, clientY } = e;

  for (let i = 0; i < charactersData.length; i++) {
    const user = charactersData[i];
    const userDiv = document.getElementById(user.username);
    let direction;

    const { top, left, width, height } = userDiv.getBoundingClientRect();

    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);

    if (x > 50 && y > 50) {
      direction = 'faceRightDown';
    } else if (x > 50 && y < -50) {
      direction = 'faceUpRight';
    } else if (x < -50 && y < -50) {
      direction = 'faceLeftUp';
    } else if (x < -50 && y > 50) {
      direction = 'faceDownLeft';
    } else if (x < -50) {
      direction = 'faceLeft';
    } else if (x > 50) {
      direction = 'faceRight';
    } else if (y < -50) {
      direction = 'faceUp';
    } else if (y > 50) {
      direction = 'faceDown';
    } else {
      direction = 'faceDown';
    }

    
    // Emit the direction information to the server
    socket.emit('playerDirection', direction );
  }
});




//////


socket.emit('initialize', currentTabId);




