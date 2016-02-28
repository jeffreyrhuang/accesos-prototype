var mongoose = require('mongoose');
var proyectoSchema = mongoose.Schema({

	// id:
	name: String,
	// date created
	// asesor: String,
	// client: String,

},{
	collection: 'accesosProyecto'
});

module.exports = mongoose.model('Proyecto', proyectoSchema);