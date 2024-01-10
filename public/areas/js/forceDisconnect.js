socket.on('forceDisconnect', () => {
  const overlay = document.getElementById('overlay');
  console.log(overlay.innerHTML);
  const forceDisconnectionAlert = document.getElementById('forceDisconnectionAlert');
  const okButton = document.getElementById('okButton');

  console.log( overlay.style.display );

  overlay.style.display = 'block';
  forceDisconnectionAlert.style.display = 'block';
  console.log( overlay.style.display );
  sessionStorage.setItem('currentTabId', null);
  sessionStorage.setItem('currentUsername', null);

  okButton.onclick = () => {
    overlay.style.display = 'none';
    forceDisconnectionAlert.style.display = 'none';
    window.location.href = '/login.html';
  };
});

socket.on('redirectLogin', () => {
  console.log('Redirecting to login page...');
  window.location.href = '/login.html';
});