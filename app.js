const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv').config();
const geoip = require('geoip-lite');

mongoose.connect('mongodb://localhost:27017/community-app', { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
	if(err) throw err;
	else console.log('Database connected!');
});

app.use(bodyParser.json()); //JSON body parser

// app.use((req, res, next) => {
// 	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
// 	console.log(ip);
// 	var geo = geoip.lookup(ip);
// 	console.log(geo);
// 	next();
// });

const userRoutes = require('./api/routes/users');
app.use('/users', userRoutes);



// INVALID URL HANDLING
app.use((req, res, next) => {
	const error = new Error('URl path not found');
	error.status = 404;
	throw error;
	next(error);
});

app.use((error, req, res, next) => {
	res.status(error.status || 500);
	res.json({
		error: {
			message: error.message
		}
	});
});

module.exports = app;