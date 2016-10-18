var express = require('express');
var router = express.Router();
var path = require('path');
var neo4j = require('node-neo4j');
var db = new neo4j('localhost:443','Basic bmVvNGo6THlic2VhbjIwMTY=');


router.get('/', function(req, res, next) {
  var family=req.query.family;
  if(family){
    db.cypherQuery(
      "match (f:family) where f.id='"+family+"' return f",
      {},
      function (err, result) {
        if (err) {
          return console.log(err);
        }
        res.render('index', { title: 'Welcome to D-Life', pic: result.data[0].pic});
      });    
  }else{
    res.render('index', { title: 'Welcome to D-Life', pic: 'default.jpg'});
  }

});


router.post('/auth', function(req, res, next) {
  var auth=req.body;
  db.cypherQuery(
    "MATCH (n:user{email:'"+auth.username+"', password:'"+auth.password+"'}) RETURN {email:n.email, firstname:n.firstname, lastname:n.lastname} as loginUser",
    {},
    function (err, result) {
      if (err) {
        return console.log(err);
      }

      if (result.data.length!=0) { 
        res.cookie('loginUser', result.data[0],{ maxAge: 9000000, httpOnly: true });    
        res.redirect('/notes');
      }else{
        res.redirect('/');
      }  
    });
});


router.get('/logout',function(req,res){
  res.clearCookie('loginUser');
  res.redirect('/');
});


router.get('/notes',function(req,res){
  var loginUser = req.cookies.loginUser;
  if (loginUser=='' || loginUser==undefined) {
    res.redirect('/');
  };

  db.cypherQuery(
    "match  (login:user {email:'"+loginUser.email+"'}) "
    +"match (login)-[r:userBelongToFamily]->(f) "
    +"match  (member:user)-[f2:userBelongToFamily]->(f) "
    +"return {email:member.email,firstname:member.firstname, lastname:member.lastname} as members ",
    {},
    function (err, result) {
      if (err) {
        return console.log(err);
      }
      res.render('notes', { title: 'D-Life, Data of Your Life', loginUser:loginUser.firstname, members:result.data});
      members=result.data;
    });
  
});


router.get('/userlist',function(req,res){
  db.cypherQuery(
    'MATCH (n:user) RETURN n LIMIT 25',
    {},
    function (err, result) {
      if (err) {
        return console.log(err);
      }
      console.log('kjhfksajhfaiwehfwfnei');
      console.log(result.data); // delivers an array of query results
      res.json(result.data); 
    }
  );
});

module.exports = router;
