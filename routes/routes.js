var express = require('express');
var router = express.Router();
var passport = require('passport');
var fs = require('fs');
var PDFDocument = require('pdfkit');

var sendgrid = require('sendgrid')(process.env.SENDGRID_API);

var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var options = {
	auth: {
		api_key: process.env.SENDGRID_API
	}
}
var mailer = nodemailer.createTransport(sgTransport(options));


var AWS = require('aws-sdk');
AWS.config.update({accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY});
AWS.config.update({region: 'us-west-2'});
var s3 = new AWS.S3();


//import models
var Porton = require('../models/porton');
var Proyecto = require('../models/proyecto');


//route middleware to make sure user is Authenticated
var verified = function(req, res, next) {
	if(req.isAuthenticated())
		return next();
	res.redirect('/');
};

module.exports = function(passport) {

	router.get('/start', verified, function(req, res){
		res.render('start');
	});

	router.get('/create', function(req, res){
		res.render('create');
	});

	router.get('/home', verified, function(req, res) {
	  res.render('home');
	});

	router.get('/', function(req, res) {
	  res.render('index', {alertMessage: req.flash('loginMessage')});
	});

	router.post('/login', passport.authenticate('local-login', {
		successRedirect: '/start',
		failureRedirect: '/',
		failureFlash: true
	}));

	router.get('/signup', function(req, res) {
		res.render('signup', {alertMessage: req.flash('signupMessage')});
	});

	router.post('/signup', passport.authenticate('local-signup', {
		successRedirect: '/start',
		failureRedirect: '/signup',
		failureFlash: true 
	}));

	router.get('/logout', function(req, res){
		req.logout();
		res.redirect('/');
	});

	router.get('/motor', verified, function(req, res) {
	  res.render('motor');
	});

	router.get('/acceso', verified, function(req, res) {
	  res.render('acceso');
	});

	router.get('/peso', verified, function(req, res){
		res.render('peso');
	});

	router.post('/peso', verified, function(req, res) {
		if(req.xhr || req.accepts('json,html')==='json'){
			
			var portonQuery = Porton.findOne({model: req.body.portonModel}).exec();

			portonQuery.then(function(porton){
					var peso = porton.peso
					return peso;
				})
				.then(function(peso){
					res.json({success: true, alto: req.body.alto, ancho: req.body.ancho, peso: peso});
				})
				.catch(function(e){
					console.log(e);
				});

		} else {
			res.redirect(303, '/peso');
		}
	});

	router.get('/encuestas', verified, function(req, res) {
	  res.render('encuestas');
	});

	router.get('/cliente', verified, function(req, res) {
	  res.render('cliente');
	});

		//peso report - pdf generator
	router.post('/pdf', function(req, res){
		
		//retrieve report data		
		Proyecto.findById(req.body.id, function(err, proyecto){
			if (err)
				res.send(err);
			return proyecto;
		})
		.then(function(proyecto){
			
			//pdfKit
			var doc = new PDFDocument({
				size: 'letter'
			});
			
			doc.image('./public/img/accesoslogo.png', 380, 30, {width: 200});
			doc.font('Helvetica');
			doc.fontSize(14);
				
			doc.text('Date: ', 65, 180)
				.moveDown();

			doc.text('Proyecto nombre: ' + proyecto.name)
				.moveDown();

			doc.text('Location: ' + proyecto.location)
				.moveDown();

			doc.text('Client: ')
				.moveDown();
			doc.text('E-mail: ');
			doc.text('Peso total aproximado: ', 160, 400)
				.moveDown()
				.text('Diseño seleccionado: ');
			doc.text('Ancho: ', 200, 600)
				.moveDown();
			doc.text('Alto: ');

			doc.moveTo(35, 350)
				.lineTo(577, 350);

			doc.moveTo(35, 490)
				.lineTo(577, 490);

			doc.lineWidth(.5)
				.roundedRect(35, 120, 542, 640, 5)
				.stroke();

			doc.end();

			var params = {
				Key: proyecto.name + '.pdf',
				Body: doc,
				Bucket: 'accesos-app',
				ContentType: 'application/pdf'
			}

			s3.upload(params, function(err, data){
				if (err)
					console.log(err);
				else
					console.log('succesfully uploaded to data to S3')
			});

			console.log('PDF created!');

		});
			



// nodemailer attempt
		// .then(function(){
			
		// 	toArray(stream, function(err, arr){
		// 		var buffer = new Buffer.concat(arr);
		// 		var email = {
		// 			to: 'jeffreyrhuang@gmail.com',
		// 			from: 'nodemailer@accesos.xyz',
		// 			subject: 'Please work',
		// 			text: 'Check out this pdf',
		// 			attachments: [{
		// 				filename: 'test.pdf',
		// 				content: buffer,
		// 				contentType: 'application/pdf'
		// 			}]
		// 		}
		// 	})
		// 	.then(function(email){
		// 		mailer.sendMail(email, function(err, res){
		// 			if (err){
		// 				console.log(err);
		// 			}
		// 			console.log(res);
		// 		});
		// 	});
		// });



//didn't work - produces unreadable pdf		
		// .then(function(){
		// 	fs.readFile('./public/img/test.pdf', function(err, data){
		// 		var email = new sendgrid.Email();

		// 		email.addTo 	('jeffreyrhuang@gmail.com');
		// 		email.setFrom('do-not-reply@accesos.xyz');
		// 		email.setSubject('Peso Report');
		// 		email.setText('Come on Pelican!');
		// 		email.addFile({
		// 			filename: 'test.pdf',
		// 			content: data
		// 		});

		// 		sendgrid.send(email, function(err, json){
		// 			if(err) {return console.error(err);}
		// 			console.log(json);
		// 		})
		// 	});
		// });


		//best attempt so far - can work, but rarely
		//Send Email via Sendgrid
		// .then(function(proyecto){

		// 	var email = new sendgrid.Email();

		// 	email.addTo 	('jeffreyrhuang@gmail.com');
		// 	email.setFrom('do-not-reply@accesos.xyz');
		// 	email.setSubject('Peso Report');
		// 	email.setText('Come on Pelican!');
		// 	email.addFile({
		// 		filename: 'test.pdf',
		// 		path: './public/img/test.pdf'
		// 	});

		// 	sendgrid.send(email, function(err, json){
		// 		if(err) {return console.error(err);}
		// 		console.log(json);
		// 	})
		// })	
		// .catch(function(e){
		// 	console.log(e);
		// });



	});


	return router;

};

