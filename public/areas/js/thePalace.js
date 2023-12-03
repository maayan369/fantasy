const socket = io();
// const myusername = "lala";
// let userCharacterId;

document.getElementById('logoutBtn').addEventListener('click', async () => {
  try {
    const response = await fetch('/logout', {
      method: 'POST',
      credentials: 'same-origin', // Ensures cookies are sent with the request
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

// Function to fetch the username from the server
async function fetchUsername() {
  try {
    const response = await fetch('/get-username', {
      method: 'GET',
      credentials: 'same-origin' // Ensure cookies are sent with the request
    });

    if (response.ok) {
      const { username } = await response.json();
      document.querySelector('.usernameText').innerText = username;
    } else {
      // Handle errors or redirect to login page if needed
      console.error('Failed to fetch username');
      // window.location.href = '/index.html'; // Redirect to index page

      // Redirect to login page or display an error message
    }
  } catch (error) {
    console.error('Error fetching username:', error);
  }
}

    // Call the fetchUsername function after the page loads
    window.addEventListener('load', fetchUsername);



document.addEventListener('DOMContentLoaded', () => {
    const usersContainer = document.getElementById('usersContainer');
    const userCharacter = document.getElementById('exmpUserCharacter');
  
    // Set initial position off-screen
    // userCharacter.style.left = '-100px';
    // userCharacter.style.top = '-100px';
    // Function to set random initial position
    const setInitialPosition = () => {
        const rect = usersContainer.getBoundingClientRect();
        // const padding = 100; // Adjust padding as needed
        const maxX = rect.width - userCharacter.clientWidth - 300;
        const maxY = rect.height - userCharacter.clientHeight - 100;

        const posX = Math.floor(Math.random() * maxX);
        const posY = Math.floor(Math.random() * maxY);

        userCharacter.style.left = `${posX}px`;
        userCharacter.style.top = `${posY}px`;
    };

    // Set initial position on page load
    setInitialPosition();
    
    
  
    usersContainer.addEventListener('click', (event) => {
      const rect = usersContainer.getBoundingClientRect();
      const posX = event.clientX - rect.left - userCharacter.clientWidth / 2;
      const posY = event.clientY - rect.top - userCharacter.clientHeight / 2;
  
      // Apply new position with a small delay for animation
      setTimeout(() => {
        userCharacter.style.left = `${posX}px`;
        userCharacter.style.top = `${posY}px`;
      }, 10);
    });
  });

  