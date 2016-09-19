// jshint esversion: 6
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var jwt = require('jsonwebtoken');
var async = require('async');

var config = require('./config');

var mysql = require('mysql');
var conn = mysql.createConnection(config.connection);
conn.connect();

// Initialize with dummy values
if (process.argv.length === 3 && process.argv[2] == 'reset'){
	let fs = require('fs');
	let lines = fs.readFileSync('./sql-init', 'utf8').split('\n');
	lines.forEach(function(line){
		if (line.length === 0)
			return;
		console.log('>'+line+'<');
		conn.query(line, function(err, res){
			if (err)
				console.log(err);
		});
	});
}

app.use(express.static('.'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* Sign Up */
app.post('/signup', function(req, res, next){
	// TODO: Hash and Salt
	conn.query(`INSERT INTO users (username, password) VALUES ('${req.body.username}','${req.body.password}');`, function(err){
		if (err) {
			return next(err);
		}
		res.end();
	});
});

/* Login */
app.post('/auth', function(req, res, next){
	// console.log(req.body.username);
	// console.log(req.body.password);
	// console.log(`SELECT user_id FROM users WHERE username='${req.body.username}' AND password='${req.body.password}'`);
	conn.query(`SELECT user_id FROM users WHERE username='${req.body.username}' AND password='${req.body.password}'`, function (err, results, fields){
		if (err) {
			return next(err);
		} else if (results.length !== 1) {
			let err = new Error('Invalid credentials');
			err.status = 401;
			return next(err);
		}
		let token = jwt.sign({user_id: results[0].user_id}, config.secret, {expiresIn: '1d'});
		res.send({token: token});
	});
});

/*	Verify token before proceeding on /secure/ */
app.post('/secure/*', function(req, res, next) {
	console.log('/secure/');
	let token = req.body.token || req.query.token;
	if (token){
		jwt.verify(token, config.secret, function(err, decoded) {
			if (err) {
				err.status = 401;
				return next(err);
			}
			else {
				print(decoded);
				res.locals.decoded = decoded;
				return next();
			}
		});
	} else {
		let err = new Error('Missing token');
		err.status = 401;
		return next(err);
	}
});

/* Get Members */
app.post('/secure/initialize', function(req, res, next) {
	conn.query(`SELECT member_id, name FROM members WHERE user_id=${res.locals.decoded.user_id}`, function (err, results){
		if (err) {
			err.context = 'get members';
			return next(err);
		}
		res.locals.members = results;
		return next();
	});
});

/* Get Transactions */
app.post('/secure/initialize', function(req, res, next) {
	conn.query(`SELECT trans_id, type, name, date, amount FROM transactions WHERE user_id=${res.locals.decoded.user_id}`, function (err, results){
		if (err) {
			err.context = 'get transactions';
			return next(err);
		}
		async.map(results, function(element, callback) {
			conn.query(`SELECT creditor, debtor, amount FROM liabilities WHERE trans_id=${element.trans_id}`, function(err, results){
				if (err){
					callback(err);
				} else {
					element.liabilities = results;
					callback(null, element);
				}
			});
		}, function(err, results) {
			if (err) {
				err.context = 'assign liabilities to transactions';
				return next(err);
			}
			res.locals.transactions = results;
			return next();
		});
	});
});

/* Make Tally */
app.post('/secure/initialize', function(req, res, next) {
	let tally = [];
	async.each(res.locals.members, function(member, callback) {
		conn.query(`SELECT SUM(amount) FROM liabilities WHERE debtor=${member.member_id}`, function(err, debt) {
			if (err) {
				callback(err);
			} else {
				conn.query(`SELECT SUM(amount) FROM liabilities WHERE creditor=${member.member_id}`,function(err, credit) {
					if (err) {
						callback(err);
					} else {
						let sum = credit[0]["SUM(amount)"] - debt[0]["SUM(amount)"];
						if (sum !== 0){
							tally.push({member_id: member.member_id, sum: sum});
						}
						callback(null);
					}
				});
			}
		});
	}, function(err) {
		if (err) {
			err.context = 'making tally';
			return next(err);
		}
		res.locals.tally = tally;
		return next();
	});
});

/* Compute Transfers */
app.post('/secure/initialize', function(req, res, next) {
	let tally = res.locals.tally;
	let transfers = [];
	
	let sortingFn = function(a,b) {
		return b.sum - a.sum;
	};
	
	tally = tally.sort(sortingFn);
	
	print(tally);
	
	// Keep eliminating the largest debts and credits
	while ((tally.length > 3) && (tally[1].sum > 0) && (tally[tally.length-2].sum < 0)) {
		let first = tally[0];
		let last = tally[tally.length-1];
		if (first.sum > last.sum*-1){
			transfers.push({from: last.member_id, to: first.member_id, amount: last.sum});
			first.sum += last.sum;
			tally.pop();
		} else if (first.sum < last.sum*-1){
			transfers.push({from: last.member_id, to: first.member_id, amount: first.sum});
			last.sum += first.sum;
			tally.shift();
		} else {
			transfers.push({from: last.member_id, to: first.member_id, amount: first.sum});
			tally.shift();
			tally.pop();
		}
		tally = tally.sort(sortingFn);
	}

	// Distribute the rest
	if (tally.length === 2) {
		transfers.push({from:tally[1].member_id, to: tally[0].member_id, amount: tally[0].sum});
	}
	
	else if (tally.length > 2) {
		if (tally[1].sum < 0) {
			for (let i = 1; i < tally.length; i++){
				transfers.push({from: tally[i].member_id, to: tally[0].member_id, amount: tally[i].sum});
			}
		}
		else {
			for (let i = 0; i < tally.length-1; i++){
				transfers.push({from: tally[tally.length-1].member_id, to: tally[i].member_id, amount: tally[i].sum});
			}
		}
	}
	
	async.map(transfers, function(item, callback){
		item.amount = Math.abs(item.amount);
		callback(null, item);
	}, function(err, results){
		print(results);
		res.locals.transfers = results;
		next();
	});
});

/* Send back all initial data */
app.post('/secure/initialize', function(req, res, next) {
	res.send({members: res.locals.members, transactions: res.locals.transactions, transfers: res.locals.transfers});
});

/* Add Member */
app.post('/secure/addMember', function(req,res,next){
	if (!req.body.name) {
		let err = new Error('No name supplied').status = 400;
		return next(err);
	}
		
	conn.query(`INSERT INTO members (user_id, name) VALUES ('${res.locals.decoded.user_id}', '${req.body.name}'`, function(err){
		if (err) {
			let err = new Error('Error adding member').status = 500;
			return next(err)
		}
		res.send();
	});
});

/* Add Transaction */
app.post('/secure/addTransaction', function(req, res, next) {
	
});

app.use(function(err, req, res, next){
	console.log(err.message);
	print(err);
	res.status(err.status || 500).send(err.message);
});

const port = 3000;
app.listen(port, 'localhost', function(){
	console.log('Server started at ' + port);
});

function print(text){
	console.log(JSON.stringify(text));
}
