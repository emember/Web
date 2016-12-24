var express = require('express');
var router = express.Router();

router.get('/detail', function(req, res, next) {
	var query='MATCH (n:company) where n.company_id={company_id} RETURN n';

	db.cypherQuery(
	query,
	req.para,
	function (err, result) {
		if (err) {
			return console.log(err);
		}	  
		res.json(result.data[0]);
	});	
})


router.post('/save',function(req, res, next) {
	var query="match (n:company) where n.company_id={company_id}  \
			   set n.name={name}, n.phone={phone}, n.address={address}, n.abn={abn}";
	db.cypherQuery(
	query,
	req.para,
	function (err, result) {
		if (err) {
			return console.log(err);
		}	  
		res.json(result.data);
	});		
})

module.exports = router;
