const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv').config();
const axios = require('axios');
const bcrypt = require('bcrypt');
const geoip = require('geoip-lite');

const User = require('../models/user'); // User schema

// direct register without verification for testing
router.post('/reg', (req, res, next) => {
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
							password: hash,
							name: req.body.name,
							dob: new Date(req.body.dob)
						});
						user
							.save()
							.then(result => {
								console.log(result);
								res.status(201).json({message: 'User created'});
							})
							.catch(err1 => {
								res.status(500).json({error: err1});
							});
					}
				})
			}
		})
});

router.post('/register', (req, res, next) => {
	// checking if number entered is valid
	if(req.body.mobileNo.length < 10 || req.body.mobileNo.length>10 ) {
		return res.status(500).json({message: 'Invalid number'});
	}
	User.find({mobileNo : req.body.mobileNo})
		.exec()
		.then(user => {
			// checking if already registered
			if(user.length > 0) {
				return res.status(409).json({message: 'Number already registered'});
			}
			else {
				axios.get(`http://api.msg91.com/api/sendotp.php?authkey=${process.env.msg91authkey}&mobile=${"91"+req.body.mobileNo}`)
					.then( response => {
						res.status(200).json({message: 'OTP sent, please verify'});
					})
					.catch( error => {
						console.log(error);
						res.status(400).json({error: 'OTP not sent'});
					});
			}
		});
});

router.post('/register/otp', (req, res, next) => {
	// OTP verification
	axios.get(`http://api.msg91.com/api/verifyRequestOTP.php?authkey=${process.env.msg91authkey}&mobile=${"91"+req.body.mobileNo}&otp=${req.body.otp}`)
		.then( (response) => {
			console.log(response.data);
			if(response.data.type == "success" ) {
				// user registeration
				bcrypt.hash(req.body.password, 10, (err, hash) => {
					if (err) {
						return res.status(500).json({error: err});
					}
					else {
						const user = new User({
							_id: new mongoose.Types.ObjectId(),
							mobileNo: req.body.mobileNo,
							password: hash,
							name: req.body.name,
							dob: new Date(req.body.dob)
						});
						user
							.save()
							.then(result => {
								console.log(result);
								res.status(201).json({message: 'User created'});
							})
							.catch(err1 => {
								res.status(500).json({error: err1});
							});
					}
				});	
			}
			else if (response.data.message == "already_verified") {
				res.status(400).json({message: 'OTP verified already, try again'});
			}
			else {
				res.status(401).json({message: 'Wrong OTP'});
			}
		})
		.catch( error => {
			console.log(error);
			res.status(400).json({error: error});
		});
});

// LOGIN WITH PASSWORD ROUTE
router.post('/loginpw', (req, res, next) => {
	//getting ip info
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	var geo = geoip.lookup(ip);
	
	//checking if exists
	User.find({mobileNo: req.body.mobileNo})
		.exec()
		.then(user => {
			if(user.length <= 0) {
				return res.status(401).json({message: 'Authentication failed'});
			}
			//updating login attempts
			User.updateOne({mobileNo: user[0].mobileNo}, {
				$inc: {loginAttempts: 1}
			},
			err1 => {
				if (err1) console.log(err1)
			});

			//checking password
			bcrypt.compare(req.body.password, user[0].password, (err, result) => {
				if(err) {
					return res.status(401).json({message: 'Authentication failed'});
				}	
				if(result) {
					// JWT generation
					const token = jwt.sign({
						mobileNo: user[0].mobileNo,
						userId: user[0]._id
					}, 
					process.env.JWT_KEY || "secret",
					{
						expiresIn: "6h"
					});

					//updating login info
					User.updateOne({mobileNo: user[0].mobileNo}, {
						$set: {
							loginInfo: {
								ipAdd: ip,
								country: geo.country,
								city: geo.city,
								loginTime: new Date()
							},
							loginAttempts: 0
						}
					},
					err1 => {
						if (err1) console.log(err1)
					});

					return res.status(200).json({
						message: 'Aunthentication successful',
						token: token
					});
				}
				//wrong password entered
				res.status(401).json({message: 'Authentication failed'}); 
			})
		})
		.catch(err => {
			res.status(500).json({error: err});
		});
});

//LOGIN WITH OTP ROUTE
router.post('/loginotp', (req, res, next) => {
	User.find({mobileNo: req.body.mobileNo})
		.exec()
		.then(user => {
			if(user.length <= 0) {
				return res.status(401).json({message: 'Authentication failed'});
			}
			else {
				//updating login attempts
				User.updateOne({mobileNo: user[0].mobileNo}, {
					$inc: {loginAttempts: 1}
				},
				err1 => {
					if (err1) console.log(err1)
				});

				//sending OTP
				axios.get(`http://api.msg91.com/api/sendotp.php?authkey=${process.env.msg91authkey}&mobile=${"91"+req.body.mobileNo}`)
					.then( response => {
						res.status(200).json({message: 'OTP sent, please verify'});
					})
					.catch( error => {
						console.log(error);
						res.status(400).json({error: 'OTP not sent'});
					});
			}
		})
		.catch(err => {
			res.status(500).json({error: err});
		});	
});

router.post('/loginotp/verify', (req, res, next) => {
	//getting ip info
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	var geo = geoip.lookup(ip);

	//checking if exists
	User.find({mobileNo: req.body.mobileNo})
		.exec()
		.then(user => {
			if(user.length <= 0) {
				return res.status(401).json({message: 'Authentication failed'});
			}
			else {
				//verifying OTP
				axios.get(`http://api.msg91.com/api/verifyRequestOTP.php?authkey=${process.env.msg91authkey}&mobile=${"91"+req.body.mobileNo}&otp=${req.body.otp}`)
					.then( (response) => {
						console.log(response.data);
						if(response.data.type == "success" ) {
							// JWT generation
							const token = jwt.sign({
								mobileNo: user[0].mobileNo,
								userId: user[0]._id
							}, 
							process.env.JWT_KEY || "secret",
							{
								expiresIn: "6h"
							});

							//updating login info
							User.updateOne({mobileNo: user[0].mobileNo}, {
								$set: {
									loginInfo: {
										ipAdd: ip,
										country: geo.country,
										city: geo.city,
										loginTime: new Date()
									},
									loginAttempts: 0
								}
							},
							err1 => {
								if (err1) console.log(err1)
							});

							return res.status(200).json({
								message: 'Aunthentication successful',
								token: token
							});
						}
						else if (response.data.message == "already_verified") {
							res.status(400).json({message: 'OTP verified already, try again'});
						}
						else {
							res.status(401).json({message: 'Wrong OTP'});
						}
					})
					.catch( error => {
						console.log(error);
						res.status(400).json({error: error});
					});
			}
		})
		.catch(err => {
			res.status(500).json({error: err});
		});	
});


module.exports = router;