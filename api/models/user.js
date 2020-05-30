const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
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
	}
});

module.exports = mongoose.model('User', userSchema);