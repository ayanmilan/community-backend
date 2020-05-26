const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const checkAuth = require('../check-auth');

const User = require('../models/user');

router.post('/register', (req, res, next) => {
	User.find({mobileNo : req.body.mobileNo})
		.exec()
		.then(user => {
			if(user.length > 0) {
				return res.status(409).json({message: 'Number already registered'});
			}
			else {
				bcrypt.hash(req.body.password, 10, (err, hash) => {
					if (err) {
						return res.status(500).json({error: err});
					}
					else {
						const user = new User({
							_id: new mongoose.Types.ObjectId(),
							mobileNo : req.body.mobileNo,
							password: hash
						});
						user
							.save()
							.then(result => {
								console.log(result);
								res.status(201).json({message: 'User created'});
							})
							.catch(err => {
								res.status(500).json({error: err});
							});
					}
				})
			}
		})
});

router.post('/login', (req, res, next) => {
	User.find({mobileNo: req.body.mobileNo})
		.exec()
		.then(user => {
			if(user.length <= 0) {
				return res.status(401).json({message: 'Authentication failed'});
			}
			bcrypt.compare(req.body.password, user[0].password, (err, result) => {
				if(err) return res.status(401).json({message: 'Authentication failed'});
				if(result) {
					const token = jwt.sign({
						mobileNo: user[0].mobileNo,
						userId: user[0]._id
					}, 
					process.env.JWT_KEY || "secret",
					{
						expiresIn: "6h"
					});
					//User.updateOne({mobileNo: user[0].mobileNo}, {$set: {lastIp : }});
					return res.status(200).json({
						message: 'Aunthentication successful',
						token: token
					});
				}
				res.status(401).json({message: 'Authentication failed'});
			})
		})
		.catch(err => {
			res.status(500).json({error: err});
		})
});

module.exports = router;