var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require("request");
var crypto = require('crypto');

var neo4j = require('node-neo4j');
var db = new neo4j('http://54.187.14.85:443','Authorization:Basic bmVvNGo6ZW1lbWJlcjIwMTYwOCE=');
global.db=db;

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({limit: '5mb'}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

function requestCommon (req, res, next) {
  var para =req.body;
  para.company_id=req.headers.companyid;

  req.para=para;

  // keep executing the router middleware
  next();
}


var routes = require('./routes/index');
var company =require('./routes/company')
var member =require('./routes/member')
var visit =require('./routes/visit')

app.use(requestCommon);

app.use('/', routes);
app.use('/company', company);
app.use('/member', member);
app.use('/visit', visit);


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
