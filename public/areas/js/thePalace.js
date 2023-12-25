function getCurrentTabId() {
  return sessionStorage.getItem('currentTabId');
}

function getCurrentUsername() {
  return sessionStorage.getItem('currentUsername');
}

const usersContainer = document.getElementById('usersContainer');


function getRoomFromPath(url) {
  const parts = url.split('/');
  const fileName = parts[parts.length - 1];
  const room = fileName.split('.')[0];
  return room;
}

const currentRoom = getRoomFromPath(window.location.pathname);
console.log(currentRoom);

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
  socket.emit('joinRoom', currentRoom);
  charactersData = data.filter(player => player.room === currentRoom);
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


window.addEventListener('load', resizeCanvases);
window.addEventListener('resize', resizeCanvases);

// should fix it here
backgroundImage.addEventListener('click', (event) => {
  const rect = groundImage.getBoundingClientRect();

  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // Calculate click position based on the current dimensions of the background image
  const clickX = (x / currentBackgroundWidth) * originalBackgroundWidth;
  const clickY = (y / currentBackgroundHeight) * originalBackgroundHeight;

  const isTransparent = isPixelTransparent(x, y);

  if (!isTransparent) {
    socket.emit('clickPosition', { x: clickX, y: clickY });
  }
});





//////


socket.emit('initialize', currentTabId);

socket.on('forceDisconnect', () => {
  const overlay = document.getElementById('overlay');
  const customAlert = document.getElementById('customAlert');
  const okButton = document.getElementById('okButton');

  overlay.style.display = 'block';
  customAlert.style.display = 'block';
  sessionStorage.setItem('currentTabId', null);
  sessionStorage.setItem('currentUsername', null);

  okButton.onclick = () => {
    overlay.style.display = 'none';
    customAlert.style.display = 'none';
    window.location.href = '/login.html'; // Redirect to login page or perform other actions
  };
});

socket.on('redirectLogin', () => {
  // Handle redirect to login page
  console.log('Redirecting to login page...');
  // Perform redirection to the login page
  window.location.href = '/login.html';
});



