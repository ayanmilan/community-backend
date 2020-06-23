const mongoose = require('mongoose');
const User = require('../models/user');
const redis = require('redis');

const client = redis.createClient(process.env.REDIS_URL || 'redis://127.0.0.1:6379/');

const { promisify } = require("util");
const fetch = promisify(client.get).bind(client);

exports.fetchUser = (id) => {
	return new Promise((resolve, reject) => {
		fetch(id)
			.then(result => {
				if(result) resolve(JSON.parse(result));
				else {
					User.findById(id)
						.then(user => {
							if(user) client.set(String(id), JSON.stringify(user));
							resolve(user);
						})
						.catch(err => {
							reject(err);
						})
				}
			})
			.catch(error => {
				reject(error);
			});
	})	
};

exports.client = client;
exports.fetch = fetch;