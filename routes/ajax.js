var express = require('express');
var router = express.Router();
var path = require('path');
var neo4j = require('node-neo4j');
var db = new neo4j('http://localhost:443','Authorization:Basic bmVvNGo6THlic2VhbjIwMTY=');
var moment = require("moment");
var image=require('../util/image.js');
var crypto = require('crypto');
var notification=require('../util/notification.js');

router.get('/getAppSettings', function(req, res, next) {
	var loginUser=req.cookies.loginUser;
	var t = typeof (loginUser);

	if (t != "object") {
		loginUser=JSON.parse(loginUser);
	}
	var query=
		"match (u:user) where u.email='"+loginUser.email+"'  "
		+"match (u)-[r:userBelongToFamily]->(f:family) "
		+"match (members:user)-[r2:userBelongToFamily]->(f)"
		+"match (f)-[r3:hasKeyword]->(k:keyword) "
		+"with collect(distinct {keyword:k.keyword}) as res, "
		+"collect(distinct {email:members.email,firstname:members.firstname, lastname:members.lastname}) as members "
		+"return members, REDUCE(output = [], r IN res  | output + r.keyword) as keywords ";
	db.cypherQuery(
	query,
	{},
	function (err, result) {
	  if (err) {
	    return console.log(err);
	  }
	  var notes=result.data;

	  var returnVal={members:result.data[0][0], keywords:result.data[0][1]};
	  res.json(returnVal);
	});	

});


router.post('/addDeviceToken', function(req, res, next) {
  	var deviceToken=req.body;

  	var query=
  	"match (u:user) where u.email='"+deviceToken.email+"' "
	+"merge (t:deviceToken {token:'"+deviceToken.token+"'}) "
	+"merge (u)-[r:hasDeviceToken]->(t) ";

    db.cypherQuery(
    query,
    {},
    function (err, result) {
      if (err) {
        return console.log(err);
      }
	  res.status(200).send();
    });
})


router.post('/postGpsToEmail', function(req, res, next) {
	var body=req.body;
	console.log('~~~',body.receiver);
	var query=
		"match (u:user {email:'"+body.receiver+"'}) "
		+"optional match (u)-[r3:hasDeviceToken]->(t) "
		+"return collect(t.token)";

	db.cypherQuery(
	query,
	{},
	function (err, result) {
	  if (err) {	  	
	    console.log(err);
	  }else{
	  	notification.send(result.data[0], body.sender+' sent position to you from D-Life');
	  	res.status(200).send();
	  }	  
	});	
})



router.post('/requestGpsByEmail', function(req, res, next) {
	var body=req.body;
	console.log('~~~',body);
	var query=
		"match (u:user {email:'"+body.email+"'}) "
		+"optional match (u)-[r3:hasDeviceToken]->(t) "
		+"return collect(t.token)";

	db.cypherQuery(
	query,
	{},
	function (err, result) {
	  if (err) {	  	
	    console.log(err);
	  }else{
	  	notification.send(result.data[0], body.requester+' requested your position from D-Life');
	  	res.status(200).send();
	  }	  
	});	
})

router.post('/login', function(req, res, next) {
  var user=req.body;

  var token=crypto.randomBytes(16).toString('hex');
  db.cypherQuery(
    "MATCH (n:user{email:'"+user.email+"', password:'"+user.password+"'})  set n.token ='"+token+"' RETURN {email:n.email, firstname:n.firstname, lastname:n.lastname, token:n.token} as loginUser",
    {},
    function (err, result) {
      if (err) {
        return console.log(err);
      }

      if (result.data.length!=0) { 
      	res.json(result.data[0]);
      }else{
        res.status(403).send();
      }  
    });
});


router.post('/getNotesByDate', function(req, res, next) {
	//For cross browser or app parse string header
	var loginUser=req.cookies.loginUser;
	var t = typeof (loginUser);
	if (t != "object") {
		loginUser=JSON.parse(loginUser);
	}

	var selectedDate=req.body.selectedDate;

	var queryDate= moment(selectedDate).format('L');

	var query=
		"match  (login:user {email:'"+loginUser.email+"'}) "
		+"match  (login)-[f1:userBelongToFamily]->(f:family) "
		+"match  (members:user)-[f2:userBelongToFamily]->(f) "
		+"match  (date:date {date:'"+queryDate+"'}) "
		+"match  (note:note)-[createdOn:createdOn]->(date) "
		+"match  (note)-[about:aboutUser]->(members) "
		+"match  (note)-[link:linkTo]->(keyword:keyword) "
		+"match  (note)-[create:createdBy]->(creator:user) "
		+"return {about:members.firstname,creator:creator.firstname, keyword:keyword.keyword, details:note.details, time:createdOn.time, pics:note.pics}  as note "
		+"order by createdOn.time DESC, members.firstname, keyword.keyword, creator.firstname, note.details ";

	db.cypherQuery(
	query,
	{},
	function (err, result) {
	  if (err) {
	    return console.log(err);
	  }
	  var notes=result.data;
	  notes.forEach(function(n){
	  	n.time=moment(n.time).format("HH:mm");
	  	if(n.pics && n.pics.length>0){
	  		n.pics=n.pics.split(',');
	  	}else{
	  		n.pics=[];
	  	}
	  	
	  });
	  res.json(result.data);
	});	
});


