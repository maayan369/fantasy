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