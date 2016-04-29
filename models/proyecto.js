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
	peso_submitted: Boolean,
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
		cor_main_radio: String,
		cor_main_radio_instal: String,
		cor_main_radio_izq: String,
		cor_main_radio_der: String,
		cor_main_radio_uni: String,
		//box 2
		cor_ciclos: String,
		cor_horas: String,
		cor_tipo_guia: String,
		cor_ojos: String,
		cor_color_herr: String,
		cor_col_izq: String,
		cor_col_der: String,
		cor_carg_sup: String,
		cor_guia_des: String,
		//box 3
		cor_perfil_pri: String,
		cor_perfil_sec: String,
		cor_color_ext: String,
		cor_color_int: String,
		//box 4
		cor_cob_color: String,
		cor_box4_radio: String,
		//box 5
		cor_box5_check: Array,
		cor_accesorio1: String,
		cor_accesorio2: String,
		cor_accesorio3: String,
		cor_accesorio4: String,
		//box 6
		cor_mod_motor: String,
		cor_caudro: String,
		cor_sensor: String,
		cor_banda: String,
		cor_cob_motor: String,
		cor_box6_radio: String,
		//box 7
		cor_box7_radio: String,
		//box 8
		cor_bot: String,
		cor_selector: String,
		cor_receptor: String,
		cor_controles: String,
		cor_bot_cod: String,
		//box 9
		cor_box9_radio: String,
		cor_volt: String,
		cor_volt_carg: String,
		cor_cable_carg: String,
		//box 10
		cor_des: String,
		cor_des_carg: String,
		//box 11
		cor_box11_check: Array,
		cor_monta_carg: String,
		//box 12
		cor_offset: Number,
		cor_rollo_carg: String,
		cor_box12_ci: Number,
		cor_box12_of: Number,
		cor_box12_p: Number,
		//box 13
		cor_box13_check: String,
		//box 14
		cor_puerta: String,
		cor_cerradura: String,
		cor_cierrapu: String,
		cor_box14_input1: Number,
		cor_box14_input2: Number,
		cor_box14_input3: Number,
		cor_box14_input4: Number,
		cor_box14_radio: String,
		//box 15
		cor_box15_input1: Number,
		cor_box15_input2: Number,
		cor_box15_input3: Number,
		cor_box15_input4: Number,
		cor_box15_input5: Number,
		cor_box15_input6: Number,
		cor_box15_radio: String,
		//box 16
		cor_comentarios: String,
		//box 17
		cor_box17_radio: String,
		cor_notas: String
	},
	cor_submitted: Boolean

},{
	collection: 'accesosProyecto',
	timestamps: true
});

module.exports = mongoose.model('Proyecto', proyectoSchema);