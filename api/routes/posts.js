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

// CREATING POST ROUTE
router.post('/add', checkAuth, upload.array('postMedia'), (req, res, next) => {
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
			res.status(201).json({message: 'Post created'})
		})
		.catch(error => {
			res.status(500).json({error: err});
		});
});

// DELETING POST ROUTE
router.delete('/:postId', checkAuth, (req, res, next) => {
	const id = req.params.postId;
	Post.findOneAndUpdate({_id: id, userId: req.userData.userId}, {isDeleted: true, deletedAt: new Date()})
		.exec()
		.then(result => {
			console.log(result);
			res.status(200).json({message: 'Post deleted'})
		})
		.catch(error => {
			res.status(500).json({error: error});
		});
});


module.exports = router;