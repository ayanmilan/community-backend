const jwt = require('jsonwebtoken');

// MIDDLEWARE FOR ROUTE PROTECTION

module.exports = (req, res, next) => {
	try {
		const token = req.headers.authorization;
		const decoded = jwt.verify(token, process.env.JWT_KEY || "secret");
		req.userData = decoded;
		next();
	}
	catch (err) {
		return res.status(401).json({message : 'Aunthentication failed'});
	}
}