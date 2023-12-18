function getCurrentTabId() {
  return sessionStorage.getItem('currentTabId');
}

const canvas = document.getElementById('usersContainer');
const usersContainer = canvas.getContext('2d');

const currentTabId = getCurrentTabId();
const socket = io({ query: { tabId: currentTabId } });
usersContainer.font = '30px Arial';

socket.on('newPositions', (data) => {
  usersContainer.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < data.length; i++) {
    usersContainer.fillText(data[i].username, data[i].x, data[i].y);
  }
});


canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  socket.emit('clickPosition', { x, y });
});

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
