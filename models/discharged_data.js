const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

const DischargedSchema = new Schema({
    patientId :{type:String},
    class: { type: String},
    amount: { type: Number},
    name: { type: String},
    processDate: { type: Date},
    service_type: { type: String},
    hospitalEntry:{type: String,required:true},
    buyPrice: { type: Number},
    unitPrice: { type: Number, required: true, get: p => `${p}.00` }
});

module.exports = mongoose.model("Disch", DischargedSchema)

