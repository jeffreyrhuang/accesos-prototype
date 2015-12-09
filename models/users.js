var mongoose = require('mongoose');
var userSchema = mongoose.Schema({

	email: String,
	password: String,

});

module.exports = mongoose.model('User', userSchema);