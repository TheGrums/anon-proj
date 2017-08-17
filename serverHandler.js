/*
  Here's all the code for handling requests and intents only
  the skill logic is not contained here, have a look at responseBuilder.js instead
*/


//  This function is a kind of router for handling
//  each intent separately
function intentDispatcher(req){

}

//  Function to start listening
function startServer(){

  let express = require('express'), app = express(), bodyParser=require('body-parser');

  //  Defining middelware setting up headers
  app.use(bodyParser.json());
  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  //  Handling post requests from amazon
  app.post('/', function(req, res) {
    console.log(req);
    var responder = require('./responseBuilder');
    responder.respond(req,res);
  });

  //  Listening to a specific port, 8888 is defined for testing purposes
  app.listen(8888);

}

//  Exporting functions
module.exports = {
  start : startServer
}
