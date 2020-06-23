const mongoose = require('mongoose');
const redisController = require('./redis-controller');
const redis = redisController.client;
;
const Post = require('../models/post'); // Post schema
const Comment = require('../models/comment'); // Comment schema

exports.add_post = (req, res, next) => {
	const post = new Post({
		userId: mongoose.Types.ObjectId(req.userData.userId),
		text: req.body.text,
		createdAt: new Date()
	});
	for (const doc of req.files) {
		post.postMedia.push(doc.location);
	}
	post
		.save()
		.then(result => {
			console.log(result);
			res.status(201).json({message: 'Post created', _id: result._id});
		})
		.catch(error => {
			res.status(500).json({error: error});
		});
};

exports.edit_post = (req, res, next) => {
	// For media uploaded
	const mediaLinks = [];
	for (const doc of req.files) {
		mediaLinks.push(doc.location);
	}

	const updateOps = {updatedAt: new Date()};
	// For editing text if exists
	if(typeof(req.body.text) != 'undefined') updateOps['text'] = req.body.text;

	Post.updateOne({_id: req.params.postId, userId: req.userData.userId, isDeleted: false}, { $set: updateOps, $push: {postMedia: mediaLinks} })
		.then(result => {
			if(!result.n) return res.status(404).json({message: 'Post not found'});
			res.status(200).json({message: 'Post edited'});
		})
		.catch(error => {
			res.status(500).json({error: error});
		});	
};

exports.getAll_post = (req, res, next) => {
	Post.find({isDeleted: false})
		.select('_id userId text postMedia createdAt updatedAt likes')
		.sort({createdAt: -1})
		.exec()
		.then(docs => {
			const posts = docs.map(async doc => {
					const user = await redisController.fetchUser(doc.userId.toString());
					return {
						_id: doc._id,
						userId: doc.userId,
						uName: user.name,
						text: doc.text,
						postMedia: doc.postMedia,
						likes: doc.likes,
						createdAt: doc.createdAt,
						updatedAt: doc.updatedAt
					}
			})
			Promise.all(posts).then(result => {res.status(200).json(result);});
		})
		.catch(error => {
			res.status(500).json({error: error});
		});
};

exports.get_post = (req, res, next) => {
	Post.findOne({_id: req.params.postId, isDeleted: false})
		.select('_id userId text postMedia createdAt updatedAt likes')
		.exec()
		.then(async doc => {
			if(!doc) return res.status(404).json({message: 'Post not found'});
			else {
				const user = await redisController.fetchUser(doc.userId.toString());
				res.status(200).json({
					_id: doc._id,
					userId: doc.userId,
					uName: user.name,
					text: doc.text,
					postMedia: doc.postMedia,
					likes: doc.likes,
					createdAt: doc.createdAt,
					updatedAt: doc.updatedAt
				});
			}
		})
		.catch(error => {
			res.status(500).json({error: error});
		});
};

exports.delete_post = (req, res, next) => {
	Post.updateOne({_id: req.params.postId, userId: req.userData.userId, isDeleted: false}, {isDeleted: true, deletedAt: new Date()})
		.then(result => {
			if(!result.n) return res.status(404).json({message: 'Post not found'});
			res.status(200).json({message: 'Post deleted'});
		})
		.catch(error => {
			res.status(500).json({error: error});
		});
};

exports.like_post =  (req, res, next) => {
	Post.updateOne({_id: req.params.postId, isDeleted: false}, {$addToSet: {likes: req.userData.userId}})
		.then(result => {
			if(!result.n) return res.status(404).json({message: 'Post not found'});
			res.status(200).json({message: 'Post liked'});
		})
		.catch(error => {
			res.status(500).json({error: error});
		});
};

exports.unlike_post =  (req, res, next) => {
	Post.updateOne({_id: req.params.postId, isDeleted: false}, {$pull: {likes: req.userData.userId}})
		.then(result => {
			if(!result.n) return res.status(404).json({message: 'Post not found'});
			res.status(200).json({message: 'Post unliked'});
		})
		.catch(error => {
			res.status(500).json({error: error});
		});
};

exports.add_comment = (req, res, next) => {
	Post.findById(req.params.postId)
		.then(post => {
			if(!post || post.isDeleted) return res.status(404).json({message: 'Post not found'});
			const comment = new Comment({
				userId: mongoose.Types.ObjectId(req.userData.userId),
				content: req.body.content,
				createdAt: new Date(),
				postId: mongoose.Types.ObjectId(req.params.postId)
			});
			comment
				.save()
				.then(result => {
					console.log(result);
					res.status(201).json({message: 'Comment created', _id: result._id});
				})
				.catch(err => {
					res.status(500).json({error: err});
				});
		})
		.catch(error => {
			res.status(500).json({error: error});
		});
};

exports.edit_comment = (req, res, next) => {
	Comment.updateOne({_id: req.params.commentId, userId: req.userData.userId, isDeleted: false}, {content: req.body.content, updatedAt: new Date})
		.then(result => {
			if(!result.n) return res.status(404).json({message: 'Comment not found'});
			res.status(200).json({message: 'Comment edited'});
		})
		.catch(error => {
			res.status(500).json({error: error});
		});
};

exports.get_comment = (req, res, next) => {
	Post.findById(req.params.postId)
		.then(post => {
			if(!post || post.isDeleted) return res.status(404).json({message: 'Post not found'});
			Comment.find({postId: req.params.postId, isDeleted: false})
				.select('_id userId content createdAt updatedAt')
				.sort({createdAt: -1})
				.exec()
				.then(docs => {
					const comments = docs.map(async doc => {
							const user = await redisController.fetchUser(doc.userId.toString());
							return {
								_id: doc._id,
								userId: doc.userId,
								uName: user.name,
								content: doc.content,
								createdAt: doc.createdAt,
								updatedAt: doc.updatedAt
							}
					})
					Promise.all(comments).then(result => {res.status(200).json(result);});
				})
				.catch(error => {
					res.status(500).json({error: error});
				});
		})
		.catch(error => {
			res.status(500).json({error: error});
		});
};

exports.delete_comment = (req, res, next) => {
	Comment.updateOne({_id: req.params.commentId, userId: req.userData.userId, isDeleted: false}, {isDeleted: true, deletedAt: new Date()})
		.then(result => {
			if(!result.n) return res.status(404).json({message: 'Comment not found'});
			res.status(200).json({message: 'Comment deleted'});
		})
		.catch(error => {
			res.status(500).json({error: error});
		});
};

exports.delete_post_admin = (req, res, next) => {
	Post.updateOne({_id: req.params.postId, isDeleted: false}, {isDeleted: true, deletedAt: new Date()})
		.then(result => {
			if(!result.n) return res.status(404).json({message: 'Post not found'});
			res.status(200).json({message: 'Post deleted'});
		})
		.catch(error => {
			res.status(500).json({error: error});
		});
};

exports.delete_comment_admin = (req, res, next) => {
	Comment.updateOne({_id: req.params.commentId, isDeleted: false}, {isDeleted: true, deletedAt: new Date()})
		.then(result => {
			if(!result.n) return res.status(404).json({message: 'Comment not found'});
			res.status(200).json({message: 'Comment deleted'});
		})
		.catch(error => {
			res.status(500).json({error: error});
		});
};