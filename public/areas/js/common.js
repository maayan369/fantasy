function loadHTML(url, containerId) {
  const container = document.getElementById(containerId);

  if (!container) {
      console.error('Container not found');
      return;
  }

  fetch(url)
      .then(response => response.text())
      .then(html => {
          container.innerHTML = html + container.innerHTML;
      })
      .catch(error => console.error('Error fetching HTML:', error));
}

// Usage:
document.addEventListener('DOMContentLoaded', function() {
  loadHTML('./topBar.html', 'topBarContainer');
  loadHTML('./forceDisconnectionAlert.html', 'forceDisconnectionContainer'); 

});
