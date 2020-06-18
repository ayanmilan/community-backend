const mongoose = require('mongoose');

const User = require('./models/user'); // User schema

// MIDDLEWARE FOR ROUTE PROTECTION

module.exports = (req, res, next) => {
	User.findById(req.userData.userId)
		.then(user => {
			if(!user.isAdmin) return res.status(401).json({message : 'Aunthentication failed'});
			next();
		})
		.catch(error => {
			res.status(500).json({error: error});
		});
}