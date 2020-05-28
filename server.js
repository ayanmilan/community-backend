const http = require('http');
const app = require('./app');
const dotenv = require('dotenv').config();

const port = process.env.PORT || 3000;
console.log(`PORT set to: ${port}`);

const server = http.createServer(app);

server.listen(port);