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

//// connection to MySQL database
//const db = mysql.createConnection({
//    host: 'host.docker.internal', // localhost when running without docker
//    //host: 'mysql-container', // localhost when running without docker
//    //host: 'my-mysql-container', // localhost when running without docker
//    user: 'root', // username
//    password: 'root', // password
//    database: 'images_CC', // the mysql database that is created
//});
//// initialize connection to the database
//const connectToDb = async () => {
//    try {
//        await db.promise().connect;
//        console.log('Connected to MySQl database')
//    } catch (error) {
//        console.error('Database connection error: ', error)
//    }
//};
//connectToDb();

const pool = mysql.createPool({
    host: 'mysql-container', // the name of the MySQL service/container
    user: 'root',
    password: 'root',
    database: 'images',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  io.on('connection', async (socket) => {
    console.log('User is connected');
    // perform actions when new user is connected 
    try {
        await Promise.all([
          displayMiniatureView1(),
        ]);
        console.log('All function executed succesfully');
    } catch (error) {
        console.log('Error executing functions: ', error)
    }
    // 'disconnect' event
    socket.on('disconnect', () => {
        // perform action when user disconnects
      console.log('User is disconnected');
    });
});

// Express route handler for file uploads to server
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

      // Uploaded file
      const file = req.file;

      // If a file is uploaded
      if (file) {
          const formData = new FormData();
          formData.append('imageFileField', file.buffer, 'image');
          const headers = formData.getHeaders();

          try {
              // Make post request to head counting service
              const response = await axios.post('http://image-predict-container:8002/crowdy/image/count', formData, { headers });
              console.log('Head counting response:', response.data.count);

              // Prepare data to save to the MySQL database
              const image = file.buffer.toString('base64');
              const creation_date = new Date();
              const head_count = response.data.count;

              // Save to MySQL database
              pool.query(
                  'INSERT INTO images_table (image, creation_date, upload_zone, head_count) VALUES (?, ?, ?, ?)',
                  [image, creation_date, uploadZone, head_count],
                  (err, results) => {
                      if (err) {
                          console.error('Database insertion error:', err);
                          return res.status(500).json({ error: 'Database insertion error' });
                      }
                      console.log('Data saved successfully:', results);

                      // Emit event to notify clients about successful image upload
                      io.emit('imageUploaded', { image, creation_date, upload_zone: uploadZone, head_count });
                      res.status(200).json({ message: 'Image uploaded and data saved successfully', id: results.insertId });
                  }
              );
          } catch (err) {
              console.error('Error in head counting service:', err);
              res.status(500).json({ error: 'Error in head counting service' });
          }
      } else {
          res.status(400).json({ error: 'No file uploaded' });
      }
  });
});

const displayMiniatureView1 = () => {
  pool.query('SELECT image FROM images_table WHERE upload_zone = 1 ORDER BY creation_date DESC LIMIT 1', (err, result) => {
      if (err) {
          console.error('MySQL select error:', err);
      } else if (result.length > 0) {
          // Check if the result set is not empty
          const imageBuffer = Buffer.from(result[0].image, 'base64');

          // Convert Buffer to base64
          const base64Image = imageBuffer.toString('base64');
          io.emit('displayMiniatureView1', base64Image);
      } else {
          console.log('No data found in the database for the specified condition.');
      }
  });
};

// start http server on port 3000
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});