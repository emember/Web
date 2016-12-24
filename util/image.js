var path = require('path');
var fs = require('fs');
var imageBase=path.join(__dirname, '../public/images/');

function mkdirp(filepath) {
    var dirname = path.dirname(filepath);

    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname);
    }
}

module.exports = 
{
  save: function(file,image) {
  	mkdirp(imageBase+file);

  	var base64Data = image.replace(/^data:image\/png;base64,/, "");

	fs.writeFile(imageBase+file, base64Data, { flag: 'w', encoding :'base64' }, function(err) {
    	console.log(err);
    });
  }  
}
