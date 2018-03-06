var express = require('express');
var request = require("request");
const router = express.Router();



postData = function(payload){
    var options = { method: 'POST',
    url: 'http://localhost:3004/posts',
    headers : {'content-type': 'text/plain'},
    body: payload};
  
  request(options, function (error, response, body) {
    if (error) throw new Error(error);  
    console.log(body);
  });
}

var payload;

router.post('/',(req,res) =>{
    res.send(req.body);
    var dnis = req.body.dnis;
	var ramal = req.body.ani;

	console.log(ramal + dnis);
	var request = require("request");

	var options = { method: 'GET',
	  url: 'http://localhost:36729/',
	  qs: { CID: 'BCM1234', ANI: ramal , DNIS: dnis },
	  headers: 
	   { 'Postman-Token': '066494b4-f6c6-43cc-90ca-4fd80f82d62f',
		 'Cache-Control': 'no-cache' } };

	request(options, function (error, response, body) {
	  if (error) throw new Error(error);

	  console.log(body);
	});


    
})

module.exports = router;