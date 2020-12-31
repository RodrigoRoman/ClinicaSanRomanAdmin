const mongoose = require('mongoose'),
      timeZone = require('mongoose-timezone'),
      Schema = mongoose.Schema;

const ExitSchema = new Schema({
    name: { type: String, required:true },
    clearDate: { type: Date},
    moneyAmount: { type: Number, required: true, get: p => `${p}.00` }
});

ExitSchema.plugin(timeZone, { paths: ['date', 'subDocument.subDate'] });
module.exports = mongoose.model("Exit", ExitSchema)

