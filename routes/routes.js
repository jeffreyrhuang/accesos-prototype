var express = require('express');
var router = express.Router();
var passport = require('passport');
var fs = require('fs');
var PDFDocument = require('pdfkit');
var sendgrid = require('sendgrid')(process.env.SENDGRID_API);
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

	router.get('/create', verified, function(req, res){
		console.log(req.session);  //testing session variable
		res.render('create');
	});

	router.get('/home', function(req, res) {
	  res.render('home');
	});

	router.get('/', function(req, res) {
	  res.render('index', {alertMessage: req.flash('loginMessage')});
	});

	router.post('/login', passport.authenticate('local-login', {
		successRedirect: '/api/proyectos',
		failureRedirect: '/',
		failureFlash: true
	}));

	router.get('/signup', function(req, res) {
		res.render('signup', {alertMessage: req.flash('signupMessage')});
	});

	router.post('/signup', passport.authenticate('local-signup', {
		successRedirect: '/api/proyectos',
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

//AJAX for peso calc
	router.post('/peso', verified, function(req, res) {
		if(req.xhr || req.accepts('json,html')==='json'){
			
			var portonQuery = Porton.findOne({model: req.body.portonModel}).exec();

			portonQuery.then(function(porton){

					var info = {
						peso: porton.peso,
						portonNo: porton.modelNo
					}
					return info
				})
				.then(function(info){
					res.json({success: true, alto: req.body.alto, ancho: req.body.ancho, peso: info.peso, portonModel: req.body.portonModel, portonNo: info.portonNo});
				})
				.catch(function(e){
					console.log(e);
				});

		} else {
			res.redirect(303, '/peso');
		}
	});

//save peso data to project
	router.post('/savePeso', function(req, res){
		Proyecto.findById(req.body.pesoProjectId, function(err, proyecto){
			if (err)
				res.send(err);
			proyecto.porton = req.body.portonSaved;
			proyecto.portonNo = req.body.portonNoSaved;
			proyecto.peso = req.body.pesoSaved;
			proyecto.alto = req.body.altoSaved;
			proyecto.ancho = req.body.anchoSaved;

			proyecto.save(function(err, proyecto){
				if (err)
					res.send(err)
				req.session.sessionFlash = {
					type: 'success',
					message: 'Nueva información añadida!'
				};
			})
			.then(function(proyecto){
				res.redirect(303, '/api/proyectos/' + proyecto._id);
			})
			.catch(function(e){
				console.log(e);
			});
		});
	});


	router.get('/encuestas', verified, function(req, res) {
	  res.render('encuestas');
	});

	router.get('/cliente', verified, function(req, res) {
	  res.render('cliente');
	});

		//peso report - pdf generator
		//EMAIL PDF REPORT
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
				
			doc.text('Fecha: ' + proyecto.createdAt, 65, 180)
				.moveDown();

			doc.text('Proyecto nombre: ' + proyecto.name)
				.moveDown();

			doc.text('Dirección: ' + proyecto.location)
				.moveDown();

			doc.text('Cliente: ' + proyecto.cliente)
				.moveDown();
			doc.text('E-mail: ');
			doc.text('Peso total aproximado:  ' + proyecto.peso + ' kg', 160, 400)
				.moveDown()
				.text('Diseño seleccionado:  ' + proyecto.portonNo + ' ' + proyecto.porton);

			doc.text('Ancho: ' + proyecto.ancho + ' cm', 220, 525);

			doc.text('Alto: ' + proyecto.alto + ' cm', 430, 640);

			doc.moveTo(35, 350)
				.lineTo(577, 350);

			doc.moveTo(35, 490)
				.lineTo(577, 490);

			doc.lineWidth(.5)
				.roundedRect(35, 120, 542, 640, 5)
				.stroke();

			doc.lineWidth(.5)
				.rect(150, 560, 260, 160)
				.fillAndStroke("white", "gray");

			doc.end();
			console.log('PDF ready for email!');
			
			//attach pdf to email and send
			var email = new sendgrid.Email();

			email.addTo 			(req.body.toEmail);
			email.setFrom 		('accesos-app@accesos.xyz');
			email.setSubject 	('Reporte de Peso');
			email.setText 		('PDF reporte adjunto');
			email.addFile 		({
				filename: proyecto.name + '-reporte-peso.pdf',
				content: doc,
				contentType: 'application/pdf'
			});

			sendgrid.send(email, function(err, json){
				if(err) {return console.error(err);}
				console.log(json);
				res.render('proView', {proyecto: proyecto});
			})
		})	
		.catch(function(e){
			console.log(e);
		});
	});

	//OPEN Peso Report
	router.post('/openPdf', function(req, res){
		
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

			doc.pipe(res);

			doc.image('./public/img/accesoslogo.png', 380, 30, {width: 200});
			doc.font('Helvetica');
			doc.fontSize(14);
				
			doc.text('Fecha: ' + proyecto.createdAt, 65, 180)
				.moveDown();

			doc.text('Proyecto nombre: ' + proyecto.name)
				.moveDown();

			doc.text('Dirección: ' + proyecto.location)
				.moveDown();

			doc.text('Cliente: ' + proyecto.cliente)
				.moveDown();
			doc.text('E-mail: ');
			doc.text('Peso total aproximado:  ' + proyecto.peso + ' kg', 160, 400)
				.moveDown()
				.text('Diseño seleccionado:  ' + proyecto.portonNo + ' ' + proyecto.porton);

			doc.text('Ancho: ' + proyecto.ancho + ' cm', 220, 525);

			doc.text('Alto: ' + proyecto.alto + ' cm', 430, 640);

			doc.moveTo(35, 350)
				.lineTo(577, 350);

			doc.moveTo(35, 490)
				.lineTo(577, 490);

			doc.lineWidth(.5)
				.roundedRect(35, 120, 542, 640, 5)
				.stroke();

			doc.lineWidth(.5)
				.rect(150, 560, 260, 160)
				.fillAndStroke("white", "gray");

			doc.end();
			console.log('PDF created!');
		});

			// stream upload pdf to s3 (WORKS)
		// 	var params = {
		// 		Key: proyecto.name + '.pdf',
		// 		Body: doc,
		// 		Bucket: 'accesos-app',
		// 		ContentType: 'application/pdf'
		// 	}

		// 	s3.upload(params, function(err, proyecto){
		// 		if (err)
		// 			console.log(err);
		// 		else
		// 			console.log('succesfully uploaded to data to S3')
		// 			return;
		// 	});
		// })
		// .catch(function(e){
		// 	console.log(e);
		// });
			
	});


	return router;
};

