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
      //.then((data) => { console.log(data); })
        .catch((error) => {
          console.error("Error:", error);
        });
    } else { //when no file was selected
      console.error("No file selected.");
      alert("Select a file before uploading.");
    }
  }


  socket.on("displayMiniatureView1", (base64Image) => {
    //console.log(base64Image)
    // update the web page
    const im = document.getElementById("miniatureView1");
    im.src = `data:image/png;base64,${base64Image}`;
  });
  socket.on("displayMiniatureView2", (base64Image) => {
    //console.log(base64Image)
    // update the web page
    const im = document.getElementById("miniatureView2");
    im.src = `data:image/png;base64,${base64Image}`;
  });
  socket.on("displayMiniatureView3", (base64Image) => {
    //console.log(base64Image)
    // update the web page
    const im = document.getElementById("miniatureView3");
    im.src = `data:image/png;base64,${base64Image}`;
  });

  socket.on("imageUploaded", (data) => {
    console.log(data.upload_zone);
      document.getElementById(
        `miniatureView${data.upload_zone}`
      ).src = `data:image/png;base64,${data.image}`;
  });