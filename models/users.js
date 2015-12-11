var mongoose = require('mongoose');
var userSchema = mongoose.Schema({

	username: String,
	password: String,

}, {
	collection: 'accesosUsers'
});

module.exports = mongoose.model('accesosUsers', userSchema);