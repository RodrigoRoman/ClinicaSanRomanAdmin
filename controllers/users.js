const User = require('../models/user');

module.exports.renderRegister = (req, res) => {
    res.render('users/register');
}

module.exports.register = async (req, res, next) => {
    try {
        const { email, username, password,keyword } = req.body;
        let user;
        if(keyword == "Admin"){
            user = new User({ email, username, role:"directAdmin"});
        }
        if(keyword == "sroleAdminDinamico"){
            user = new User({ email, username, role:"dinamicAdmin"});
        }
        if(keyword == "enfermeria"){
            user = new User({ email, username, role:"nurse"});
        }
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Bienvenido!');
            res.redirect('/services');
        })
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('register');
    }
}

module.exports.renderLogin = (req, res) => {
    res.render('users/login');
}

module.exports.login = (req, res) => {
    req.flash('success', `Bienvenido ${req.user.username}`);
    const redirectUrl = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
}

module.exports.logout = (req, res) => {
    req.logout();
    // req.session.destroy();
    req.flash('success', "Hasta pronto!");
    res.redirect('/');
}