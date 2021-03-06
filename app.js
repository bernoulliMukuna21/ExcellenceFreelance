/*
    * Author: Bernoulli Mukuna
    * created: 10/05/2020
*/
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require('passport');
var EF_DB_conn = require('./bin/db_connection');
var flash = require('connect-flash');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var passport = require('passport');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var serviceRouter = require('./routes/services');// This path should not exist. It will go
var aboutRouter = require('./routes/aboutUs');
var accountRouter = require('./routes/account');

var app = express();

// Passport Config
require('./bin/passport-config')(passport);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, "/../public")));
app.set('view engine', 'pug');

// Middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Express Session Settings
let cookieExpirationTime = parseInt(process.env.cookie_expressionTime); // session expires after 90 days
let sessionStore = new MongoStore({
    mongooseConnection: EF_DB_conn.excellence_freelanceDB,
    collection: 'ef_sessions'
});
app.use(
    session({
      secret: process.env.session_secretID,
      store: sessionStore,
      resave: true,
      saveUninitialized: false,
      rolling: true,
      cookie: { expires : new Date(Date.now() + cookieExpirationTime)}
    })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session()); // Keep track of the user session

// Connect flash
app.use(flash());

// Global Variables
app.use(function (req, res, next) {

  // Available only to the view(s) rendered during that request/response cycle
  res.locals.success_message = req.flash('success_message');
  res.locals.error_message = req.flash('error_message');
  res.locals.error = req.flash('error');
  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/account', accountRouter);
app.use('/join', indexRouter);// using the same route
app.use('/login', indexRouter); //
app.use('/about-us', aboutRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in devendorvelopment
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
