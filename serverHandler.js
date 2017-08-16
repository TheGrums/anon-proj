
function buildResponse(res){
  return res.json({This:"is magic"});
}


module.exports = {
  start : function(){
    let express = require('express'),
        bodyParser = require('body-parser'),
        app = express();


    app.use(bodyParser.json());
    app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
    });
    app.get('/', function(req, res) {
        buildResponse(res);
    });

    app.listen(8888);
  }
}
