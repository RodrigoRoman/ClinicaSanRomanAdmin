const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const timeZone = require('mongoose-timezone');
const passportLocalMongoose = require('passport-local-mongoose');

const ImageSchema = new Schema({
    url: String,
    filename: String
});

ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200');
});

const opts = { toJSON: { virtuals: true } };

const UserSchema = new Schema({
    photo: [ImageSchema],
    email: {
        type: String,
        required: true,
        unique: true
    },
    role:{
        type: String,
        required: true
    }
});


UserSchema.plugin(passportLocalMongoose);
UserSchema.plugin(timeZone, { paths: ['date', 'subDocument.subDate'] });

module.exports = mongoose.model('User', UserSchema);