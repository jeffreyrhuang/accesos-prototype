var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var userSchema = mongoose.Schema({

	username: {
		type: String,
		required: true,
		trim: true
	},
	email: {
		type: String,
		required: true
	},
	password: {
		type: String,
		required: true
	}

}, {
	collection: 'accesosUsers',
	timestamps: true
});

//methods for bcrypt

//generate a hash
userSchema.methods.generateHash = function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

//checking if password is valid
userSchema.methods.validPassword = function(password) {
	return bcrypt.compareSync(password, this.password);
};


module.exports = mongoose.model('accesosUsers', userSchema);