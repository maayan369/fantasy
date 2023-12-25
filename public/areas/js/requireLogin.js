function getCurrentTabId() {
  return sessionStorage.getItem('currentTabId');
}

function getCurrentUsername() {
  return sessionStorage.getItem('currentUsername');
}

const currentTabId = getCurrentTabId();
const currentUsername = getCurrentUsername();

if (!currentTabId || !currentUsername) {
  window.location.href = '/login.html';
}