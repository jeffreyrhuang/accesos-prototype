var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

// router.post('/login', passport.authenticate('local', {
// 	successRedirect: '/',
// 	failureRedirect: 'login'
// }));

router.get('/login', function(req, res, next) {
  res.render('login');
});

router.get('/motor', function(req, res, next) {
  res.render('motor');
});

router.get('/acceso', function(req, res, next) {
  res.render('acceso');
});

router.get('/peso', function(req, res, next) {
  res.render('peso');
});

router.get('/encuestas', function(req, res, next) {
  res.render('encuestas');
});

router.get('/cliente', function(req, res, next) {
  res.render('cliente');
});

module.exports = router;
