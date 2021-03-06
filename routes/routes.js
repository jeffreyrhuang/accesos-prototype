var express = require('express');
var router = express.Router();
var passport = require('passport');
var fs = require('fs');
var _ = require('lodash/collection');
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
					console.log('peso ajax response working')
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
			proyecto.peso_submitted = req.body.peso_submitted;

			proyecto.save(function(err, proyecto){
				if (err)
					res.send(err)
				req.session.sessionFlash = {
					type: 'success',
					message: 'Peso información añadida!'
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
			//how to make field optional?
			// req.checkBody('cor_a', 'Must be a number').notEmpty().isInt();
			// req.checkBody('cor_h', 'Must be a number').isInt();

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
					cor_main_radio: req.body.cor_main_radio,
					cor_main_radio_instal: req.body.cor_main_radio_instal,
					cor_main_radio_izq: req.body.cor_main_radio_izq,
					cor_main_radio_der: req.body.cor_main_radio_der,
					cor_main_radio_uni: req.body.cor_main_radio_uni,
					//box 2
					cor_ciclos: req.body.cor_ciclos,
					cor_horas: req.body.cor_horas,
					cor_tipo_guia: req.body.cor_tipo_guia,
					cor_ojos: req.body.cor_ojos,
					cor_color_herr: req.body.cor_color_herr,
					cor_col_izq: req.body.cor_col_izq,
					cor_col_der: req.body.cor_col_der,
					cor_carg_sup: req.body.cor_carg_sup,
					cor_guia_des: req.body.cor_guia_des,
					//box 3
					cor_perfil_pri: req.body.cor_perfil_pri,
					cor_perfil_sec: req.body.cor_perfil_sec,
					cor_color_ext: req.body.cor_color_ext,
					cor_color_int: req.body.cor_color_int,
					//box4
					cor_cob_color: req.body.cor_cob_color,
					cor_box4_radio: req.body.cor_box4_radio,
					//box 5
					cor_box5_check: req.body.cor_box5_check,
					cor_accesorio1: req.body.cor_accesorio1,
					cor_accesorio2: req.body.cor_accesorio2,
					cor_accesorio3: req.body.cor_accesorio3,
					//box 6
					cor_mod_motor: req.body.cor_mod_motor,
					cor_caudro: req.body.cor_caudro,
					cor_sensor: req.body.cor_sensor,
					cor_banda: req.body.cor_banda,
					cor_cob_motor: req.body.cor_cob_motor,
					cor_box6_radio: req.body.cor_box6_radio,
					//box 7
					cor_box7_radio: req.body.cor_box7_radio,
					//box 8
					cor_bot: req.body.cor_bot,
					cor_selector: req.body.cor_selector,
					cor_receptor: req.body.cor_receptor,
					cor_controles: req.body.cor_controles,
					cor_bot_cod: req.body.cor_bot_cod,
					//box 9
					cor_box9_radio: req.body.cor_box9_radio,
					cor_volt: req.body.cor_volt,
					cor_volt_carg: req.body.cor_volt_carg,
					cor_cable_carg: req.body.cor_cable_carg,
					//box 10
					cor_des: req.body.cor_des,
					cor_des_carg: req.body.cor_des_carg,
					//box 11
					cor_box11_check: req.body.cor_box11_check,
					cor_monta_carg: req.body.cor_monta_carg,
					//box 12
					cor_offset: req.body.cor_offset,
					cor_rollo_carg: req.body.cor_rollo_carg,
					cor_box12_ci: req.body.cor_box12_ci,
					cor_box12_of: req.body.cor_box12_of,
					cor_box12_p: req.body.cor_box12_p,
					//box 13
					cor_box13_check: req.body.cor_box13_check,
					//box 14
					cor_puerta: req.body.cor_puerta,
					cor_cerradura: req.body.cor_cerradura,
					cor_cierrapu: req.body.cor_cierrapu,
					cor_box14_input1: req.body.cor_box14_input1,
					cor_box14_input2: req.body.cor_box14_input2,
					cor_box14_input3: req.body.cor_box14_input3,
					cor_box14_input4: req.body.cor_box14_input4,
					cor_box14_radio: req.body.cor_box14_radio,
					//box 15
					cor_box15_input1: req.body.cor_box15_input1,
					cor_box15_input2: req.body.cor_box15_input2,
					cor_box15_input3: req.body.cor_box15_input3,
					cor_box15_input4: req.body.cor_box15_input4,
					cor_box15_input5: req.body.cor_box15_input5,
					cor_box15_input6: req.body.cor_box15_input6,
					cor_box15_radio: req.body.cor_box15_radio,
					//box 16
					cor_comentarios: req.body.cor_comentarios,
					//box 17
					cor_box17_radio: req.body.cor_box17_radio,
					cor_notas: req.body.cor_notas
				}
				proyecto.cor_submitted = req.body.cor_submitted
				proyecto.cortina = cortinaSaved

				proyecto.save(function(err, proyecto) {
					if (err)
						res.send(err)
					req.session.sessionFlash = {
						type: 'success',
						message: 'Cortina specifications saved!'
					}
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
				.text('Cliente:   ' + proyecto.cliente, 26, 43)
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
				.text('A', 31, 105)
				.text('H', 31, 120)
				.text('CI', 31, 135)
				.text('CE', 31, 150)
				.text('Li', 31, 165)
				.text('Ld', 31, 180)
				.text('P', 31, 195)

				if (proyecto.cortina.cor_a) 	{ doc.text(proyecto.cortina.cor_a + ' cm', 63, 105) }
				if (proyecto.cortina.cor_h) 	{ doc.text(proyecto.cortina.cor_h + ' cm', 63, 120) }
				if (proyecto.cortina.cor_ci) 	{ doc.text(proyecto.cortina.cor_ci + ' cm', 63, 135) }
				if (proyecto.cortina.cor_ce) 	{ doc.text(proyecto.cortina.cor_ce + ' cm', 63, 150) }
				if (proyecto.cortina.cor_li) 	{ doc.text(proyecto.cortina.cor_li + ' cm', 63, 165) }
				if (proyecto.cortina.cor_ld) 	{ doc.text(proyecto.cortina.cor_ld + ' cm', 63, 180) }
				if (proyecto.cortina.cor_p) 	{ doc.text(proyecto.cortina.cor_p + ' cm', 63, 195) }

				doc.text('ancho buque', 110, 105)
				.text('alto buque', 110, 120)
				.text('cargador superior interno', 110, 135)
				.text('cargador superior externo', 110, 150)
				.text('espacio lateral izquierdo', 110, 165)
				.text('espacio laterla derecho', 110, 180)
				.text('profundidad cielo', 110, 195)

				//box 1b
				.text('SS', 291, 90)
				.text('SC', 291, 105)
				.text('SI', 291, 120)
				.text('B', 291, 135)
				.text('Ti', 291, 150)
				.text('Td', 291, 165)
				.text('Di', 291, 180)
				.text('Dd', 291, 195)

				if (proyecto.cortina.cor_ss) 	{ doc.text(proyecto.cortina.cor_ss + ' cm', 325, 90) };
				if (proyecto.cortina.cor_sc) 	{ doc.text(proyecto.cortina.cor_sc + ' cm', 325, 105) };
				if (proyecto.cortina.cor_si) 	{ doc.text(proyecto.cortina.cor_si + ' cm', 325, 120) };
				if (proyecto.cortina.cor_b) 	{ doc.text(proyecto.cortina.cor_b + ' cm', 325, 135) };
				if (proyecto.cortina.cor_ti) 	{ doc.text(proyecto.cortina.cor_ti + ' cm', 325, 150) };
				if (proyecto.cortina.cor_td) 	{ doc.text(proyecto.cortina.cor_td + ' cm', 325, 165) };
				if (proyecto.cortina.cor_di) 	{ doc.text(proyecto.cortina.cor_di + ' cm', 325, 180) };
				if (proyecto.cortina.cor_dd) 	{ doc.text(proyecto.cortina.cor_dd + ' cm', 325, 195) };

				doc.text('lámina principal superior', 370, 90)
				.text('lámina secundaria', 370, 105)
				.text('lámina principal inferior', 370, 120)
				.text('ancho final libre', 370, 135)
				.text('tubo a agregar izquierda', 370, 150)
				.text('tubo a agregar derecha', 370, 165)
				.text('desnivel izquierdo', 370, 180)
				.text('desnivel derecho', 370, 195)

				//box 2
				.text('Ciclos por hora:   ' + proyecto.cortina.cor_ciclos, 31, 237, {lineGap: 1.5})
				.text('Horas de uso:   ' + proyecto.cortina.cor_horas, {lineGap: 1.5, indent: 20})
				.text('Tipo de Guía:   ' + proyecto.cortina.cor_tipo_guia, {lineGap: 1.5})
				.text('Color de Herraje:   ' + proyecto.cortina.cor_color_herr, {lineGap: 1.5})
				.text('Columna izquierda:   ' + proyecto.cortina.cor_col_izq, {lineGap: 1.5})
				.text('Columna derecha:   ' + proyecto.cortina.cor_col_der, {lineGap: 1.5})
				.text('Cargado superior:   ' + proyecto.cortina.cor_carg_sup, {lineGap: 1.5})
				.text('Guía desmontable:   ' + proyecto.cortina.cor_guia_des, {lineGap: 1.5})
				.text('Ojos fijación:   ' + proyecto.cortina.cor_ojos, 195, 268, {lineGap: 1.5})
				//box 3
				.text('Principal:  ' + proyecto.cortina.cor_perfil_pri, 31, 379, {lineGap: 1.5})
				.text('Secund:   ' + proyecto.cortina.cor_perfil_sec, {lineGap: 1.5})
				.text('Color exterior:   ' + proyecto.cortina.cor_color_ext, {lineGap: 1.5})
				.text('Color interior:   ' + proyecto.cortina.cor_color_int, {lineGap: 1.5})
				//box 4
				.text('no lleva', 58, 468)
				.text(proyecto.cortina.cor_cob_color, 125, 458)
				//box 5
				.text('Catalina', 237, 385)
				.text('Gancho p bajar', 237, 400)
				.text('Ojos de candado', 237, 415)
				.text('Cerradura central', 237, 430)
				.text('Mirilla', 237, 445)
				.text('Hule inferior (std.)', 237, 460)
				.text('Sello lateral (opc.)', 237, 475)
				.text(proyecto.cortina.cor_accesorio1, 237, 490)
				.text(proyecto.cortina.cor_accesorio2, 237, 505)
				.text(proyecto.cortina.cor_accesorio3, 237, 520)

			//radio circles
				//radio - main diagram, instalacion
			doc.circle(345, 247, 7).stroke();
				if (proyecto.cortina.cor_main_radio_instal === 'option1') {
					doc.circle(345, 247, 4)
					.fillAndStroke('#777', 'black');
				}
			doc.circle(490, 247, 7).stroke();
				if (proyecto.cortina.cor_main_radio_instal === 'option2') {
					doc.circle(490, 247, 4)
					.fillAndStroke('#777', 'black');
				}

			// radio - main diagram, izquierda
			doc.circle(555, 98, 7).stroke();
				if (proyecto.cortina.cor_main_radio_izq === 'option1') {
					doc.circle(555, 98, 4)
					.fillAndStroke('#777', 'black');
				}
			doc.circle(555, 152, 7).stroke();
				if (proyecto.cortina.cor_main_radio_izq === 'option2') {
					doc.circle(555, 152, 4)
					.fillAndStroke('#777', 'black');
				}
			doc.circle(555, 208, 7).stroke();
				if (proyecto.cortina.cor_main_radio_izq === 'option3') {
					doc.circle(555, 208, 4)
					.fillAndStroke('#777', 'black');
				}

			// radio- main diagram, derecha
			doc.circle(752, 98, 7).stroke();
				if (proyecto.cortina.cor_main_radio_der === 'option1') {
					doc.circle(752, 98, 4)
					.fillAndStroke('#777', 'black');
				}
			doc.circle(752, 152, 7).stroke();
				if (proyecto.cortina.cor_main_radio_der === 'option2') {
					doc.circle(752, 152, 4)
					.fillAndStroke('#777', 'black');
				}
			doc.circle(752, 208, 7).stroke();
				if (proyecto.cortina.cor_main_radio_der === 'option3') {
					doc.circle(752, 208, 4)
					.fillAndStroke('#777', 'black');
				}

			//radio - uniforme / combinada
			doc.circle(615, 302, 7).stroke();
				if (proyecto.cortina.cor_main_radio_uni === 'option1') {
					doc.circle(615, 302, 4)
					.fillAndStroke('#777', 'black');
				}
			doc.circle(680, 302, 7).stroke();
				if (proyecto.cortina.cor_main_radio_uni === 'option2') {
					doc.circle(680, 302, 4)
					.fillAndStroke('#777', 'black');
				}

			//radio - box 4
			doc.circle(42, 473, 7).stroke();
				if (proyecto.cortina.cor_box4_radio === 'option1') {
					doc.circle(42, 473, 4)
					.fillAndStroke( '#777', 'black');
				}

			doc.circle(38, 510, 7).stroke();
				if (proyecto.cortina.cor_box4_radio === 'option2') {
					doc.circle(38, 510, 4)
					.fillAndStroke( '#777', 'black');
				}

			doc.circle(178, 510, 7).stroke();
				if (proyecto.cortina.cor_box4_radio === 'option3') {
					doc.circle(178, 510, 4)
					.fillAndStroke( '#777', 'black');
				}

			//radio - molding
			doc.circle(362, 484, 7).stroke();
					if (proyecto.cortina.cor_main_radio === 'option1') {
						doc.circle(362, 484, 4)
						.fillAndStroke( '#777', 'black');
					}

			doc.circle(398, 484, 7).stroke();
					if (proyecto.cortina.cor_main_radio === 'option2') {
						doc.circle(398, 484, 4)
						.fillAndStroke( '#777', 'black');
					}

			doc.circle(433, 484, 7).stroke();
				if (proyecto.cortina.cor_main_radio === 'option3') {
						doc.circle(433, 484, 4)
						.fillAndStroke( '#777', 'black');
					}

			doc.circle(467, 484, 7).stroke();
				if (proyecto.cortina.cor_main_radio === 'option4') {
						doc.circle(467, 484, 4)
						.fillAndStroke( '#777', 'black');
					}

			doc.circle(513, 484, 7).stroke();
				if (proyecto.cortina.cor_main_radio === 'option5') {
						doc.circle(513, 484, 4)
						.fillAndStroke( '#777', 'black');
					}
			

			//checkboxes - box 5
			doc.rect(223, 385, 7, 7).stroke();
				if (_.includes(proyecto.cortina.cor_box5_check, 'catalina')) {
					doc.rect(223, 385, 7, 7)
					.fillAndStroke( '#777', 'black');
				}

			doc.rect(223, 400, 7, 7).stroke();
				if (_.includes(proyecto.cortina.cor_box5_check, 'gancho')) {
					doc.rect(223, 400, 7, 7)
					.fillAndStroke( '#777', 'black');
				}

			doc.rect(223, 415, 7, 7).stroke();
				if (_.includes(proyecto.cortina.cor_box5_check, 'ojos')) {
					doc.rect(223, 415, 7, 7)
					.fillAndStroke( '#777', 'black');
				}

			doc.rect(223, 430, 7, 7).stroke();
				if (_.includes(proyecto.cortina.cor_box5_check, 'cerradura')) {
					doc.rect(223, 430, 7, 7)
					.fillAndStroke( '#777', 'black');
				}

			doc.rect(223, 445, 7, 7).stroke();
				if (_.includes(proyecto.cortina.cor_box5_check, 'mirilla')) {
					doc.rect(223, 445, 7, 7)
					.fillAndStroke( '#777', 'black');
				}

			doc.rect(223, 460, 7, 7).stroke();
				if (_.includes(proyecto.cortina.cor_box5_check, 'hule')) {
					doc.rect(223, 460, 7, 7)
					.fillAndStroke( '#777', 'black');
				}

			doc.rect(223, 475, 7, 7).stroke();
				if (_.includes(proyecto.cortina.cor_box5_check,'sello')) {
					doc.rect(223, 475, 7, 7)
					.fillAndStroke( '#777', 'black');
				}
			
			doc.rect(223, 490, 7, 7).stroke();
				if (proyecto.cortina.cor_accesorio1) {
					doc.rect(223, 490, 7, 7)
					.fillAndStroke( '#777', 'black');
				}
			
			doc.rect(223, 505, 7, 7).stroke();
				if (proyecto.cortina.cor_accesorio2) {
					doc.rect(223, 505, 7, 7)
					.fillAndStroke( '#777', 'black');
				}
	
			doc.rect(223, 520, 7, 7).stroke();
				if (proyecto.cortina.cor_accesorio3) {
					doc.rect(223, 520, 7, 7)
					.fillAndStroke( '#777', 'black');
				}


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

			//input backgrounds
			doc.rect(649, 224, 21, 11).fillAndStroke('#d9d9d9');		// A1
			doc.rect(649, 529, 21, 11).fillAndStroke('#d9d9d9');		// A2
			doc.rect(346, 365, 21, 11).fillAndStroke('#d9d9d9');		// H1
			doc.rect(472, 365, 21, 11).fillAndStroke('#d9d9d9');		// H2
			doc.rect(603, 376, 21, 11).fillAndStroke('#d9d9d9');		// H3
			doc.rect(354, 281, 21, 11).fillAndStroke('#d9d9d9');		// CE
			doc.rect(471, 285, 21, 11).fillAndStroke('#d9d9d9');		// CI
			doc.rect(550, 413, 21, 11).fillAndStroke('#d9d9d9');		// LI
			doc.rect(752, 413, 21, 11).fillAndStroke('#d9d9d9');		// LD
			doc.rect(518, 244, 21, 11).fillAndStroke('#d9d9d9');		// P
			doc.rect(667, 321, 21, 11).fillAndStroke('#d9d9d9');		// SS
			doc.rect(667, 371, 21, 11).fillAndStroke('#d9d9d9');		// SC
			doc.rect(665, 421, 21, 11).fillAndStroke('#d9d9d9');		// SI
			doc.rect(652, 138, 21, 11).fillAndStroke('#d9d9d9');		// B
			doc.rect(591, 121, 21, 11).fillAndStroke('#d9d9d9');		// TI
			doc.rect(699, 121, 21, 11).fillAndStroke('#d9d9d9');		// TD
			doc.rect(558, 503, 21, 11).fillAndStroke('#d9d9d9');		// DI
			doc.rect(740, 469, 21, 11).fillAndStroke('#d9d9d9');		// DD

			doc.fillColor('black');

			// main diagram number inputs
			if (proyecto.cortina.cor_a) 	{ doc.text(proyecto.cortina.cor_a, 651, 226) };			// A1
			if (proyecto.cortina.cor_a) 	{ doc.text(proyecto.cortina.cor_a, 651, 531) };			// A2
			if (proyecto.cortina.cor_h) 	{ doc.text(proyecto.cortina.cor_h, 348, 367) }; 		// H1
			if (proyecto.cortina.cor_h) 	{ doc.text(proyecto.cortina.cor_h, 474, 367) };			// H2
			if (proyecto.cortina.cor_h) 	{ doc.text(proyecto.cortina.cor_h, 605, 378) };			// H3
			if (proyecto.cortina.cor_ce) 	{ doc.text(proyecto.cortina.cor_ce, 356, 283) };		// CE
			if (proyecto.cortina.cor_ci) 	{ doc.text(proyecto.cortina.cor_ci, 473, 287) };		// CI
			if (proyecto.cortina.cor_li) 	{ doc.text(proyecto.cortina.cor_li, 552, 415) };		// LI   
			if (proyecto.cortina.cor_ld) 	{ doc.text(proyecto.cortina.cor_ld, 754, 415) };  	// LD
			if (proyecto.cortina.cor_p) 	{ doc.text(proyecto.cortina.cor_p, 520, 246) };			// P   
			if (proyecto.cortina.cor_ss) 	{ doc.text(proyecto.cortina.cor_ss, 668, 323) };		// SS
			if (proyecto.cortina.cor_sc) 	{ doc.text(proyecto.cortina.cor_sc, 668, 373) };		// SC
			if (proyecto.cortina.cor_si) 	{ doc.text(proyecto.cortina.cor_si, 666, 423) };		// SI
			if (proyecto.cortina.cor_b) 	{ doc.text(proyecto.cortina.cor_b, 654, 140) };			// B
			if (proyecto.cortina.cor_ti) 	{ doc.text(proyecto.cortina.cor_ti, 593, 123) };		// TI
			if (proyecto.cortina.cor_td) 	{ doc.text(proyecto.cortina.cor_td, 701, 123) };		// TD
			if (proyecto.cortina.cor_di) 	{ doc.text(proyecto.cortina.cor_di, 560, 505) };		// DI
			if (proyecto.cortina.cor_dd) 	{ doc.text(proyecto.cortina.cor_dd, 742, 471) };		// DD
			
			// PAGE 2
			doc.addPage();

			doc.image('./public/img/accesoslogo.png', 664, 25, {width: 100});
			doc.image('./public/img/cortina-box6.png', 31, 145, {width: 195});
			doc.image('./public/img/cortina-box7.png', 266, 63, {width: 140});
			doc.image('./public/img/cortina-box12.png', 281, 376, {width: 143});
			doc.image('./public/img/cortina-box14-L.png',427, 79, {width: 148}); 
			doc.image('./public/img/cortina-box15-L.png', 583, 82, {width: 191});
			
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
				.text('Modelo de motor:   ' + proyecto.cortina.cor_mod_motor, 31, 64, {lineGap: 1.5})
				.text('Cuadro de control:   ' + proyecto.cortina.cor_caudro, {lineGap: 1.5})
				.text('Sensor infrarojo:   ' + proyecto.cortina.cor_sensor, {lineGap: 1.5})
				.text('Banda sensible:   ' + proyecto.cortina.cor_banda, {lineGap: 1.5})
				.text('Cobertor motor:   ' + proyecto.cortina.cor_cob_motor, {lineGap: 1.5})
				//box 8
				.text('Botonera:  ' + proyecto.cortina.cor_bot, 251, 210, {lineGap: 1.5})
				.text('Selector de llave:  ' + proyecto.cortina.cor_selector, {lineGap: 1.5})
				.text('Receptor remotos:  ' + proyecto.cortina.cor_receptor, {lineGap: 1.5})
				.text('Controles remotos:  ' + proyecto.cortina.cor_controles, {lineGap: 1.5})
				.text('Botonera código:  ' + proyecto.cortina.cor_bot_cod, {lineGap: 1.5})
				//box 9
				.text('    Total: Accesos entuba y cablea', 32, 306, {lineGap: 1.5})
				.text('    Básico: Accesos cablea/tubos cliente', {lineGap: 1.5})
				.text('    Mínimo: Cliente cablea 100%', {lineGap: 3})
				.text('Voltaje  ' + proyecto.cortina.cor_volt + '   a cargo   ' + proyecto.cortina.cor_volt_carg, {lineGap: 1.5})
				.text('Cableados botoneras por   ' + proyecto.cortina.cor_cable_carg, {lineGap: 1.5})
				//box 10
				.text(proyecto.cortina.cor_des, 125, 390)
				.text('por parte de   ' + proyecto.cortina.cor_des_carg, 40, 403)
				//box 11
				.text('Herramienta certificada', 47, 442, {lineGap: 1.5})
				.text('Andamios - Escalera extensión', {lineGap: 1.5})
				.text('Montacargas -      ' + proyecto.cortina.cor_monta_carg, {lineGap: 1.5})
				.text('Polainas, petos, guantes', {lineGap: 1.5})
				.text('Conos y cinta de seguridad', {lineGap: 1.5})
				.text('Vehículo 4x4', {lineGap: 1.5})
				.text('Extintor')
				.text('Candado de breaker', 140, 527)
				//box 12
				.text('"Offset"', 378, 289)
				
				if (proyecto.cortina.cor_offset) 	{ doc.text(proyecto.cortina.cor_offset + ' cm', 280, 303) }

				doc.text('más alto de viga', 318, 303)
				.text('Registro en cielo razo por', 280, 318, {lineGap: 1.5})
				.text('parte de    ' + proyecto.cortina.cor_rollo_carg, {lineGap: 1.5})
				.text('Nota: registro debe ser de', {lineGap: 1.5})
				.text('lado a lado', {lineGap: 1.5})
				//box 13
				.text('Fotos listas', 298, 532)
				//box 14
				.text('Puerta abre:  ' + proyecto.cortina.cor_puerta, 428, 230, {lineGap: 1.5})
				.text('Cerradura:  ' + proyecto.cortina.cor_cerradura, {lineGap: 1.5})
				.text('Cierrapuertas:   ' + proyecto.cortina.cor_cierrapu, {lineGap: 1.5})
				//box 16
				.text(proyecto.cortina.cor_comentarios, 435, 300)
				//box 17
				.text('Aprobado', 462, 498)
				.text('Aprobado c/ notas', 462, 513)
				.text('Rechazado', 462, 528)

			//radio circles
			doc.circle(48, 170, 7).stroke();
				if (proyecto.cortina.cor_box6_radio === 'option1') {
						doc.circle(48, 170, 4)
						.fillAndStroke( '#777', 'black');
				}
			doc.circle(149, 170, 7).stroke();
				if (proyecto.cortina.cor_box6_radio === 'option2') {
						doc.circle(149, 170, 4)
						.fillAndStroke( '#777', 'black');
				}
			doc.circle(114, 272, 7).stroke();
				if (proyecto.cortina.cor_box6_radio === 'option3') {
						doc.circle(114, 272, 4)
						.fillAndStroke( '#777', 'black');
				}

			doc.circle(262, 75, 7).stroke();
				if (proyecto.cortina.cor_box7_radio === 'option1') {
						doc.circle(262, 75, 4)
						.fillAndStroke( '#777', 'black');
				}
			doc.circle(411, 68, 7).stroke();
				if (proyecto.cortina.cor_box7_radio === 'option2') {
						doc.circle(411, 68, 4)
						.fillAndStroke( '#777', 'black');
				}
			doc.circle(408, 173, 7).stroke();
				if (proyecto.cortina.cor_box7_radio === 'option3') {
						doc.circle(408, 173, 4)
						.fillAndStroke( '#777', 'black');
				}
			doc.circle(260, 173, 7).stroke();
				if (proyecto.cortina.cor_box7_radio === 'option4') {
						doc.circle(260, 173, 4)
						.fillAndStroke( '#777', 'black');
				}

			doc.circle(440, 220, 7).stroke();
				if (proyecto.cortina.cor_box14_radio === 'option1') {
						doc.circle(440, 220, 4)
						.fillAndStroke( '#777', 'black');
				}
			doc.circle(564, 220, 7).stroke();
				if (proyecto.cortina.cor_box14_radio === 'option2') {
						doc.circle(564, 220, 4)
						.fillAndStroke( '#777', 'black');
				}

			doc.circle(619, 238, 6).stroke();
				if (proyecto.cortina.cor_box15_radio === 'option1') {
						doc.circle(619, 238, 3)
						.fillAndStroke( '#777', 'black');
				}
			doc.circle(743, 238, 6).stroke();
				if (proyecto.cortina.cor_box15_radio === 'option2') {
						doc.circle(743, 238, 3)
						.fillAndStroke( '#777', 'black');
				}
			
			//checkboxes - box 9
			doc.rect(30, 307, 7, 7).stroke();
				if (proyecto.cortina.cor_box9_radio === 'option1') {
						doc.rect(30, 307, 7, 7)
						.fillAndStroke( '#777', 'black');
				}
			doc.rect(30, 321, 7, 7).stroke();
				if (proyecto.cortina.cor_box9_radio === 'option2') {
					doc.rect(30, 321, 7, 7)
					.fillAndStroke( '#777', 'black');
				}
			doc.rect(30, 335, 7, 7).stroke();
				if (proyecto.cortina.cor_box9_radio === 'option3') {
					doc.rect(30, 335, 7, 7)
					.fillAndStroke( '#777', 'black');
				}

			//checkboxes - box 11
			doc.rect(30, 443, 7, 7).stroke();
				if (_.includes(proyecto.cortina.cor_box11_check, 'herra')) {
					doc.rect(30, 443, 7, 7)
					.fillAndStroke( '#777', 'black');
				}
			doc.rect(30, 457, 7, 7).stroke();
				if (_.includes(proyecto.cortina.cor_box11_check, 'andamios')) {
					doc.rect(30, 457, 7, 7)
					.fillAndStroke( '#777', 'black');
				}
			doc.rect(30, 471, 7, 7).stroke();
				if (_.includes(proyecto.cortina.cor_box11_check, 'monta')) {
					doc.rect(30, 471, 7, 7)
					.fillAndStroke( '#777', 'black');
				}
			doc.rect(30, 485, 7, 7).stroke();
				if (_.includes(proyecto.cortina.cor_box11_check, 'polainas')) {
					doc.rect(30, 485, 7, 7)
					.fillAndStroke( '#777', 'black');
				}
			doc.rect(30, 499, 7, 7).stroke();
				if (_.includes(proyecto.cortina.cor_box11_check, 'conos')) {
					doc.rect(30, 499, 7, 7)
					.fillAndStroke( '#777', 'black');
				}
			doc.rect(30, 513, 7, 7).stroke();
				if (_.includes(proyecto.cortina.cor_box11_check, 'vehiculo')) {
					doc.rect(30, 513, 7, 7)
					.fillAndStroke( '#777', 'black');
				}
			doc.rect(30, 528, 7, 7).stroke();
				if (_.includes(proyecto.cortina.cor_box11_check, 'extintor')) {
					doc.rect(30, 528, 7, 7)
					.fillAndStroke( '#777', 'black');
				}
			doc.rect(127, 528, 7, 7).stroke();
				if (_.includes(proyecto.cortina.cor_box11_check, 'candado')) {
					doc.rect(127, 528, 7, 7)
					.fillAndStroke( '#777', 'black');
				}

			//checkbox - box 13
			doc.rect(283, 532, 7, 7).stroke();
				if (_.includes(proyecto.cortina.cor_box13_check, 'fotos')) {
					doc.rect(283, 532, 7, 7)
					.fillAndStroke( '#777', 'black');
				}

			//checkbox - box 17
			doc.rect(446, 499, 7, 7).stroke();
				if (proyecto.cortina.cor_box17_radio === 'option1') {
					doc.rect(446, 499, 7, 7)
					.fillAndStroke( '#777', 'black');
				}
			doc.rect(446, 514, 7, 7).stroke();
				if (proyecto.cortina.cor_box17_radio === 'option2') {
					doc.rect(446, 514, 7, 7)
					.fillAndStroke( '#777', 'black');
				}
			doc.rect(446, 529, 7, 7).stroke();
				if (proyecto.cortina.cor_box17_radio === 'option3') {
					doc.rect(446, 529, 7, 7)
					.fillAndStroke( '#777', 'black');
				}


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

			doc.rect(291, 423, 21, 12).fillAndStroke('#d9d9d9');		// CI
			doc.rect(301, 479, 21, 12).fillAndStroke('#d9d9d9');		// OF
			doc.rect(352, 363, 21, 12).fillAndStroke('#d9d9d9');		// P

			doc.rect(425, 159, 21, 12).fillAndStroke('#d9d9d9');		// 1
			doc.rect(462, 95, 21, 12).fillAndStroke('#d9d9d9');			// 2
			doc.rect(523, 95, 21, 12).fillAndStroke('#d9d9d9');			// 3
			doc.rect(556, 159, 21, 12).fillAndStroke('#d9d9d9');		// 4

			doc.rect(588, 184, 21, 12).fillAndStroke('#d9d9d9');		// 1
			doc.rect(588, 124, 21, 12).fillAndStroke('#d9d9d9');		// 2
			doc.rect(624, 90, 21, 12).fillAndStroke('#d9d9d9');			// 3
			doc.rect(717, 90, 21, 12).fillAndStroke('#d9d9d9');			// 4
			doc.rect(749, 124, 21, 12).fillAndStroke('#d9d9d9');		// 5
			doc.rect(749, 184, 21, 12).fillAndStroke('#d9d9d9');		// 6

			doc.fillColor('black');

			// number inputs - box 12
			if (proyecto.cortina.cor_box12_ci) 	{ doc.text(proyecto.cortina.cor_box12_ci, 293, 425) };
			if (proyecto.cortina.cor_box12_of) 	{ doc.text(proyecto.cortina.cor_box12_of, 303, 481) };
			if (proyecto.cortina.cor_box12_p) 	{ doc.text(proyecto.cortina.cor_box12_p, 354, 365) };

			// number inputs - box 14
			if (proyecto.cortina.cor_box14_input1) 	{ doc.text(proyecto.cortina.cor_box14_input1, 427, 161) };
			if (proyecto.cortina.cor_box14_input2) 	{ doc.text(proyecto.cortina.cor_box14_input2, 464, 97) };
			if (proyecto.cortina.cor_box14_input3) 	{ doc.text(proyecto.cortina.cor_box14_input3, 525, 97) };
			if (proyecto.cortina.cor_box14_input4) 	{ doc.text(proyecto.cortina.cor_box14_input4, 558, 161) };

			// number inputs - box 15
			if (proyecto.cortina.cor_box15_input1) 	{ doc.text(proyecto.cortina.cor_box15_input1, 590, 186) };
			if (proyecto.cortina.cor_box15_input2) 	{ doc.text(proyecto.cortina.cor_box15_input2, 590, 126) };
			if (proyecto.cortina.cor_box15_input3) 	{ doc.text(proyecto.cortina.cor_box15_input3, 626, 92) };
			if (proyecto.cortina.cor_box15_input4) 	{ doc.text(proyecto.cortina.cor_box15_input4, 719, 92) };
			if (proyecto.cortina.cor_box15_input5) 	{ doc.text(proyecto.cortina.cor_box15_input5, 751, 126) };
			if (proyecto.cortina.cor_box15_input6) 	{ doc.text(proyecto.cortina.cor_box15_input6, 751, 186) };

			doc.end();
			console.log(proyecto.cortina)
		});
	});


	return router;
};

