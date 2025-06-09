const fileInput = document.getElementById('fileInput');

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    video.src = url;
    video.load();
  }
});