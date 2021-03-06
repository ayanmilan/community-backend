const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv').config();
const axios = require('axios');
const bcrypt = require('bcrypt');
const geoip = require('geoip-lite');
const redis = require('./redis-controller').client;

const User = require('../models/user'); // User schema

exports.register_admin = (req, res, next) => {
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
							mobileNo : req.body.mobileNo,
							password: hash,
							name: req.body.name,
							dob: new Date(req.body.dob),
							isAdmin: req.body.isAdmin
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
		.catch(error => {
			res.status(500).json({error: error})
		});
};

exports.register = (req, res, next) => {
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
						res.status(500).json({error: 'OTP not sent'});
					});
			}
		})
		.catch(error => {
			res.status(500).json({error: error})
		});
};

exports.register_verify = (req, res, next) => {
	// OTP verification
	axios.get(`http://api.msg91.com/api/verifyRequestOTP.php?authkey=${process.env.msg91authkey}&mobile=${"91"+req.body.mobileNo}&otp=${req.body.otp}`)
		.then( (response) => {
			console.log(response.data);
			if(response.data.type == "success" ) {
				// user registration
				bcrypt.hash(req.body.password, 10, (err, hash) => {
					if (err) {
						return res.status(500).json({error: err});
					}
					else {
						const user = new User({
							mobileNo: req.body.mobileNo,
							password: hash,
							name: req.body.name,
							dob: new Date(req.body.dob),
							isAdmin: req.body.isAdmin
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
				res.status(500).json({message: 'OTP verified already, try again'});
			}
			else {
				res.status(401).json({message: 'Wrong OTP'});
			}
		})
		.catch(error => {
			console.log(error);
			res.status(500).json({error: error});
		});
};

exports.loginpw = (req, res, next) => {
	// getting ip info
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	var geo = geoip.lookup(ip);
	var geoCountry = ""; var geoCity = "";
	if(geo == null || geo.country == null) geoCountry = "unknown";
	else geoCountry = geo.country;
	if(geo == null || geo.city == null) geoCity = "unknown";
	else geoCountry = geo.city;
	
	// checking if exists
	User.find({mobileNo: req.body.mobileNo})
		.exec()
		.then(user => {
			if(user.length <= 0) {
				return res.status(401).json({message: 'Authentication failed'});
			}
			// updating login attempts
			User.updateOne({mobileNo: user[0].mobileNo}, {
				$inc: {loginAttempts: 1}
			},
			err1 => {
				if (err1) console.log(err1)
			});

			// checking password
			bcrypt.compare(req.body.password, user[0].password, (err, result) => {
				if(err) {
					return res.status(401).json({message: 'Authentication failed'});
				}	
				if(result) {
					// JWT generation
					const token = jwt.sign({
						userId: user[0]._id
					}, 
					process.env.JWT_KEY || "secret",
					{
						expiresIn: "24h"
					});

					// updating login info
					User.updateOne({mobileNo: user[0].mobileNo}, {
						$set: {
							loginInfo: {
								ipAdd: ip,
								country: geoCountry,
								city: geoCity,
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
				// wrong password entered
				res.status(401).json({message: 'Authentication failed'}); 
			})
		})
		.catch(error => {
			res.status(500).json({error: error});
		});
};

exports.loginotp = (req, res, next) => {
	User.find({mobileNo: req.body.mobileNo})
		.exec()
		.then(user => {
			if(user.length <= 0) {
				return res.status(401).json({message: 'Authentication failed'});
			}
			else {
				// updating login attempts
				User.updateOne({mobileNo: user[0].mobileNo}, {
					$inc: {loginAttempts: 1}
				},
				err1 => {
					if (err1) console.log(err1)
				});

				// sending OTP
				axios.get(`http://api.msg91.com/api/sendotp.php?authkey=${process.env.msg91authkey}&mobile=${"91"+req.body.mobileNo}`)
					.then( response => {
						res.status(200).json({message: 'OTP sent, please verify'});
					})
					.catch( error => {
						console.log(error);
						res.status(500).json({error: 'OTP not sent'});
					});
			}
		})
		.catch(error => {
			res.status(500).json({error: error});
		});
};

exports.loginotp_verify = (req, res, next) => {
	// getting ip info
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	var geo = geoip.lookup(ip);
	var geoCountry = ""; var geoCity = "";
	if(geo == null || geo.country == null) geoCountry = "unknown";
	else geoCountry = geo.country;
	if(geo == null || geo.city == null) geoCity = "unknown";
	else geoCountry = geo.city;

	// checking if exists
	User.find({mobileNo: req.body.mobileNo})
		.exec()
		.then(user => {
			if(user.length <= 0) {
				return res.status(401).json({message: 'Authentication failed'});
			}
			else {
				// verifying OTP
				axios.get(`http://api.msg91.com/api/verifyRequestOTP.php?authkey=${process.env.msg91authkey}&mobile=${"91"+req.body.mobileNo}&otp=${req.body.otp}`)
					.then( (response) => {
						console.log(response.data);
						if(response.data.type == "success" ) {
							// JWT generation
							const token = jwt.sign({
								userId: user[0]._id
							}, 
							process.env.JWT_KEY || "secret",
							{
								expiresIn: "24h"
							});

							// updating login info
							User.updateOne({mobileNo: user[0].mobileNo}, {
								$set: {
									loginInfo: {
										ipAdd: ip,
										country: geoCountry,
										city: geoCity,
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
							res.status(500).json({message: 'OTP verified already, try again'});
						}
						else {
							res.status(401).json({message: 'Wrong OTP'});
						}
					})
					.catch( error => {
						console.log(error);
						res.status(500).json({error: error});
					});
			}
		})
		.catch(error => {
			res.status(500).json({error: error});
		});
};

exports.reset_password = (req, res, next) => {
	// checking if exists
	User.find({mobileNo: req.body.mobileNo})
		.exec()
		.then(user => {
			if(user.length <= 0) {
				return res.status(401).json({message: 'Authentication failed'});
			}
			else {
				// verifying OTP
				axios.get(`http://api.msg91.com/api/verifyRequestOTP.php?authkey=${process.env.msg91authkey}&mobile=${"91"+req.body.mobileNo}&otp=${req.body.otp}`)
					.then( (response) => {
						console.log(response.data);
						if(response.data.type == "success" ) {
							bcrypt.hash(req.body.password, 10, (err, hash) => {
								if (err) {
									return res.status(500).json({error: err});
								}
								else {
									User.updateOne({mobileNo: user[0].mobileNo}, {
										$set: {
											password: hash
										}
									},
									err1 => {
										if (err1) return res.status(500).json({error: err1});
										else return res.status(200).json({message: 'password change successful'});	
									});
								}
							});
						}
						else if (response.data.message == "already_verified") {
							res.status(500).json({message: 'OTP verified already, try again'});
						}
						else {
							res.status(401).json({message: 'Wrong OTP'});
						}
					})
					.catch( error => {
						console.log(error);
						res.status(500).json({error: error});
					});
			}
		})
		.catch(error => {
			res.status(500).json({error: error});
		});
};

exports.block_user_admin = (req,res,next) => {
	User.updateOne({_id: req.params.userId}, {isBlocked: true})
		.then(result => {
			if(!result.n) return res.status(404).json({message: 'User not found'});
			// deleting from redis
			redis.del(String(req.params.userId));
			
			res.status(200).json({message: 'User blocked'});
		})
		.catch(error => {
			res.status(500).json({error: error});
		});
};