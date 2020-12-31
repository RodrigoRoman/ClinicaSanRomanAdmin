const mongoose = require("mongoose"),
	  {Service} = require("./service"),
	  Patient = require("./patient"),
	  timeZone = require('mongoose-timezone'),
	  Schema = mongoose.Schema;

const TransactionSchema = new Schema({
	patient: {
		type: Schema.Types.ObjectId,
		ref: "Patient"
	},
	service:{
		type: Schema.Types.ObjectId,
		ref: "Service"
	},
	amount: { type: Number },
	consumtionDate: { type:Date },
	addedBy: { 
		type: Schema.Types.ObjectId,
		ref: 'User'
	}
});
TransactionSchema.plugin(timeZone, { paths: ['date', 'subDocument.subDate'] });
module.exports = mongoose.model("Transaction", TransactionSchema)