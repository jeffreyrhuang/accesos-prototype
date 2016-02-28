var mongoose = require('mongoose');
var proyectoSchema = mongoose.Schema({

	// id:
	name: String,
	// date created
	location: String,
	asesor: String
	// client: String,

},{
	collection: 'accesosProyecto'
});

module.exports = mongoose.model('Proyecto', proyectoSchema);