var express = require('express');
var router = express.Router();
var passport = require('passport');

//import proyecto model
var Proyecto = require('../models/proyecto');

module.exports = function(passport){


	router.get('/proyectos', function(req, res){
		
		Proyecto.find(function(err, proyectos){
			if(err)
				res.send(err);
			res.json(proyectos);

		});
	});

	router.post('/proyectos', function(req, res){

		var newProyecto = new Proyecto();
		newProyecto.name = req.body.name;

		newProyecto.save(function(err){
			if (err)
				res.send(err);

			res.json({message: 'proyecto created!'});
		});
	});

	router.get('/proyectos/:id', function (req, res){
		Proyecto.findById(req.params.id, function(err, proyecto){
			if (err)
				res.send(err);
			res.json(proyecto);
		});
	});

	return router;
};

