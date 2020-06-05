const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const dotenv = require('dotenv').config();

// Connecting to the database
mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/community-app', { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }, (error) => {
	if(error) throw error;
	else console.log('Database connected!');
});

// Logging the requests
morgan.token('body', (req, res) => { return JSON.stringify(req.body) });
app.use(morgan(':body - :req[content-length]'));
app.use(morgan('dev'));

app.use(bodyParser.json()); // JSON body parser


// LOGIN/REGISTER USER ROUTES
const userRoutes = require('./api/routes/users');
app.use('/users', userRoutes);



// INVALID URL HANDLING
app.use((req, res, next) => {
	const error = new Error('URl path not found');
	error.status = 404;
	throw error;
	next(error);
});
// ERROR HANDLING
app.use((error, req, res, next) => {
	res.status(error.status || 500);
	res.json({
		error: {
			message: error.message
		}
	});
});


module.exports = app;