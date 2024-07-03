const socket = io();

function uploadImage(uploadZone) {
  const fileInput = document.getElementById(`fileInput${uploadZone}`);

  const file = fileInput.files[0];

  if (file) {
    const formData = new FormData();
    formData.append(`image${uploadZone}`, file);
    fetch(`/upload/${uploadZone}`, {
        method: "POST",
        body: formData,
      })
      .then((response) => response.json())
      .catch((error) => {
        console.error("Error:", error);
      });
  } else {
    console.error("No file selected.");
    alert("Select a file before uploading.");
  }
}

function setMiniatureView(elementId, base64Image) {
  document.getElementById(elementId).src = `data:image/png;base64,${base64Image}`;
}

const uploadZoneIds = [1, 2, 3]; // range of IDs

uploadZoneIds.forEach(id => {
  socket.on(`displayMiniatureView${id}`, (base64Image) => {
    setMiniatureView(`miniatureView${id}`, base64Image);
  });
});

socket.on("imageUploaded", (data) => {
  setMiniatureView(`miniatureView${data.upload_zone}`, data.image);
});