const mongoose = require('mongoose'),
      Exit = require("./exit"),
      timeZone = require('mongoose-timezone'),
      Schema = mongoose.Schema;


const PaymentSchema = new Schema({
    name: { type: String, required:true },
    dueDate: { type: Date},
    exits:[{
		type: Schema.Types.ObjectId,
		ref: "Exit"
	}],
    moneyAmount: { type: Number, required: true, get: p => `${p}.00` }
});
PaymentSchema.plugin(timeZone, { paths: ['date', 'subDocument.subDate'] });

module.exports = mongoose.model("Payment", PaymentSchema)
