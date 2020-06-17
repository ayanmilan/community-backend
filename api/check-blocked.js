const mongoose = require('mongoose');

const User = require('./models/user'); // User schema

// MIDDLEWARE FOR ROUTE PROTECTION

module.exports = (req, res, next) => {
	User.findById(req.userData.userId)
		.then(user => {
			if(user.isBlocked) return res.status(405).json({message : 'User blocked'});
		})
		.catch(error => {
			res.status(500).json({error: error});
		});
	next();
}