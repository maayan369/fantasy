function getCurrentTabId() {
  return sessionStorage.getItem('currentTabId');
}

document.addEventListener('click', async (event) => {
  if (event.target && event.target.id === 'logoutBtn') {
      const currentTabId = getCurrentTabId();
      try {
          const response = await fetch('/logout', {
              method: 'POST',
              credentials: 'same-origin',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ currentTabId })
          });
          if (response.ok) {
              console.log('Logged out successfully!');
              sessionStorage.setItem('currentTabId', null);
              sessionStorage.setItem('currentUsername', null);
              window.location.href = '/login.html';
          } else {
              console.error('Logout failed');
          }
      } catch (error) {
          console.error('Error during logout:', error);
      }
  }
});
