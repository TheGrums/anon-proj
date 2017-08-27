/*
  Here's all the code for handling requests and intents only
  the skill logic is not contained here, have a look at responseBuilder.js instead
*/

//  This function is a router-like function
//  to handle different types of requests
function requestDispatch(req, res, cb){
  var requestType = req.body.request.type;
  var responder = require('./responseBuilder');

  //  Aborting for requests that doesn't require responses
  var no_ans = ["System.ExceptionEncountered","AudioPlayer.PlaybackFinished","AudioPlayer.PlaybackNearlyFinished","AudioPlayer.PlaybackStarted","AudioPlayer.PlaybackStopped"];
  if(no_ans.indexOf(requestType)!=-1){cb({});return;}


  switch(requestType){
    case "IntentRequest":
      try {intentDispatch(req,res,cb);}
      catch(err) {throw err;}
    break;
    case "PlaybackController.PauseCommandIssued":
      responder.streamStopRespond(req,res,cb);
    break;
    case "PlaybackController.PlayCommandIssued":
      responder.streamResumeRespond(req,res,cb);
    break;
    case "PlaybackController.NextCommandIssued":
      responder.streamGenreRespond(1,req,res,cb);
    break;
    case "PlaybackController.PreviousCommandIssued":
      responder.streamGenreRespond(-1,req,res,cb);
    break;
    case "LaunchRequest":
      throw "Shoutcast is ready to listen.";
    break;
    case "AudioPlayer.PlaybackFailed":
      responder.streamStopRespond(req,res,cb);
    break;
    default:
      throw "<speak>I'm quite sure that this isn't possible.</speak>";
    break;
  }
}

//  This function is a kind of router for handling
//  each intent separately
function intentDispatch(req,res,cb){
  var intentName = req.body.request.intent.name;
  var responder = require('./responseBuilder');

  var exceptions = ["AMAZON.LoopOffIntent","AMAZON.LoopOnIntent","AMAZON.RepeatIntent","AMAZON.ShuffleOffIntent","AMAZON.ShuffleOnIntent","AMAZON.StartOverIntent"];
  if(exceptions.indexOf(intentName)!=-1){throw "<speak>I can't execute your orders, human lord.</speak>";return;}

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
    case "AMAZON.CancelIntent":
      responder.streamStopRespond(req,res,cb);
    break;
    case "AMAZON.PreviousIntent":
      responder.streamGenreRespond(-1,req,res,cb);
    break;
    case "AMAZON.NextIntent":
      responder.streamGenreRespond(1,req,res,cb);
    break;
    case "AMAZON.HelpIntent":
      responder.simpleSpeechRespond("<speak>The shoutcast skill allows you to listen to any radio station registered on shoutcast.com. Try <emphasis level='strong'> Alexa, ask shoutcast to start pandashowradio </emphasis> <break strength='moderate'/> or <emphasis level='strong'>Alexa, ask shoutcast what's on pandashowradio</emphasis><break strength='strong'> If you don't know any station name try <emphasis level='strong'>Alexa, ask shoutcast to play blues songs</emphasis>.</speak>",req,res,cb);
    break;
    case "AMAZON.ResumeIntent":
      responder.streamResumeRespond(req,res,cb);
    break;
    case "AMAZON.CancelIntent":
      responder.streamStopRespond(req,res, cb);
    break;
    case "getRadioGenre":
      responder.streamGenreRespond(0,req,res,cb);
    break;
    default:
      throw "<speak>Sorry <break strength='medium'/> I can't do that.</speak>";
    break;
  }

}

//  Function to start listening
function startServer(){

  var express = require('express'), app = express(), bodyParser=require('body-parser'), verifier = require('alexa-verifier-middleware');

  //  Defining middelware setting up headers
  app.use(verifier);
  app.use(bodyParser.json());
  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  //  Handling post requests from amazon
  app.post('/', function(req, res) {
    try{
      requestDispatch(req, res, (jsonBody)=>{res.json(jsonBody);} );//  Dispatching and responding
    }
    catch(err){ //  catching dispatching errors
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
