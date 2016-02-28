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
			// res.json(proyectos.map(function(proyecto){
			// 	return {
			// 		name: proyecto.name
			// 	}
			// }));
			res.render('existing', {proyectos: proyectos});
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

	router.put('/proyectos/:id', function(req, res){
		Proyecto.findById(req.params.id, function(err, proyecto){
			if (err)
				res.send(err);
			proyecto.name = req.body.name;

			//save proyecto
			proyecto.save(function(err){
				if (err)
					res.send (err);
				res.json({message: 'Bear updated!'});
			});

		});
	});

	router.delete('/proyectos/:id', function(req, res){
		Proyecto.remove({_id: req.params.bear_id}, function(err, proyecto){
			if(err)
				res.send(err);
			res.json({message: 'Successfully deleted'});
		});
	});

	return router;
};

