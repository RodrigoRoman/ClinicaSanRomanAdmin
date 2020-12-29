const {supplySchema,hospitalSchema,serviceSchema, patientSchema,exitSchema,paymentSchema} = require('./schemas.js');
const ExpressError = require('./utils/ExpressError');
const {Service,Supply,Hospital} = require('./models/service');
const Patient = require('./models/patient');
const Exit = require('./models/exit');
const Payment = require('./models/payment');




function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        
        req.session.returnTo = req.originalUrl
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    next();
}

module.exports.validateService= (req, res, next) => {
    const { error } = serviceSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.validateSupply= (req, res, next) => {
    const { error } = supplySchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.validateHospital= (req, res, next) => {
    const { error } = hospitalSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.validatePatient= (req, res, next) => {
    const { error } = patientSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.validateExit= (req, res, next) => {
    const { error } = exitSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.validatePayment= (req, res, next) => {
    const { error } = paymentSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

//user permissions functions

module.exports.isServAuthor = async (req, res, next) => {
    const { id } = req.params;
    const service = await Service.findById(id);
    if (!service.author.equals(req.user._id)) {
        req.flash('error', 'No tiene permiso de hacer eso');
        return res.redirect("/");
    }
    next();
}

// module.exports.isDirectAdmin = async (req, res, next) => {
//     if (("directAdmin")!=(req.user.role)) {
//         req.flash('error', 'No tiene permiso de hacer eso');
//         return res.redirect("/");
//     }
//     next();
// }

//Permision for the case where the user is either Dinamic or Direct administrator
module.exports.isDinamicDirectAdmin = async (req, res, next) => {
    if (("dinamicAdmin")!=(req.user.role) && ("directAdmin")!=(req.user.role)) {
        req.flash('error', 'No tiene permiso de hacer eso');
        return res.redirect("/");
    }
    next();
}


module.exports.isPatAuthor = async (req, res, next) => {
    const { id } = req.params;
    const patient = await Patient.findById(id);
    if (!patient.author.equals(req.user._id)) {
        req.flash('error', 'No tiene permiso de hacer eso');
        return res.redirect("/patients");
    }
    next();
}



