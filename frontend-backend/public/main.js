const socket = io();

function uploadImage(uploadZone) {
    // get the file for the specific upload zone
    const fileInput = document.getElementById(`fileInput${uploadZone}`);
  
    // get the file from the file input
    const file = fileInput.files[0];
  
    // check for file
    if (file) { // when a file was selected
      // create a FormData object to store the file data
      const formData = new FormData();
      // put the file and the 
      formData.append(`image${uploadZone}`, file);
      // send a POST request to the server with in its body the formdata
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