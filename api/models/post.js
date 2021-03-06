const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
	userId : {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	text: {type: String},
	postMedia: [{type: String}],
	createdAt: {type: Date},
	isDeleted: {type: Boolean, default: false},
	deletedAt: {type: Date},
	likes: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
	updatedAt: {type: Date}
});

module.exports = mongoose.model('Post', postSchema);