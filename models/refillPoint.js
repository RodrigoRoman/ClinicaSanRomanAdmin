const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

const PointSchema = new Schema({
    name:{type:String},
    setPoint: { type:Date },
    });

module.exports = mongoose.model("Point", PointSchema)