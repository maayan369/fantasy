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
// let currentZIndex;

// Original canvas dimensions
const originalBackgroundWidth = 1920;
const originalBackgroundHeight = 1080;

// Resized canvas dimensions
let currentBackgroundWidth = backgroundImage.width;
let currentBackgroundHeight = backgroundImage.height;

// Resized canvas dimensions
let currentTempCanvasWidth = backgroundImage.width;
let currentTempCanvasHeight = backgroundImage.height;



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
  // currentZIndex = charactersData.length;
  socket.emit('joinRoom', currentRoom);

  drawCharacters();
});





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

    const characterImage = new Image();
    characterImage.src = '../media/userCharacterCat.png';
    characterImage.classList.add('characterImage');
    userDiv.appendChild(characterImage);

    const usernameText = document.createElement('span');
    usernameText.classList.add('usernameText');
    usernameText.textContent = user.username;
    userDiv.appendChild(usernameText);

    userDiv.style.width = (currentBackgroundWidth / 12) +'px';
    userDiv.style.height = (currentBackgroundWidth / 12) +'px';
    userDiv.style.zIndex = user.zIndex;
    // console.log(user.zIndex);

    usernameText.style.fontSize = (currentBackgroundWidth / 60) +'px';

    const userWidth = userDiv.offsetWidth;
    const userHeight = userDiv.offsetHeight;

    const userLeft = xPos - userWidth / 2;
    const userTop = yPos - userHeight / 1.2;

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
  // socket.emit('setZIndex', { username: currentUsername, currentZIndex: charactersData.length});
  resizeCanvases();
});

window.addEventListener('resize', resizeCanvases);

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
    // socket.emit('updateZIndex', { username: currentUsername, currentZIndex: currentZIndex});

    
    drawCharacters();
    console.log(usersContainer.innerHTML);
  }
});




//////


socket.emit('initialize', currentTabId);

socket.on('forceDisconnect', () => {
  const overlay = document.getElementById('overlay');
  const forceDisconnectionAlert = document.getElementById('forceDisconnectionAlert');
  const okButton = document.getElementById('okButton');

  overlay.style.display = 'block';
  forceDisconnectionAlert.style.display = 'block';
  sessionStorage.setItem('currentTabId', null);
  sessionStorage.setItem('currentUsername', null);

  okButton.onclick = () => {
    overlay.style.display = 'none';
    forceDisconnectionAlert.style.display = 'none';
    window.location.href = '/login.html';
  };
});

socket.on('redirectLogin', () => {
  console.log('Redirecting to login page...');
  window.location.href = '/login.html';
});



