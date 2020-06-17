const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
	mobileNo: {type:  String, required: true, unique: true},
	password: {type: String, required: true},
	name: {type: String, required: true},
	dob: {type: Date},
	loginAttempts: {type: Number, default: 0},
	loginInfo: {
		ipAdd: {type: String},
		country: {type: String},
		city: {type: String},
		loginTime: {type: Date, default: Date.now}
	},
	isAdmin: {type: Boolean},
	isBlocked: {type: Boolean}
});

module.exports = mongoose.model('User', userSchema);
