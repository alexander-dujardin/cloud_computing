const socket = io();

function displayError(message) {
  const notificationArea = document.getElementById('notificationArea');
  notificationArea.textContent = message;
  notificationArea.classList.remove('hidden');
  notificationArea.classList.add('visible');
  
  setTimeout(() => {
    notificationArea.classList.remove('visible');
    notificationArea.classList.add('hidden');
  }, 7000);
}

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
      .then((response) => {
        if (!response.ok) {
          return response.json().then((errorData) => {
            throw new Error(errorData.error || 'Unknown error occurred.');
          });
        }
        return response.json();
      })
      .then((data) => {
        console.log("Image uploaded successfully:", data);
        // Reset the form or perform other actions on success
      })
      .catch((error) => {
        console.error("Error:", error);
        displayError(`Error: ${error.message}`);
      });
  } else {
    console.error("No file selected.");
    displayError("Select a file before uploading.");
  }
}



function setMiniatureView(elementId, base64Image) {
  document.getElementById(elementId).src = `data:image/png;base64,${base64Image}`;
}

function setLastCount(elementId, lastHeadCount) {
  document.getElementById(elementId).innerText = lastHeadCount;
}

const uploadZoneIds = [1, 2, 3]; // range of IDs

uploadZoneIds.forEach(id => {
  socket.on(`displayMiniatureView${id}`, (base64Image) => {
    setMiniatureView(`miniatureView${id}`, base64Image);
  });
  socket.on(`displayLastCityCamera${id}`, (lastHeadCount) => {
    setLastCount(`lastHeadCount${id}`, lastHeadCount)
  });
});

socket.on("updateTotalHeadCount", (totalHeadCount) => {
  document.getElementById("totalHeadCount").innerText = totalHeadCount;
});

socket.on("imageUploaded", (data) => {
  setMiniatureView(`miniatureView${data.upload_zone}`, data.image);

  setLastCount(`lastHeadCount${data.upload_zone}`, data.head_count)

  const totalHeadCountSpan = document.getElementById("totalHeadCount");
  const currentSum = parseInt(totalHeadCountSpan.textContent, 10);
  totalHeadCountSpan.textContent = currentSum + data.head_count;
});

const ctx = document.getElementById("headCountChart").getContext("2d");
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

const headCountHistory = [];

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

socket.on('dbError', (message) => {
  displayError(message);
  // Clear the images and counts if needed
  uploadZoneIds.forEach(id => {
    setMiniatureView(`miniatureView${id}`, ''); // Clear image
    setLastCount(`lastHeadCount${id}`, ''); // Clear count
  });
  document.getElementById('totalHeadCountLast30').innerText = '';
});