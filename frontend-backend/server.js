// importing required modules
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const multer = require('multer');
const mysql = require('mysql2');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const port = 3000; // listen on port 3000

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage
});

app.use(express.static('public'));

/* TESTING LOCALLY

// connection to MySQL database
const db = mysql.createConnection({
    host: 'mysql-container',
    user: 'root',
    password: 'root',
    database: 'images',
});
// initialize connection to the database
const connectToDb = async () => {
    try {
    await db.promise().connect;
    console.log('Connected to MySQl database')
    } catch (error) {
     console.error('Database connection error: ', error)
}};
connectToDb();

*/

/* TESTING VIA DOCKER CONTAINERS
const pool = mysql.createPool({
  host: 'mysql-container',
  user: 'root',
  password: 'root',
  database: 'images',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
*/

// MYSQL IN K8S
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'images',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

io.on('connection', async (socket) => {
  console.log('User is connected');
  try {
    await Promise.all([
      displayMiniatureView(1),
      displayMiniatureView(2),
      displayMiniatureView(3),
      displayLastCityCamera(1),
      displayLastCityCamera(2),
      displayLastCityCamera(3),
      updateTotalHeadCount(),
    ]);
    console.log('All function executed succesfully');
  } catch (error) {
    console.error('Error executing functions: ', error);
  }
  socket.on('disconnect', () => {
    console.log('User is disconnected');
  });
});

app.post('/upload/:uploadZone', async (req, res) => {
  const uploadZone = req.params.uploadZone;
  const multerUpload = upload.single(`image${uploadZone}`);

  multerUpload(req, res, async (error) => {
    if (error instanceof multer.MulterError) {
      console.error('Multer error:', error);
      return res.status(400).json({
        error: 'Bad Request'
      });
    } else if (error) {
      console.error('Error:', error);
      return res.status(500).json({
        error: 'Internal Server Error'
      });
    }

    const file = req.file;

    if (file) {
      const formData = new FormData();
      formData.append('imageFileField', file.buffer, 'image');
      const headers = formData.getHeaders();

      try {
        //const response = await axios.post('http://image-predict-container:8002/crowdy/image/count', formData, {
        const response = await axios.post('http://image-predict-service:8002/crowdy/image/count', formData, {
          headers
        });
        console.log('Head counting response:', response.data.count);

        const image = file.buffer.toString('base64');
        const creation_date = new Date();
        const head_count = response.data.count;

        pool.query(
          'INSERT INTO images_table (image, creation_date, upload_zone, head_count) VALUES (?, ?, ?, ?)',
          [image, creation_date, uploadZone, head_count],
          (err, results) => {
            if (err) {
              console.error('Database insertion error:', err);
              return res.status(500).json({
                error: 'Database insertion error'
              });
            }
            console.log('Data saved successfully:', results);

            io.emit('imageUploaded', {
              image,
              creation_date,
              upload_zone: uploadZone,
              head_count
            });
            res.status(200).json({
              message: 'Image uploaded and data saved successfully',
              id: results.insertId
            });
          }
        );
      } catch (err) {
        console.error('Error in head counting service:', err);
        res.status(500).json({
          error: 'Error in head counting service'
        });
      }
    } else {
      res.status(400).json({
        error: 'No file uploaded'
      });
    }
  });
});

const displayMiniatureView = (uploadZone) => {
  pool.query('SELECT image FROM images_table WHERE upload_zone = ? ORDER BY creation_date DESC LIMIT 1', [uploadZone], (err, result) => {
    if (err) {
      console.error('MySQL select error:', err);
    } else if (result.length > 0) {
      const imageBuffer = Buffer.from(result[0].image, 'base64');
      const base64Image = imageBuffer.toString('base64');
      io.emit(`displayMiniatureView${uploadZone}`, base64Image);
    } else {
      console.log('No data found in the database for the specified condition.');
    }
  });
};

const displayLastCityCamera = (uploadZone) => {
  pool.query(
    'SELECT head_count AS count FROM images_table WHERE upload_zone = ? ORDER BY creation_date DESC LIMIT 1', 
    [uploadZone], 
    (err, result) => {
      if (err) {
        console.error('MySQL select error:', err);
      } else if (result.length > 0) {
        const headCount = result[0].count;
        io.emit(`displayLastCityCamera${uploadZone}`, headCount);
      } else {
        console.log('No data found in the database for the specified condition.');
      }
    }
  );
};

const updateTotalHeadCount = () => {
  pool.query('SELECT SUM(head_count) AS count FROM images_table', (err, result) => {
    if (err) {
      console.error('MySQL select error:', err);
    } else {
      const updateTotalHeadCount = result[0].count;
      io.emit('updateTotalHeadCount', updateTotalHeadCount);
    }
  });
};

const getLast30 = () => {
  pool.query('SELECT SUM(head_count) AS count FROM images_table WHERE creation_date >= NOW() - INTERVAL 30 SECOND', (err, result) => {
    if (err) {
      console.error('MySQL select error:', err);
    } else {
      const headCountLast30 = result[0].count;
      io.emit('getLast30', headCountLast30);
      console.log(headCountLast30);
    }
  });
};

const emitLast30HeadCount = () => {
  getLast30();
};
setInterval(emitLast30HeadCount, 30000);

// start http server on port 3000
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});