router.post('/searchKeyword', function(req, res, next) {
	var query="match (keyword:keyword) where keyword.keyword contains '"+req.body.keyword+"' return keyword.keyword";

	db.cypherQuery(
	query,
	{},
	function (err, result) {
	  if (err) {
	    return console.log(err);
	  }
	  res.json(result.data);
	});	
});


router.post('/AddNote', function(req, res, next) {
	var loginUser=req.cookies.loginUser;
	var t = typeof (loginUser);
	if (t != "object") {
		loginUser=JSON.parse(loginUser);
	}

	var note=req.body;

	var today= moment().format('L');

	var files=[];
	if(req.body.pics){
		files=image.saveImage(req.body.pics);
	}

	var query=
		"match (creator:user {email:'"+loginUser.email+"'}) "
		+"match (tagged:user {email:'"+note.about+"'}) "
		+"match (tagged)-[r:userBelongToFamily]->(f:family) "
		+"match(members)-[r2:userBelongToFamily]->(f) where members.email <> creator.email "
		+"optional match (members)-[r3:hasDeviceToken]->(t) "
		+"merge (keyword:keyword {keyword:'"+note.keyword+"'}) "
		+"merge (f)-[h:hasKeyword]->(keyword) "
		+"merge (tagged)-[feel:feel]->(keyword) "
		+"merge (date:date {date:'"+today+"'}) "
		+"create (note:note {details:'"+note.details+"', value:'"+note.value+"', pics:'"+files+"'}) "
		+"create (note)-[linkTo:linkTo]->(keyword) "
		+"create (note)-[createdBy:createdBy]->(creator) "
		+"create (note)-[aboutUser:aboutUser]->(tagged) "
		+"create (note)-[createdOn:createdOn {time:timestamp()}]->(date) "
		+"return collect(t.token)";

	db.cypherQuery(
	query,
	{},
	function (err, result) {
	  if (err) {	  	
	    console.log(err);
	  }else{
	  	notification.send(result.data[0],loginUser.firstname+' posted a new note in D-Life');
	  	res.status(200).send();
	  }	  
	});	
});


router.post('/searchNotes', function(req, res, next) {
	var loginUser=req.cookies.loginUser;
	var para= req.body;
	
	para.from=moment(para.from).format('L');
	para.to=moment(para.to).format('L');

	var query=
	"match (note:note)-[createdOn:createdOn]->(date:date) where date.date >='"+para.from+"' AND date.date<='"+para.to+"' "
	+"match (note)-[aboutUser:aboutUser]->(aboutwho:user) where aboutwho.email='"+para.about+"' "
	+"match (note)-[linkTo:linkTo]->(keyword:keyword) ";

	if(para.keyword){
		query+="where keyword.keyword CONTAINS '"+para.keyword+"' ";
	}


	if(para.detail){
		query+="match (note) where note.details CONTAINS '"+para.detail+"' ";	
	}

	query=query
	+"match (note)-[createdBy:createdBy]-(creator:user) "
	+"return {about:aboutwho.firstname,creator:creator.firstname, keyword:keyword.keyword, details:note.details,createdOn:date.date}  as result "
	"order by aboutwho.firstname, keyword.keyword, creator.firstname, note.details ";

	db.cypherQuery(
	query,
	{},
	function (err, result) {
	  if (err) {
	    return console.log(err);
	  }
	  var notes =result.data;
	  var summary={};
	  notes.forEach(function(note){
	  	if(summary[note.keyword]){
	  		summary[note.keyword]+=1;	
	  	}else{
  			summary[note.keyword]=1;	
	  	}	  	
	  });

	  var summaryArray=[['', '']];
	  for(var attr in summary){
	  	summaryArray.push([attr, summary[attr]]);
	  }
	  res.json({summary:summaryArray, notes:notes});
	});	
});


router.post('/logout', function(req, res, next) {
  	var user=req.body;
  	var query=
			"match (u:user) where u.email='"+user.email+"' "
			+"match (dt:deviceToken) where dt.token='"+user.device_token+"' "
			+"match (u)-[r:hasDeviceToken]->(dt) "
			+"delete r,dt "

    db.cypherQuery(
    query,
    {},
    function (err, result) {
      if (err) {
        console.log(err);
      }
	  res.status(200).send();
    });
})


module.exports = router;