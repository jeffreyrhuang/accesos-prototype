require('dotenv').config();

var express = require('express');
var app = express();
var path = require('path');
var passport = require('passport');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var csurf = require('csurf');
var flash = require('connect-flash');


//database setup
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var options = {
  server: {
    socketOptions: {keepAlive: 1}
  }
};
switch(app.get('env')){
  case 'development':
    mongoose.connect(process.env.LOCAL_DB, options);
    console.log('connected to local mongodb');
    break;
  case 'production':
    mongoose.connect(process.env.MONGOLAB_URI, options);
    break;
  default:
    throw new Error('Unknown execution environment: ' + app.get('env'));
}

require('./config/passport')(passport); // pass passport for configuration


// view engine setup
var exphbs = require ('express-handlebars');
var handlebars = exphbs.create({
  defaultLayout: 'main',
  extname: 'hbs',
  helpers: {
    section: function(name, options){
      if(!this._sections) this._sections={};
      this._sections[name] = options.fn(this);
      return null;
    }
  }
});
app.engine('hbs', handlebars.engine);
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(__dirname + '/public'));
app.use('/api', express.static(__dirname + '/public'));


// required for passport
app.use(session({ secret: 'ilovescotch', saveUninitialized: true, resave: true })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

//csurf (TURNED OFF FOR DEVELOPMENT!!!)
// app.use(csurf());
// app.use(function(req, res, next){
//   res.locals._csrfToken = req.csrfToken();
//   next();
// });

// Used for showing userButton on everypage
app.use(function(req, res, next){
  res.locals.login = req.isAuthenticated();
  next();
});


var routes = require('./routes/routes')(passport);
var proyectoRoutes = require('./routes/routes_proyectos')(passport);  //(passport off)
app.use('/', routes);
app.use('/api', proyectoRoutes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
