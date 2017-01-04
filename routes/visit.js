var express = require('express');
var router = express.Router();

router.post('/info', function(req, res, next) {
	var query='MATCH (m:member {qr_code:{qr_code}})  RETURN m \
	 \
	';

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


router.post('/add',function(req, res, next) {
	var para =req.para;

	var query="match (m:member {qr_code:{qr_code}})\
				create (v:visit {expense:{expense}, discount:{discount}, payment:{payment}, datetime:{datetime}}) \
				create (m)-[r:has_visit]->(v)";

	db.cypherQuery(
		query,
		para,
		function (err, result) {
			if (err) {
				return console.log(err);
			}	  
			res.json(result.data);
	});		
})

router.post('/update',function(req, res, next) {
	var para =req.para;	

	var profile_pic_file=para.company_id+'\\'+ para.qr_code+"_profile.png";	
	image.save(profile_pic_file, para.profile_pic);
	para.profile_pic=profile_pic_file;
	

	var query="merge (m:member {qr_code:{qr_code}})\
				set m.firstname={firstname}, m.lastname={lastname}, m.phone={phone}, m.date_of_birth={date_of_birth}, m.discount={discount}";

	db.cypherQuery(
		query,
		para,
		function (err, result) {
			if (err) {
				return console.log(err);
			}	  
			res.json(result.data);
	});		
})


module.exports = router;
