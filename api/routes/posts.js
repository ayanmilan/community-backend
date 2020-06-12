const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const checkAuth = require('../check-auth'); // JWT verification middleware

const s3 = new AWS.S3({
	secretAccessKey: process.env.awsSecret,
	accessKeyId: process.env.awsKey,
	region: process.env.awsRegion
});

const s3storage = multerS3({
	s3: s3,
	bucket: 'ebharatam',
	key: (req, file, cb) => {
		cb(null, new Date().toISOString()+ file.originalname);
	}
})
const upload = multer({storage: s3storage}); // Multer middleware

const Post = require('../models/post'); // Post schema
const Comment = require('../models/comment'); // Comment schema

// CREATING POST
router.post('/', checkAuth, upload.array('postMedia'), (req, res, next) => {
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
});

// EDITING POST
router.patch('/:postId', checkAuth, upload.array('postMedia'), (req, res, next) => {
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
});

// GETTING ALL POSTS
router.get('/', checkAuth, (req, res, next) => {
	Post.find({isDeleted: false})
		.select('_id userId text postMedia createdAt updatedAt likes')
		.sort({createdAt: -1})
		.exec()
		.then(docs => {
			res.status(200).json(docs);
		})
		.catch(error => {
			res.status(500).json({error: error});
		});
});

// GETTING SPECIFIC POST
router.get('/:postId', checkAuth, (req, res, next) => {
	Post.findOne({_id: req.params.postId, isDeleted: false})
		.select('_id userId text postMedia createdAt updatedAt likes')
		.exec()
		.then(doc => {
			if(!doc) return res.status(404).json({message: 'Post not found'});
			res.status(200).json(doc);
		})
		.catch(error => {
			res.status(500).json({error: error});
		});
});

// DELETING POST
router.delete('/:postId', checkAuth, (req, res, next) => {
	Post.updateOne({_id: req.params.postId, userId: req.userData.userId, isDeleted: false}, {isDeleted: true, deletedAt: new Date()})
		.then(result => {
			if(!result.n) return res.status(404).json({message: 'Post not found'});
			res.status(200).json({message: 'Post deleted'});
		})
		.catch(error => {
			res.status(500).json({error: error});
		});
});

// LIKING POST
router.post('/:postId/like', checkAuth, (req, res, next) => {
	Post.updateOne({_id: req.params.postId, isDeleted: false}, {$addToSet: {likes: req.userData.userId}})
		.then(result => {
			if(!result.n) return res.status(404).json({message: 'Post not found'});
			res.status(200).json({message: 'Post liked'});
		})
		.catch(error => {
			res.status(500).json({error: error});
		});
});

// UNLIKING POST
router.delete('/:postId/like', checkAuth, (req, res, next) => {
	Post.updateOne({_id: req.params.postId, isDeleted: false}, {$pull: {likes: req.userData.userId}})
		.then(result => {
			if(!result.n) return res.status(404).json({message: 'Post not found'});
			res.status(200).json({message: 'Post unliked'});
		})
		.catch(error => {
			res.status(500).json({error: error});
		});
});

// ADDING COMMENT
router.post('/:postId/comment', checkAuth, (req, res, next) => {
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
});

// EDITING COMMENT
router.patch('/comment/:commentId', checkAuth, (req, res, next) => {
	Comment.updateOne({_id: req.params.commentId, userId: req.userData.userId, isDeleted: false}, {content: req.body.content, updatedAt: new Date})
		.then(result => {
			if(!result.n) return res.status(404).json({message: 'Comment not found'});
			res.status(200).json({message: 'Comment edited'});
		})
		.catch(error => {
			res.status(500).json({error: error});
		});
});

// GETTING COMMENTS OF A POST
router.get('/:postId/comment', checkAuth, (req, res, next) => {
	Post.findById(req.params.postId)
		.then(post => {
			if(!post || post.isDeleted) return res.status(404).json({message: 'Post not found'});
			Comment.find({postId: req.params.postId, isDeleted: false})
				.select('_id userId content createdAt updatedAt')
				.sort({createdAt: -1})
				.exec()
				.then(docs => {
					res.status(200).json(docs);
				})
				.catch(error => {
					res.status(500).json({error: error});
				});
		})
		.catch(error => {
			res.status(500).json({error: error});
		});
});

// DELETING COMMENT
router.delete('/comment/:commentId', checkAuth, (req, res, next) => {
	Comment.updateOne({_id: req.params.commentId, userId: req.userData.userId, isDeleted: false}, {isDeleted: true, deletedAt: new Date()})
		.then(result => {
			if(!result.n) return res.status(404).json({message: 'Comment not found'});
			res.status(200).json({message: 'Comment deleted'});
		})
		.catch(error => {
			res.status(500).json({error: error});
		});
});


module.exports = router;