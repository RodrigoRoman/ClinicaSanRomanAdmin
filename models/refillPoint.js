const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

const PointSchema = new Schema({
    setPoint: { type:Date },
    });
    
module.exports = mongoose.model("Point", PointSchema)