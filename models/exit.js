const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

const ExitSchema = new Schema({
    name: { type: String, required:true },
    clearDate: { type: Date},
    moneyAmount: { type: Number, required: true, get: p => `${p}.00` }
});

module.exports = mongoose.model("Exit", ExitSchema)

