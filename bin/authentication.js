module.exports = {
    ensureAuthentication: function (req, res, next) {
        if(req.isAuthenticated()){
            return next();
        }
        req.flash('error_message', 'Please log in to go to the account page');
        res.redirect('/users/login');
    },
    forwardAuthentication: function (req, res, next) {
        if(!req.isAuthenticated()){
            return next();
        }
        res.redirect('/account');
    }
}