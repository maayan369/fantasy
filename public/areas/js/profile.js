document.addEventListener("DOMContentLoaded", () => {

  socket.on('userData', (userData) => {
    // Update the HTML with the user's name and coins
    document.querySelector('#name').textContent = `שם: ${userData.name}`;
    document.querySelector('#coins').textContent = `מטבעות: ${userData.coins}`;
  });


});

