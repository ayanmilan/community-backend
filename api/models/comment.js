const mongoose = require('mongoose');

const commentSchema = mongoose.Schema({
	userId : {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	content: {type: String},
	postId: {type: mongoose.Schema.Types.ObjectId, ref:'Post'},
	createdAt: {type: Date},
	isDeleted: {type: Boolean, default: false},
	deletedAt: {type: Date},
	updatedAt: {type: Date}
});

module.exports = mongoose.model('Comment', commentSchema);