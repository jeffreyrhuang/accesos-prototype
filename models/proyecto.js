var mongoose = require('mongoose');
var proyectoSchema = mongoose.Schema({

	documentNo: Number,
	name: String,
	location: String,
	asesor: String,
	client: String,
	porton: String,
	portonNo: Number,
	alto: Number,
	ancho: Number,
	peso: Number

},{
	collection: 'accesosProyecto',
	timestamps: true
});

module.exports = mongoose.model('Proyecto', proyectoSchema);