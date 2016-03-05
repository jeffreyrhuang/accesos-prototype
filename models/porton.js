var mongoose = require('mongoose');
var portonSchema = mongoose.Schema({

	modelNo: Number,
	model: String,
	peso: Number,
	viento: Number

}, {
	collection: 'accesosPorton'
});

module.exports = mongoose.model('Porton', portonSchema);