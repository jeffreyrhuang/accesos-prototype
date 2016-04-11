var mongoose = require('mongoose');
var proyectoSchema = mongoose.Schema({

	documentNo: Number,
	name: String,
	location: String,
	asesor: String,
	cliente: String,
	porton: String,
	portonNo: Number,
	alto: Number,
	ancho: Number,
	peso: Number,
	cortina: {
		cor_a: Number,
		cor_h: Number,
		cor_ci: Number,
		cor_ce: Number,
		cor_li: Number,
		cor_ld: Number,
		cor_p: Number,
		cor_ss: Number,
		cor_sc: Number,
		cor_si: Number,
		cor_b: Number,
		cor_ti: Number,
		cor_td: Number,
		cor_di: Number,
		cor_dd: Number,
		cor_ciclos: String,
		cor_horas: String,
		cor_tipo_guia: String,
		cor_ojos: String,
		cor_color_herr: String,
		cor_co_izq: String,
		cor_col_der: String,
		cor_carg_sup: String,
		cor_guia_des: String,
		cor_perfil_pri: String,
		cor_perfil_sec: String,
		cor_color_ext: String,
		cor_color_int: String,
		cor_cob_color: String,
	}

},{
	collection: 'accesosProyecto',
	timestamps: true
});

module.exports = mongoose.model('Proyecto', proyectoSchema);