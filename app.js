const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

mongoose.connect('mongodb://localhost:27017/community-app', (err) => {
	if(err) throw err;
	else console.log('Database connected!');
});

app.use(bodyParser.json());

const userRoutes = require('./api/routes/users');
app.use('/users', userRoutes);




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