document.addEventListener('DOMContentLoaded', function() {
  function loadHTML(url, containerId) {
    // Create a new div element
    const container = document.createElement('div');

    // Fetch the HTML content
    fetch(url)
      .then(response => response.text())
      .then(html => {
        container.innerHTML = html;
        document.getElementById(containerId).appendChild(container);
      })
      .catch(error => console.error('Error fetching HTML:', error));
  }


  loadHTML('forceDisconnectionAlert.html', 'forceDisconnectionContainer'); 
});
