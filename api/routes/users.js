const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv').config();
const axios = require('axios');
const bcrypt = require('bcrypt');
const geoip = require('geoip-lite');

const checkAuth = require('../check-auth'); // JWT verification middleware
const checkAdmin = require('../check-admin') // Admin verification middleware

const User = require('../models/user'); // User schema

const userController = require('../controllers/users-controller')


// REGISTRATION ROUTE
router.post('/register', userController.register);
// OTP verification
router.post('/register/verify', userController.register_verify);


// LOGIN WITH PASSWORD ROUTE
router.post('/loginpw', userController.loginpw);


// LOGIN WITH OTP ROUTE
router.post('/loginotp', userController.loginotp);
// OTP verification
router.post('/loginotp/verify', userController.loginotp_verify);


// FORGOT PASSWORD ROUTE
router.post('/forgotpw', userController.reset_password);


// ADMIN BLOCK USER ROUTE
router.post('/admin/block/:userId', checkAuth, checkAdmin, userController.block_user_admin);


module.exports = router;