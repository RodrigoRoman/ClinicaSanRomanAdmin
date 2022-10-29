const mongoose = require('mongoose'),
      Exit = require("./exit"),
      Schema = mongoose.Schema;


const PaymentSchema = new Schema({
    name: { type: String, required:true },
    dueDate: { type: Date},
    exits:[{
		type: Schema.Types.ObjectId,
		ref: "Exit"
	}],
    moneyAmount: {type: Number, required: true, get: p => `${p}.00` }
});

module.exports = mongoose.model("Payment", PaymentSchema)
