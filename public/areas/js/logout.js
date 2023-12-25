function getCurrentTabId() {
    return sessionStorage.getItem('currentTabId');
}


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
        console.log('Logged out successfully!');
        // Function to set the current tab ID
        sessionStorage.setItem('currentTabId', null);
        sessionStorage.setItem('currentUsername', null);

        window.location.href = '/login.html';
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  });