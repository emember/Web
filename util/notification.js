  module.exports = 
  {
    send : function(gcmTokens, message) {
      var request = require('request');      

      gcmTokens.forEach(function(gcmToken){

          var body ={ 
              data: {msg: message},
              to : gcmToken
            };
          // An object of options to indicate where to post to
          var options = {
              url:'https://gcm-http.googleapis.com/gcm/send',
              headers:{
                'Content-Type': 'application/json',
                'Authorization': 'key=AIzaSyBOuKBkECGJUwFIatwp_tam-We7jQCDH20'
              },
              body:JSON.stringify(body)
          };

          function callback(error, response, body) {
            if (!error && response.statusCode == 200) {
              var info = JSON.parse(body);
              console.log('~~~ notificaiton success~~~~',body);
            }else{
              console.log('~~~notificaiton error~~~',body);
            }
          }

          request.post(options, callback);  
      });  
  }
}