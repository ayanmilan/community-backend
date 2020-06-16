const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

const checkAuth = require('../check-auth'); // JWT verification middleware
const checkAdmin = require('../check-admin') // Admin verification middleware

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

const postController = require('../controllers/posts-controller')

// ADMIN ROUTES

// GETTING ALL POSTS
router.get('/admin', checkAuth, checkAdmin, postController.getAll_post);
// GETTING SPECIFIC POST
router.get('/admin/:postId', checkAuth, checkAdmin, postController.get_post);
// DELETING POST
router.delete('/admin/:postId', checkAuth, checkAdmin, postController.delete_post_admin);
// GETTING COMMENTS OF A POST
router.get('/admin/:postId/comment', checkAuth, checkAdmin, postController.get_comment);
// DELETING COMMENT
router.delete('/admin/:postId/comment', checkAuth, checkAdmin, postController.delete_comment_admin);

// USER ROUTES

// CREATING POST
router.post('/', checkAuth, upload.array('postMedia'), postController.add_post);

// EDITING POST
router.patch('/:postId', checkAuth, upload.array('postMedia'), postController.edit_post)

// GETTING ALL POSTS
router.get('/', checkAuth, postController.getAll_post);

// GETTING SPECIFIC POST
router.get('/:postId', checkAuth, postController.get_post);

// DELETING POST
router.delete('/:postId', checkAuth, postController.delete_post);

// LIKING POST
router.post('/:postId/like', checkAuth, postController.like_post);

// UNLIKING POST
router.delete('/:postId/like', checkAuth, postController.unlike_post);

// ADDING COMMENT
router.post('/:postId/comment', checkAuth, postController.add_comment);

// EDITING COMMENT
router.patch('/comment/:commentId', checkAuth, postController.edit_comment);

// GETTING COMMENTS OF A POST
router.get('/:postId/comment', checkAuth, postController.get_comment);

// DELETING COMMENT
router.delete('/comment/:commentId', checkAuth, postController.delete_comment);


module.exports = router;