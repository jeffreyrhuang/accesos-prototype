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

//validation:
var util = require('util');

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
	
//save cortina spec to project	
	router.post('/saveCortina', function(req, res) {

		Proyecto.findById(req.body._id, function(err, proyecto) {
			if(err)
				res.send(err);

			//Server-side form validation
			req.checkBody('cor_a', 'Must be a number').isInt();
			req.checkBody('cor_h', 'Must be a number').isInt();

			var valErrors = req.validationErrors();
			if (valErrors) {
				req.session.sessionFlash = {
					type: 'danger',
					message: 'Form validation errors: ' + util.inspect(valErrors)
				}
				res.redirect(303, '/api/proyectos/' + proyecto._id + '/cortina');
			} else {

				var cortinaSaved = {
					cor_a: req.body.cor_a,
					cor_h: req.body.cor_h,
					cor_ci:  req.body.cor_ci,
					cor_ce: req.body.cor_ce,
					cor_li: req.body.cor_li,
					cor_ld: req.body.cor_ld,
					cor_p: req.body.cor_p,
					cor_ss: req.body.cor_ss,
					cor_sc: req.body.cor_sc,
					cor_si: req.body.cor_si,
					cor_b: req.body.cor_b,
					cor_ti: req.body.cor_ti,
					cor_td: req.body.cor_td,
					cor_di: req.body.cor_di,
					cor_dd: req.body.cor_dd,
					cor_ciclos: req.body.cor_ciclos,
					cor_horas: req.body.cor_horas,
					cor_tipo_guia: req.body.cor_tipo_guia,
					cor_ojos: req.body.cor_ojos,
					cor_color_herr: req.body.cor_color_herr,
					cor_co_izq: req.body.cor_co_izq,
					cor_col_der: req.body.cor_col_der,
					cor_carg_sup: req.body.cor_carg_sup,
					cor_guia_des: req.body.cor_guia_des,
					cor_perfil_pri: req.body.cor_perfil_pri,
					cor_perfil_sec: req.body.cor_perfil_sec,
					cor_color_ext: req.body.cor_color_ext,
					cor_color_int: req.body.cor_color_int,
					cor_cob_color: req.body.cor_cob_color
				}
				proyecto.cortina = cortinaSaved

				proyecto.save(function(err, proyecto) {
					if (err)
						res.send(err)
					req.session.sessionFlash = {
						type: 'success',
						message: 'Cortina specifications saved!'
					}
					console.log(proyecto.cortina.cor_a);
				}).then(function(proyecto){
					console.log(proyecto);
					res.redirect(303, '/api/proyectos/' + proyecto._id);
				})
				.catch(function(e){
					console.log(e);
				});


			} //end of validation else clause
		});
	});


	router.get('/encuestas', verified, function(req, res) {
	  res.render('encuestas');
	});

	router.get('/cliente', verified, function(req, res) {
	  res.render('cliente');
	});

		//peso report - pdf generator
		//EMAIL PESO REPORT
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

				req.session.sessionFlash = {
					type: 'success',
					message: 'E-mail enviado!'
				};

				res.redirect(303, '/api/proyectos/' + proyecto._id);
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

	//CORTINA PDF - OPEN
	router.post('/cortina-open', function(req, res){
		Proyecto.findById(req.body.id, function(err, proyecto){
			if (err)
				res.send(err);
			return proyecto;
		})
		.then(function(proyecto){

			var doc = new PDFDocument({
				size: 'letter',
				layout: 'landscape',
				margin: 0
			});
			
			doc.pipe(res);

			doc.image('./public/img/accesoslogo.png', 664, 25, {width: 100});
			doc.image('./public/img/cortina-main.png', 332, 63, {width: 443});
			doc.image('./public/img/cortina-box4.png', 56, 491, {width: 108});

			//text headings
			doc.font('Helvetica-Bold')
				.fontSize(12)
				.text('Cliente:', 26, 43)
				.text('Ubicación (ID):', 252, 43)
				.text('Fecha:', 513, 23)
				.text('No. orden:', 513, 42)
				.text('1. Dimensiones en cm', 24, 87)
				.text('2. Herraje Principal', 24, 219)
				.text('3. Tipo de Lámina', 24, 361)
				.text('4. Cobertor', 24, 449)
				.text('5. Accesorios', 224, 361);

			//Signature headings
			 doc.font('Helvetica-Bold')
				.fontSize(10)
				.text('Nombre VENDEDOR', 24, 549)
				.text('Firma VENDEDOR', 224, 549)
				.text('Nombre SUPERVISOR', 340, 549)
				.text('V\xB0B\xB0 SUPERVISOR', 513, 549);

			//Report title
			//make this font oblique?
			doc.font('Helvetica-Bold')
				.fontSize(13)
				.text('SUBMITTAL CORTINA (ES) 1 de 2', 176, 21, {underline: true});

			//Regular text
			doc.font('Helvetica')
				.fontSize(11)
				.text('**Cree una hoja separada para cada puerta si existe CUALQUIER diferencia**', 24, 64)
				.text('Cantidad: ____', 427, 64)
				//box 1a
				.text('A', 31, 105, {lineGap: 1.5})
				.text('H', {lineGap: 1.5})
				.text('CI', {lineGap: 1.5})
				.text('CE', {lineGap: 1.5})
				.text('Li', {lineGap: 1.5})
				.text('Ld', {lineGap: 1.5})
				.text('P', {lineGap: 1.5})
				.text('ancho buque', 95, 105, {lineGap: 1.5})
				.text('alto buque', {lineGap: 1.5})
				.text('cargador superior interno', {lineGap: 1.5})
				.text('cargador superior externo', {lineGap: 1.5})
				.text('espacio lateral izquierdo', {lineGap: 1.5})
				.text('espacio laterla derecho', {lineGap: 1.5})
				.text('profundidad cielo', {lineGap: 1.5})
				//box 1b
				.text('SS', 291, 91, {lineGap: 1.5})
				.text('SC', {lineGap: 1.5})
				.text('SI', {lineGap: 1.5})
				.text('B', {lineGap: 1.5})
				.text('Ti', {lineGap: 1.5})
				.text('Td', {lineGap: 1.5})
				.text('Di', {lineGap: 1.5})
				.text('Dd', {lineGap: 1.5})
				.text('lámina principal superior', 355, 90, {lineGap: 1.5})
				.text('lámina secundaria', {lineGap: 1.5})
				.text('lámina principal inferior', {lineGap: 1.5})
				.text('ancho final libre', {lineGap: 1.5})
				.text('tubo a agregar izquierda', {lineGap: 1.5})
				.text('tubo a agregar derecha', {lineGap: 1.5})
				.text('desnivel izquierdo', {lineGap: 1.5})
				.text('desnivel derecho', {lineGap: 1.5})
				//box 2
				.text('Ciclos por hora:', 31, 237, {lineGap: 1.5})
				.text('Horas de uso:' , {lineGap: 1.5, indent: 20})
				.text('Tipo de Guía:', {lineGap: 1.5})
				.text('Color de Herraje:', {lineGap: 1.5})
				.text('Columna izquierda:', {lineGap: 1.5})
				.text('Columna derecha:', {lineGap: 1.5})
				.text('Cargado superior:', {lineGap: 1.5})
				.text('Guía desmontable:', {lineGap: 1.5})
				.text('Ojos fijación:', 190, 268, {lineGap: 1.5})
				//box 3
				.text('Principal:', 31, 379, {lineGap: 1.5})
				.text('Secund:', {lineGap: 1.5})
				.text('Color exterior:', {lineGap: 1.5})
				.text('Color interior:', {lineGap: 1.5})
				//box 4
				.text('no lleva', 58, 468)
				//box 5
				.text('Catalina', 237, 383, {lineGap: 1.5})
				.text('Gancho p bajar', {lineGap: 1.5})
				.text('Ojos de candado', {lineGap: 1.5})
				.text('Cerradura central', {lineGap: 1.5})
				.text('Mirilla', {lineGap: 1.5})
				.text('Hule inferior (std.)', {lineGap: 1.5})
				.text('Sello lateral (opc.)', {lineGap: 1.5})
				.text('____________', {lineGap: 1.5})
				.text('____________', {lineGap: 1.5})
				.text('____________', {lineGap: 1.5})
				.text('____________', {lineGap: 1.5});

			
			//test number
			doc.text('88', 353, 370);

			//radio circles
			doc.circle(345, 247, 7)
				.circle(490, 247, 7)
				.circle(555, 208, 7)
				.circle(555, 152, 7)
				.circle(555, 98, 7)
				.circle(752, 98, 7)
				.circle(752, 152, 7)
				.circle(752, 208, 7)
				.circle(680, 302, 7)
				.circle(615, 302, 7)

				.circle(42, 473, 7)
				.circle(38, 510, 7)
				.circle(178, 510, 7)
				//molding
				.circle(362, 484, 7)
				.circle(398, 484, 7)
				.circle(433, 484, 7)
				.circle(467, 484, 7)
				.circle(513, 484, 7)
				.stroke();
			
			//checkboxes
			doc.rect(223, 384, 7, 7)
				.rect(223, 398, 7, 7)
				.rect(223, 412, 7, 7)
				.rect(223, 426, 7, 7)
				.rect(223, 440, 7, 7)
				.rect(223, 454, 7, 7)
				.rect(223, 468, 7, 7)

				.stroke();
				

			//grid lines
			doc.lineWidth(.5)
				.rect(18, 18, 756, 576)
				.stroke();

			doc.moveTo(18, 545)
				.lineTo(774, 545)
				
				.moveTo(18, 82)
				.lineTo(528, 82)
				
				.moveTo(528, 82)
				.lineTo(528, 213)
				
				.moveTo(528, 213)
				.lineTo(18, 213)
		
				.moveTo(332, 213)
				.lineTo(332, 594)
			
				.moveTo(18, 356)
				.lineTo(332, 356)
			
				.moveTo(18, 445)
				.lineTo(216, 445)
				
				.moveTo(216, 356)
				.lineTo(216, 594)
				
				.moveTo(508, 38)
				.lineTo(650, 38)
				
				.moveTo(508, 18)
				.lineTo(508, 58)
				
				.moveTo(650, 18)
				.lineTo(650, 58)

				.moveTo(508, 58)
				.lineTo(650, 58)

				.moveTo(505, 545)
				.lineTo(505, 594)

				.moveTo(272, 82)
				.lineTo(272, 213)
				.stroke();
			
			// PAGE 2
			doc.addPage();

			doc.image('./public/img/accesoslogo.png', 664, 25, {width: 100});
			doc.image('./public/img/cortina-box6.png', 31, 145, {width: 195});
			doc.image('./public/img/cortina-box7.png', 266, 63, {width: 140});
			doc.image('./public/img/cortina-box12.png', 281, 376, {width: 143});
			doc.image('./public/img/cortina-box14-L.png',427, 79, {width: 148}); 
			doc.image('./public/img/cortina-box15-L.png', 581, 82, {width: 191});
			
			//Report title
			//make this font oblique?
			doc.font('Helvetica-Bold')
				.fontSize(13)
				.text('SUBMITTAL CORTINA (ES) 1 de 2', 176, 21, {underline: true});

			//text headings
			doc.font('Helvetica-Bold')
				.fontSize(12)
				.text('Fecha:', 513, 23)
				.text('No. orden:', 513, 42)
				.text('6. Automatización', 24, 46)
				.text('7. Posición Motor o Catalina', 251, 46)
				.text('8. Medios de Activatión', 251, 190)
				.text('9. Sensor, Cuadro y Botonera (a máx 3m)', 24, 288)
				.text('10. Desinstalar', 24, 387)
				.text('11. Herramienta y Equipo Especial', 24, 423)
				.text('12. Rollo oculto -', 278, 288)
				.text('13. Fotos en Publica', 278, 515)
				.text('14. Puerta Independiente', 431, 62)
				.text('15. Segmentar', 591, 63)
				.text('16. Dibujos y Comentarios', 431, 278)
				.text('17. Condición Submital', 431, 479);

			//Signature headings
			doc.font('Helvetica-Bold')
				.fontSize(10)
				.text('Nombre VENDEDOR', 24, 549)
				.text('Firma VENDEDOR', 224, 549)
				.text('Nombre SUPERVISOR', 340, 549)
				.text('V\xB0B\xB0 SUPERVISOR', 513, 549);

			//Regular text
			doc.font('Helvetica')
				.fontSize(11)
				//box 6
				.text('Modelo de motor', 31, 64, {lineGap: 1.5})
				.text('Cuadro de control', {lineGap: 1.5})
				.text('Sensor infrarojo', {lineGap: 1.5})
				.text('Banda sensible', {lineGap: 1.5})
				.text('Cobertor motor', {lineGap: 1.5})
				//box 8
				.text('Botonera', 253, 210, {lineGap: 1.5})
				.text('Selector de llave', {lineGap: 1.5})
				.text('Receptor remotos', {lineGap: 1.5})
				.text('Controles remotos', {lineGap: 1.5})
				.text('Botonera código', {lineGap: 1.5})
				//box 9
				.text('    Total: Accesos entuba y cablea', 32, 306, {lineGap: 1.5})
				.text('    Básico: Accesos cablea/tubos cliente', {lineGap: 1.5})
				.text('    Mínimo: Cliente cablea 100%', {lineGap: 1.5})
				.text('Voltaje       a cargo        ', {lineGap: 1.5})
				.text('Cableados botoneras por', {lineGap: 1.5})
				//box 10
				.text('por parte de', 40, 403)
				//box 11
				.text('Herramienta certificada', 47, 442, {lineGap: 1.5})
				.text('Andamios - Escalera extensión', {lineGap: 1.5})
				.text('Montacargas', {lineGap: 1.5})
				.text('Polainas, petos, guantes', {lineGap: 1.5})
				.text('Conos y cinta de seguridad', {lineGap: 1.5})
				.text('Vehículo 4x4', {lineGap: 1.5})
				.text('Extintor                Candado de breaker', {lineGap: 1.5})
				//box 12
				.text('"Offset"', 378, 289)
				.text('         más alto de viga', 280, 303, {lineGap: 1.5})
				.text('Registro en cielo razo por', {lineGap: 1.5})
				.text('parte de', {lineGap: 1.5})
				.text('Nota: registro debe ser de', {lineGap: 1.5})
				.text('lado a lado', {lineGap: 1.5})
				//box 13
				.text('Fotos listas', 298, 532)
				//box 14
				.text('Puerta abre', 431, 230, {lineGap: 1.5})
				.text('Cerradura', {lineGap: 1.5})
				.text('Cierrapuertas', {lineGap: 1.5})
				//box 17
				.text('Aprobado', 451, 496, {lineGap: 1.5})
				.text('Aprobado c/ notas', {lineGap: 1.5})
				.text('Rechazado', {lineGap: 1.5})

			//radio circles
			doc.circle(48, 170, 7)
				.circle(149, 170, 7)
				.circle(114, 272, 7)

				.circle(262, 75, 7)
				.circle(411, 68, 7)
				.circle(260, 173, 7)
				.circle(408, 173, 7)

				.circle(440, 220, 7)
				.circle(564, 220, 7)

				.circle(619, 238, 6)
				.circle(743, 238, 6)

				.stroke();
			
			//checkboxes
			doc.rect(30, 307, 7, 7)
				.rect(30, 321, 7, 7)
				.rect(30, 335, 7, 7)

				.rect(30, 443, 7, 7)
				.rect(30, 457, 7, 7)
				.rect(30, 471, 7, 7)
				.rect(30, 485, 7, 7)
				.rect(30, 499, 7, 7)
				.rect(30, 513, 7, 7)
				.rect(30, 528, 7, 7)
				.rect(122, 528, 7, 7)

				.rect(283, 532, 7, 7)

				.rect(435, 497, 7, 7)
				.rect(435, 511, 7, 7)
				.rect(435, 525, 7, 7)

				.stroke();


			//grid lines
			doc.lineWidth(.5)
				.rect(18, 18, 756, 576)
				.stroke();

			doc.moveTo(18, 545)
				.lineTo(774, 545)

				.moveTo(216, 545)
				.lineTo(216, 594)

				.moveTo(332, 545)
				.lineTo(332, 594)

				.moveTo(505, 545)
				.lineTo(505, 594)

				.moveTo(508, 38)
				.lineTo(650, 38)
				
				.moveTo(508, 18)
				.lineTo(508, 58)
				
				.moveTo(650, 18)
				.lineTo(650, 58)

				//middle divider
				.moveTo(424, 42)
				.lineTo(424, 545)

				.moveTo(18, 42)
				.lineTo(424, 42)
				
				.moveTo(424, 58)
				.lineTo(774, 58)
				
				.moveTo(18, 285)
				.lineTo(424, 285)

				.moveTo(18, 384)
				.lineTo(270, 384)

				.moveTo(18, 420)
				.lineTo(270, 420)

				.moveTo(270, 285)
				.lineTo(270, 545)

				.moveTo(270, 512)
				.lineTo(424, 512)

				.moveTo(424, 273)
				.lineTo(774, 273)

				.moveTo(582, 58)
				.lineTo(582, 273)

				.moveTo(243, 187)
				.lineTo(424, 187)

				.moveTo(243, 187)
				.lineTo(243, 285)

				.moveTo(424, 475)
				.lineTo(774, 475)

				.stroke();



			doc.end();
		});
	});


	return router;
};

