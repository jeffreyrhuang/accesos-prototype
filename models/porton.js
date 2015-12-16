var mongoose = require('mongoose');
var portonSchema = mongoose.Schema({

	model: String,
	peso: Number

}, {
	collection: 'accesosPorton'
});

module.exports = mongoose.model('Porton', portonSchema);