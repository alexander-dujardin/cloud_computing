const socket = io();

// function for display notifications on the user interface
function displayError(message) {
  const notificationArea = document.getElementById('notificationArea'); // where to show in html
  notificationArea.textContent = message;
  // make it visible
  notificationArea.classList.remove('hidden');
  notificationArea.classList.add('visible');
  
  // after 7 seconds make it hidden
  setTimeout(() => {
    notificationArea.classList.remove('visible');
    notificationArea.classList.add('hidden');
  }, 7000);
}

// function when a new image is uploaded (button clicked)
function uploadImage(uploadZone) {
  const fileInput = document.getElementById(`fileInput${uploadZone}`); // get input data
  const file = fileInput.files[0]; // get file

  // check if a file is uploaded
  if (file) {
    // make a formdata object
    const formData = new FormData();
    formData.append(`image${uploadZone}`, file);
    // make HTTP POST to backend
    fetch(`/upload/${uploadZone}`, {
        method: "POST",
        body: formData,
      })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((errorData) => {
            throw new Error(errorData.error || 'Unknown error occurred.');
          });
        }
        return response.json();
      })
      .then((data) => { // information on console
        console.log("Image uploaded successfully:", data);
      })
      .catch((error) => { // display error coming from backend server
        console.error("Error:", error);
        displayError(`Error: ${error.message}`);
      });
  } else { // when no file is selected, but upload button is clicked
    console.error("No file selected.");
    displayError("Select a file before uploading.");
  }
}

// change the html element of the last image to a new image
function setMiniatureView(elementId, base64Image) {
  document.getElementById(elementId).src = `data:image/png;base64,${base64Image}`;
}

// change the html element of the last head count to the new last head count
function setLastCount(elementId, lastHeadCount) {
  document.getElementById(elementId).innerText = lastHeadCount;
}

const uploadZoneIds = [1, 2, 3]; // range of city regions

// when client connects, run all these functions for all city regions
uploadZoneIds.forEach(id => {
  socket.on(`displayMiniatureView${id}`, (base64Image) => {
    setMiniatureView(`miniatureView${id}`, base64Image);
  });
  socket.on(`displayLastCityCamera${id}`, (lastHeadCount) => {
    setLastCount(`lastHeadCount${id}`, lastHeadCount)
  });
});

// change the html element of the total head count to the new total head count
socket.on("updateTotalHeadCount", (totalHeadCount) => {
  document.getElementById("totalHeadCount").innerText = totalHeadCount;
});

// when image is uploaded, change all information to the new information of the uploaded image
socket.on("imageUploaded", (data) => {
  setMiniatureView(`miniatureView${data.upload_zone}`, data.image);

  setLastCount(`lastHeadCount${data.upload_zone}`, data.head_count)

  const totalHeadCountSpan = document.getElementById("totalHeadCount");
  const currentSum = parseInt(totalHeadCountSpan.textContent, 10);
  totalHeadCountSpan.textContent = currentSum + data.head_count;
});

// creation of the real time chart
const ctx = document.getElementById("headCountChart").getContext("2d");

// specifications of the chart
const headCountChart = new Chart(ctx, {
  type: "bar",
  data: {
    labels: [],
    datasets: [
      {
        label: "Head Count",
        data: [],
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  },
  options: {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  },
});

// head counts last 30 second interval
const headCountHistory = [];

// update the real time chart, with a new interval
const updateChart = (headCountLast30) => {
  headCountHistory.push(headCountLast30);

  headCountChart.data.labels = headCountHistory.map((_, index) => `Interval ${index + 1}`);
  headCountChart.data.datasets[0].data = headCountHistory;

  headCountChart.update();
};

socket.on("getLast30", (headCountLast30) => {
  if (headCountLast30 > 0) {
    document.getElementById("totalHeadCountLast30").innerText = headCountLast30;
    updateChart(headCountLast30);
  } else {
    headCountLast30 = 0;
    document.getElementById("totalHeadCountLast30").innerText = headCountLast30;
    updateChart(headCountLast30);
  }
});

// when there is a database error emited, we will show this and empty all information that should be displayed
socket.on('dbError', (message) => {
  displayError(message);

  uploadZoneIds.forEach(id => {
    setMiniatureView(`miniatureView${id}`, '');
    setLastCount(`lastHeadCount${id}`, '');
  });
  document.getElementById('totalHeadCountLast30').innerText = '';
});