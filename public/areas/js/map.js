const video = document.querySelector('.background-video');

document.querySelector('#doorSvg').addEventListener('mouseover', function() {
  video.currentTime = 0;
  video.play();
});

document.querySelector('#doorSvg').addEventListener('mouseout', function() {
  video.pause();
});