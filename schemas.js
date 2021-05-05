const BaseJoi = require('joi');
const sanitizeHtml = require('sanitize-html');

const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!'
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
                if (clean !== value) return helpers.error('string.escapeHTML', { value })
                return clean;
            }
        }
    }
});
const Joi = BaseJoi.extend(extension)

module.exports.supplySchema = Joi.object({
    service: Joi.object({
        name: Joi.string().regex(/^[a-zA-Z0-9.,()-+_%*@\u0300-\u036f/%ñ ]*$/, 'Un caracter ingresado no es valido').required().escapeHTML(),
        unit: Joi.string().regex(/^[a-zA-Z0-9.,()-+_%*@\u0300-\u036f/%ñ ]*$/, 'Un caracter ingresado no es valido').required().escapeHTML(),
        class: Joi.string().regex(/^[a-zA-Z0-9.,()-+_%*@\u0300-\u036f/%ñ ]*$/, 'Un caracter ingresado no es valido').required().escapeHTML(),
        principle: Joi.string().regex(/^[a-zA-Z0-9.,()-+_%*@\u0300-\u036f/%ñ ]*$/, 'Un caracter ingresado no es valido').required().escapeHTML(),
        claveSat: Joi.number().required(),
        description: Joi.string().regex(/^[a-zA-Z0-9.,()-+_%*@\u0300-\u036f/%ñ ]*$/, 'Un caracter ingresado no es valido').required().escapeHTML(),
        buy_price: Joi.number().precision(2).required(),
        sell_price: Joi.number().precision(2).required(),
        expiration: Joi.date().required(),
        supplier: Joi.string().required().escapeHTML(),
        optimum: Joi.number().required().min(1),
        outside: Joi.number().required(),
        stock: Joi.number().required().min(0),
        hospitalEntry: Joi.string().required(),
    }).required(),
    deleteImages: Joi.array()
});

module.exports.hospitalSchema = Joi.object({
    service: Joi.object({
        name: Joi.string().regex(/^[a-zA-Z0-9.,()-+_%*@\u0300-\u036f/%ñ ]*$/, 'Un caracter ingresado no es valido').required().escapeHTML(),
        class: Joi.string().regex(/^[a-zA-Z0-9.,()-+_%*@\u0300-\u036f/%ñ ]*$/, 'Un caracter ingresado no es valido').required().escapeHTML(),
        unit: Joi.string().regex(/^[a-zA-Z0-9.,()-+_%*@\u0300-\u036f/%ñ ]*$/, 'Un caracter ingresado no es valido').required().escapeHTML(),
        claveSat: Joi.number().required(),
        description: Joi.string().regex(/^[a-zA-Z0-9.,()-+_%*@\u0300-\u036f/%ñ ]*$/, 'Un caracter ingresado no es valido').required().escapeHTML(),
        price: Joi.number().precision(2).required(),
        doctor: Joi.string().regex(/^[a-zA-Z0-9.,()-+_%*@\u0300-\u036f/%ñ ]*$/, 'Un caracter ingresado no es valido').required().escapeHTML(),
        hospitalEntry: Joi.string().required(),
    }).required(),
    deleteImages: Joi.array()
});

module.exports.patientSchema = Joi.object({
    patient: Joi.object({
        name: Joi.string().regex(/^[a-zA-Z0-9.,()-+_%*@\u0300-\u036f/%ñ ]*$/, 'Un caracter ingresado no es valido').required().escapeHTML(),
        phone: Joi.number().required(),
        cuarto: Joi.string().required(),
        edad: Joi.number().required(),
        admissionDate: Joi.date(),
        email: Joi.string().regex(/^[a-zA-Z0-9.,()-+_%*@\u0300-\u036f/%ñ ]*$/, 'Un caracter ingresado no es valido').email({tlds: { allow: false } }).escapeHTML(),
        address: Joi.string().regex(/^[a-zA-Z0-9.,()-+_%*@\u0300-\u036f/%ñ ]*$/, 'Un caracter ingresado no es valido').required().escapeHTML(),
        rfc: Joi.number().required(),
        diagnosis: Joi.string().regex(/^[a-zA-Z0-9.,()-+_%*@\u0300-\u036f/%ñ ]*$/, 'Un caracter ingresado no es valido').required().escapeHTML(),
        treatingDoctor: Joi.string().regex(/^[a-zA-Z0-9.,()-+_%*@\u0300-\u036f/%ñ ]*$/, 'Un caracter ingresado no es valido').required().escapeHTML(),
    }).required()
});

module.exports.exitSchema = Joi.object({
    exit: Joi.object({
        name: Joi.string().regex(/^[a-zA-Z0-9.,()-+_%*@\u0300-\u036f/%ñ ]*$/, 'Un caracter ingresado no es valido').required().escapeHTML(),
        clearDate: Joi.date().required(),
        moneyAmount: Joi.number().required()
    }).required()
});

module.exports.paymentSchema = Joi.object({
    payment: Joi.object({
        name: Joi.string().regex(/^[a-zA-Z0-9.,()-+_%*@\u0300-\u036f/%ñ ]*$/, 'Un caracter ingresado no es valido').required().escapeHTML(),
        dueDate: Joi.date().required(),
        moneyAmount: Joi.number().required(),
        terms: Joi.number().required()
    }).required()
});


