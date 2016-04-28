var express = require('express');
var router = express.Router();
var passport = require('passport');

//import proyecto model
var Proyecto = require('../models/proyecto');

module.exports = function(passport){


	router.get('/proyectos', function(req, res){
		Proyecto.find({}).
			sort('-createdAt').
			exec(function(err, proyectos){
			if(err)
				res.send(err);
			console.log('at the project list page');
			res.render('existing', {proyectos: proyectos});
		});

	});

	//for create project button:
	router.post('/proyectos', function(req, res){

		var newProyecto = new Proyecto();
		newProyecto.name = req.body.name;
		newProyecto.cliente = req.body.cliente;
		newProyecto.location=  req.body.location;
		newProyecto.asesor = req.body.asesor;

		newProyecto.save(function(err){
			if (err)
				res.send(err);
			req.session.sessionFlash = {
				type: 'success',
				message: 'Nuevo proyecto creado!'
			};
			res.redirect(303, '/api/proyectos/' + newProyecto._id);
		});
	});


	router.get('/proyectos/:id', function (req, res){
		Proyecto.findById(req.params.id, function(err, proyecto){
			if (err)
				res.send(err);
			res.render('proView', {proyecto: proyecto, user_email: req.session.email});
		});
	});



	// router.put('/proyectos/:id', function(req, res){
	// 	Proyecto.findById(req.params.id, function(err, proyecto){
	// 		if (err)
	// 			res.send(err);
	// 		proyecto.name = req.body.name;

	// 		//save proyecto
	// 		proyecto.save(function(err){
	// 			if (err)
	// 				res.send (err);
	// 			res.json({message: 'Bear updated!'});
	// 		});

	// 	});
	// });

	router.delete('/proyectos/:id', function(req, res){
		Proyecto.remove({_id: req.params.id}, function(err, proyecto){
			if(err)
				res.send(err);
			console.log('delete request received!')
			res.send('/api/proyectos')
		});
	});
	
	router.get('/proyectos/:id/peso', function(req, res){
		Proyecto.findById(req.params.id, function(err, proyecto){
			if (err)
				res.send(err)
			console.log('project found for peso calc, ' + proyecto);
			res.render('peso', {proyecto: proyecto});
		});
	});

	router.get('/proyectos/:id/cortina', function(req, res){
		Proyecto.findById(req.params.id, function(err, proyecto){
			if (err)
				res.send(err)
			res.render('cortina', {proyecto: proyecto});
		});
	});

	// router.post('/proyectos/:id/peso', function(req, res){
	// 	Proyecto.findById(req.params.id, function(err, proyecto){
	// 		if (err)
	// 			res.send(err);
	// 		console.log('peso saved to project! ' + proyecto);
	// 		proyecto.porton = req.body.model;
	// 		proyecto.portonNo = req.body.modelNo;

	// 		proyecto.save(function(err){
	// 			if (err)
	// 				res.send(err)
	// 			console.log('porton data saved!');
	// 			res.render('proView', {proyecto: proyecto});
	// 		});
	// 	});
	// });


	return router;
};

