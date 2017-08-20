/*
  Here's all the code for handling requests and intents only
  the skill logic is not contained here, have a look at responseBuilder.js instead
*/

//  This function is a router-like function
//  to handle different types of requests
function requestDispatch(req, res, cb){
  var requestType = req.body.request.type;
  var responder = require('./responseBuilder');

  switch(requestType){
    case "IntentRequest":
      intentDispatch(req,res,cb);
    break;
    case "PlaybackController.PauseCommandIssued":
      responder.streamStopRespond(req,res,cb);
    break;
    case "PlaybackController.PlayCommandIssued":
      throw "Please specify the radio station you want to listen to.";
    break;
    case "LaunchRequest":
      throw "Ready to listen";
    break;
    default:
      throw "This functionality is not implemented yet.";
    break;
  }
}


//  This function is a kind of router for handling
//  each intent separately
function intentDispatch(req,res,cb){
  var intentName = req.body.request.intent.name;
  var responder = require('./responseBuilder');

  switch(intentName){
    case "getRadioTrack":
      responder.trackRespond(req,res,cb);
    break;
    case "getRadioStream":
      responder.streamPlayRespond(req,res,cb);
    break;
    case "AMAZON.PauseIntent":
      responder.streamStopRespond(req,res,cb);
    break;
    default:
      throw "This functionality is not implemented yet.";
    break;
  }

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
    console.log("-- REQUEST --");console.log(JSON.stringify(req.body, null, 2));
    try{
      requestDispatch(req,res, (jsonBody)=>{console.log("-- RESPONSE --");console.log(JSON.stringify(jsonBody, null, 2));res.json(jsonBody);} );//  Dispatching and responding
    }
    catch(err){
      var responder = require('./responseBuilder');
      responder.simpleSpeechRespond(err,req,res,(jsonBody)=>{res.json(jsonBody)});
    }
  });

  //  Listening to a specific port, 8888 is defined for testing purposes
  app.listen(8888);

}

//  Exporting functions
module.exports = {
  start : startServer
}
