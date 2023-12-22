function getCurrentTabId() {
  return sessionStorage.getItem('currentTabId');
}

const usersContainer = document.getElementById('usersContainer');

const currentTabId = getCurrentTabId();
const socket = io({ query: { tabId: currentTabId } });

const backgroundImage = document.getElementById('backgroundImage');
const groundImage = document.getElementById('groundImage');

const userCharacterImage = new Image();
userCharacterImage.src = '../media/userCharacterCat.png';

const tempCanvas = document.createElement('canvas');
const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

let charactersData = {};

// Original canvas dimensions
const originalBackgroundWidth = 1920;
const originalBackgroundHeight = 1080;

// Resized canvas dimensions
let currentBackgroundWidth = backgroundImage.width;
let currentBackgroundHeight = backgroundImage.height;

// Resized canvas dimensions
let currentTempCanvasWidth = backgroundImage.width;
let currentTempCanvasHeight = backgroundImage.height;


function isPixelTransparent(x, y) {
  const pixelData = tempCtx.getImageData(x, y, 1, 1).data;
  const alpha = pixelData[3]; 
  return alpha === 0; 
}


socket.on('newPositions', (data) => {
  charactersData =  data;
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


    // Create a div for each user
    const userDiv = document.createElement('div');
    userDiv.classList.add('userCharacter');
    userDiv.textContent = user.username;

    // Set user position dynamically
    userDiv.style.left = xPos + 'px';
    userDiv.style.top = yPos + 'px';

    // Append the user div to the container
    usersContainer.appendChild(userDiv);
  }
}


function resizeCanvases() {
  currentBackgroundWidth = backgroundImage.width;
  currentBackgroundHeight = backgroundImage.height;

  drawCharacters();
  console.log(currentBackgroundHeight, currentBackgroundWidth);

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
  // console.log (rect.top, rectTop, rect.left, rectLeft)

  // Calculate click position based on the current dimensions of the background image
  const clickX = (x / currentBackgroundWidth) * originalBackgroundWidth;
  const clickY = (y / currentBackgroundHeight) * originalBackgroundHeight;

  const isTransparent = isPixelTransparent(x, y);

  console.log(isTransparent);
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


document.getElementById('logoutBtn').addEventListener('click', async () => {
  const currentTabId = getCurrentTabId();
  try {
    const response = await fetch('/logout', {
      method: 'POST',
      credentials: 'same-origin', // Ensures cookies are sent with the request
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currentTabId })
    });
    if (response.ok) {
      // Handle successful logout
      console.log('Logged out successfully!');
      // Redirect the user to the login page or perform other actions
      window.location.href = '/login.html'; // Redirect to login page
    } else {
      // Handle errors if needed
      console.error('Logout failed');
    }
  } catch (error) {
    console.error('Error during logout:', error);
  }
});

