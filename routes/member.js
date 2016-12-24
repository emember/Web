var express = require('express');
var router = express.Router();
var image=require('../util/image.js');

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


router.post('/create',function(req, res, next) {
	var para =req.para;

	var qr_pic_file=para.company_id+'\\'+para.qr_code+"_qr.png";
	image.save(qr_pic_file, para.qr_pic);
	para.qr_pic=qr_pic_file;
	

	var profile_pic_file=para.company_id+'\\'+ para.qr_code+"_profile.png";	
	image.save(profile_pic_file, para.profile_pic);
	para.profile_pic=profile_pic_file;
	

	var query="match (c:company {company_id:{company_id}}) \
				merge (e:email {email: {email}}) \
				merge (m:member {qr_code:{qr_code}})\
				set m.qr_pic={qr_pic}, m.profile_pic={profile_pic}, m.firstname={firstname}, m.lastname={lastname}, m.phone={phone}, m.date_of_birth={date_of_birth}\
				merge (c)-[cmr:has_memeber ]->(m) \
				merge (e)-[emr:is_memeber]->(m)";

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