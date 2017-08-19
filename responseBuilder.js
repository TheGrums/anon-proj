//  Creating an Object to answer a stream request with more flexibility
//  Currently covering play and stop functions
var streamResponse = function(req,res,data){

  this.req = req;
  this.res = res;
  this.data = data;
  this.man = require('./objectsCollection');

  this.play = function(cb){

    //  Lazyness
    var man = this.man;

    //  Those variables are to be sub-components of the responseObject
    var stream = {}, response = {}, outspeech = {}, directive = {}, audioItem = {};

    //  Generating adapted speech
    var speech = "Playing music from shoutcast.com";
    var finalspeech = exceptionSpeech(data,speech);

    //  Checking radio validity, if we have results but they do not have any uid
    if(finalspeech==speech&&(this.data.radios[0].UID==""||!Boolean(this.data.radios[0])))finalspeech = "This radio station cannot be played.";

    if(finalspeech!=speech){//  if we didn't find any radio or several or only invalid radios
      response=new man.Response(false, [], new man.OutputSpeech(finalspeech));
      return new man.responseObject(response);
    }
    else {
      finalspeech = "Playing "+(this.data.radios[0].Title==""?"music":this.data.radios[0].Title)+" on "+this.data.radios[0].Name;
    }

    //  Building the response object step by step
    outspeech = new man.OutputSpeech(finalspeech);

    stream = new man.Stream(this.data.radios[0].UID, "", 0);

    audioItem = new man.AudioItem(stream);

    directive = new man.Directive("REPLACE_ALL",audioItem,"AudioPlayer.Play");

    response = new man.Response(true,[directive],outspeech);

    return new man.responseObject(response);

  };

  this.stop = function(){
    var man = this.man;
    //  Wait for it...
    return new man.responseObject(new man.Response(false,[new man.Directive(null,null,"AudioPlayer.Stop")]));
    //  Tadaaaam !
  };

}

function getStreamUrl(resobj,cb){

  console.log(JSON.stringify(resobj,null,2));
  if(!resobj.response.directives.length){ //  Avoid processing exception responses
    cb(resobj);
    return;
  }

  var sreq = require('request');

  sreq.post({
    url:'http://optout.shoutcast.com/radioinfo.cfm',
    form:{
      "action":"uid",
      "uid":resobj.response.directives[0].audioItem.stream.token,
      "limit":3,
      "format":"json",
      "extended":"yes",
      "caller":"alexa"
    }
  },
  function(err,res,body){
    resobj.response.directives[0].audioItem.stream.url = "https://listen.shoutcast.com/"+JSON.parse(body).radios[0].RadUrl;
    cb(resobj);
  });

}

/*  Returning void */
function askShoutcast(req, cb){

  var srequest = require('request');
  var requestdata = req.body;
  var searchterm = requestdata.request.intent.slots.Radio.value;

  // Simulating <none found> in askShoutcast
  if(searchterm == 'undefined' || searchterm ==""){
    cb(JSON.parse({radios:[]}));
    return;
  }
  console.log("-- SHOUTCAST REQUEST --");
  console.log(JSON.stringify({
    "action":"advancedsearch",
    "station":searchterm,
    "limit":3,
    "format":"json",
    "extended":"yes",
    "caller":"alexa"
  }, null, 2));
  srequest.post({
    url:'http://optout.shoutcast.com/radioinfo.cfm',
    form:{
      "action":"search",
      "string":searchterm,
      "limit":3,
      "format":"json",
      "extended":"yes",
      "caller":"alexa"
    }
  },
  function(err,res,body){
    console.log("-- SHOUTCAST RESPONSE --");console.log(JSON.stringify(JSON.parse(body), null, 2));
    cb(JSON.parse(body));
  });

}

//  This function modifies the speech data only if needed
//  (if no radio or several radios have been found)

/*  Returning string */
function exceptionSpeech(data, speech){

  var speech2 = speech;

  if(!data.radios||data.radios.length==0)
    speech2 = "I couldn't find such radio.";

  else if(data.radios.length>1){
    speech2 = "I found several radios, could you be more specific. Here is a sample of what I found : ";
    data.radios.forEach(function(rad){speech2+=rad.Name+", "});
    speech2[-2]='.';
  }

  return speech2;

}


//  Having alexa talking, answering a question to get the track name played by a radio
//  callback function (cb) is supposed to send a server response and take json body as argument (in the following functions)

/*  Returning void */
function trackRespond(req,res,cb){
  askShoutcast(req, (data)=>{

    var man = require('./objectsCollection');
    var finalspeech = (exceptionSpeech(data,"")==""||!data.radios?exceptionSpeech(data,""):data.radios[0].Name+" is playing "+data.radios[0].Title);
    cb(new man.responseObject(new man.Response(false,[],new man.OutputSpeech(speech))));

  });

}

//  Asking alexa to start playing a stream
/*  Returning void */
function streamPlayRespond(req,res,cb){
  askShoutcast(req, (data)=>{
    var sres = new streamResponse(req,res,data);
    getStreamUrl(sres.play(),(resobj)=>{ cb(resobj); }); //  Callback executed after last external request (getting streamUrl)
  });
}

//  Asking alexa to stop playing a stream
/*  Returning void */
function streamStopRespond(req,res,cb){
  var sres = new streamResponse(req,res,{});
  cb(sres.stop());
}


//  Having alexa talking
/*  Returning void */
function simpleSpeechRespond(text,req,res,cb){
  var man = require('./objectsCollection');
  cb(new man.responseObject(new man.Response(true,[],new man.OutputSpeech(text))));
}

//  Exporting functions
module.exports = {
  trackRespond : trackRespond,
  streamPlayRespond : streamPlayRespond,
  streamStopRespond : streamStopRespond,
  simpleSpeechRespond : simpleSpeechRespond
}
