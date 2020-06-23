const mongoose = require('mongoose');
const redis = require('./controllers/redis-controller').client;

const User = require('./models/user'); // User schema

// MIDDLEWARE FOR ROUTE PROTECTION

module.exports = (req, res, next) => {
	redis.get(req.userData.userId, (err, result) => {
		if(err) console.log(err);
		else if(result) {
			const user = JSON.parse(result);
			if(!user.isAdmin) return res.status(401).json({message : 'User not an admin'});
			next();
		}
		else {
			User.findById(req.userData.userId)
				.then(user => {
					// storing in Redis
					redis.set(String(user._id), JSON.stringify(user), err1 => {
						if(err1) console.log(err1);
					});

					if(!user.isAdmin) return res.status(401).json({message : 'User not an admin'});
					next();
				})
				.catch(error => {
					res.status(500).json({error: error});
				});
		}
	});
};