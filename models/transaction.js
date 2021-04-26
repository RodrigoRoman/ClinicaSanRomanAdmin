const mongoose = require("mongoose"),
	  {Service} = require("./service"),
	//   Patient = require("./patient"),
	  Schema = mongoose.Schema;

const TransactionSchema = new Schema({
	patient: {
		type: Schema.Types.ObjectId,
		ref: "Patient"
	},
	location:{
		type: String
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
	},
	terminalDate:{ 
		type: Date, 
		default: null
	},
	toggle:{
		type:Boolean,
		default:true
	}
});
module.exports = mongoose.model("Transaction", TransactionSchema)