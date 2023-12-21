function getCurrentTabId() {
  return sessionStorage.getItem('currentTabId');
}

const usersCanvas = document.getElementById('usersContainer');
const usersCtx = usersCanvas.getContext('2d');

const currentTabId = getCurrentTabId();
const socket = io({ query: { tabId: currentTabId } });

const backgroundImage = document.getElementById('backgroundImage');
const groundImage = document.getElementById('groundImage');

const tempCanvas = document.createElement('canvas');
const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

let charactersData = {};

// Original canvas dimensions
const originalCanvasWidth = 1920;
const originalCanvasHeight = 1080;

// Resized canvas dimensions
let currentCanvasWidth = backgroundImage.width;
let currentCanvasHeight = backgroundImage.height;

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
  usersCtx.clearRect(0, 0, usersCanvas.width, usersCanvas.height);

  for (let i = 0; i < charactersData.length; i++) {
    const user = charactersData[i];
    const xRatio = user.x / originalCanvasWidth;
    const yRatio = user.y / originalCanvasHeight;

    const xPos = xRatio * currentCanvasWidth;
    const yPos = yRatio * currentCanvasHeight;

    const fontSize = currentCanvasWidth / 60;

    usersCtx.font = `${fontSize}px Arial`; 
    usersCtx.fillText(user.username, xPos, yPos);
  }
}




function resizeCanvases() {
  currentCanvasWidth = backgroundImage.width;
  currentCanvasHeight = backgroundImage.height;

  usersCanvas.width = backgroundImage.width;
  usersCanvas.height = backgroundImage.height;

  drawCharacters();

  tempCanvas.width = backgroundImage.width;
  tempCanvas.height = backgroundImage.height;

  tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
  tempCtx.drawImage(groundImage, 0, 0, tempCanvas.width, tempCanvas.height);

}



window.addEventListener('load', resizeCanvases);
window.addEventListener('resize', () => {
  resizeCanvases();
});

// Function to handle click event on the canvas
usersCanvas.addEventListener('click', (event) => {
  const rect = usersCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // Calculate click position based on the original canvas size
  const clickX = (x / currentCanvasWidth) * originalCanvasWidth;
  const clickY = (y / currentCanvasHeight) * originalCanvasHeight;

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

