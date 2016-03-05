var mongoose = require('mongoose');
var proyectoSchema = mongoose.Schema({

	documentId: Number,
	name: String,
	location: String,
	asesor: String,
	client: String,
	porton: String,
	peso: Number

},{
	collection: 'accesosProyecto',
	timestamps: true
});

module.exports = mongoose.model('Proyecto', proyectoSchema);