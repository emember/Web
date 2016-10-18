module.exports = 
{
  runCypherQuery : function(query, params, callback) {
    var request = require("request");
    var host = 'localhost', port = 443;
    var httpUrlForTransaction = 'http://' + host + ':' + port + '/db/data/transaction/commit';
    request.post({
        uri: httpUrlForTransaction,
        json: {statements: [{statement: query, parameters: params}]}
      },
      function (err, res, body) {
        callback(err, body);
      })
  }  
}
