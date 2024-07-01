// importing required modules
const express = require('express'); // web application framework
const http = require('http'); // handling HTTP requests & responses
const socketIO = require('socket.io'); // real-time communcation between client and server using WebSockets
const multer = require('multer'); // file uploading middleware
const mysql = require('mysql2'); // MySQL client
const axios = require('axios'); // axios library for HTTP requests
const FormData = require('form-data'); // library for form data

const app = express(); // setting up Express
const server = http.createServer(app); // setting up HTTP server using the express server
const io = socketIO(server); // setting up socket.io

const port = 3000; // server will listen on port 3000

const storage = multer.memoryStorage(); // store files temporarily in memory
const upload = multer({ storage: storage }); // handling files in memory

app.use(express.static('public')); // used for serving html/css files in public directory

// express route handler for file uploads to server
app.post('/upload/:uploadZone', async (req, res) => {
  const uploadZone = req.params.uploadZone;

  const multerUpload = upload.single(`image${uploadZone}`);

  multerUpload(req, res, async (error) => {
      if (error instanceof multer.MulterError) {
          console.error('Multer error:', error);
          return res.status(400).json({ error: 'Bad Request' });
      } else if (error) {
          console.error('Unexpected error:', error);
          return res.status(500).json({ error: 'Internal Server Error' });
      }
      // uploaded file
      const file = req.file;
      // if a file is uploaded
      if (file) {
          const formData = new FormData();
          formData.append('imageFileField', file.buffer, 'image');
          const headers = formData.getHeaders();

          // make post request to head counting service http://localhost:8002/crowdy/image/count
          // const response = await axios.post('http://172.20.0.3:8002/crowdy/image/count', formData, { headers });
          const response = await axios.post('http://image-predict-container:8002/crowdy/image/count', formData, { headers });
          // const response = await axios.post('http://localhost:8002/crowdy/image/count', formData, { headers });
          console.log('Head counting response:', response.data.count);
          
          // prepare data to safe to the MySQL database
          const image = file.buffer.toString('base64');
          const creation_date = new Date();

          const upload_zone = uploadZone
          const head_count = response.data.count;
      }
  });
});
// start http server on port 3000
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});