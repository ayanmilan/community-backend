const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	mobileNo: {type: Number, required: true, unique: true},
	password: {type: String, required: true},
	lastIp: {type: String, required: false}
});

module.exports = mongoose.model('User', userSchema);