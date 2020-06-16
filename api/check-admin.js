const jwt = require('jsonwebtoken');

const User = require('./models/user'); // User schema

// MIDDLEWARE FOR ROUTE PROTECTION

module.exports = (req, res, next) => {
	try {
		const token = req.headers.authorization;
		const decoded = jwt.verify(token, process.env.JWT_KEY || "secret");
		req.userData = decoded;

		User.findById(req.userData.userId, (err, user) => {
			if(err) return res.status(500).json({error: err});
			if(!user.isAdmin) return res.status(401).json({message : 'Aunthentication failed'});
		});

		next();
	}
	catch (err) {
		return res.status(401).json({message : 'Aunthentication failed'});
	}
}