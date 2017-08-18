//  Creating an Object to answer a stream request with more flexibility
//  Currently covering play and stop functions
var streamResponse = function(req,res,data){

  this.req = req;
  this.res = res;
  this.data = data;
  this.man = require('./objectsCollection');

  this.play = function(){

    //  Lazyness
    var man = this.man;

    //  Those variables are to be sub-components of the responseObject
    var stream = {}, response = {}, outspeech = {}, directive = {}, audioItem = {};

    //  Generating adapted speech
    var speech = "Playing music from shoutcast.com";
    var finalspeech = exceptionSpeech(data,speech);

    //  Checking radio validity
    if(validRadio(this.data.radios[0]))finalspeech = "This radio cannot be played.";

    if(finalspeech!=speech){//  if we didn't find any radio or several or only invalid radios
      response=new man.Response(false, [], new man.OutputSpeech(finalspeech));
      return new man.responseObject(response);
    }
    else {
      finalspeech = "Playing "+(this.data.radios[0].Title==""?"music":this.data.radios[0].Title)+" on "+this.data.radios[0].Name;
    }

    //  Building the response object step by step
    outspeech = new man.OutputSpeech(finalspeech);

    stream = new man.Stream(this.data.radios[0].UID, "https://listen.shoutcast.com/ledjamradio.mp3", 0);

    audioItem = new man.AudioItem(stream);

    directive = new man.Directive("REPLACE_ALL",audioItem,"AudioPlayer.Play");

    response = new man.Response(true,[directive],outspeech);

    return new man.responseObject(response);

  };

  this.stop = function(){
    var man = this.man;
    //  Wait for it...
    return new man.responseObject(new man.Response(false,[new man.Directive(null,null,"AudioPlayer.Stop")],new man.OutputSpeech(speech)));
    //  Booom !
  };

}


/*  Returning void - calling an ENDPOINT function as callback */
function askShoutcast(req, cb){

  var srequest = require('request');
  var requestdata = req.body;
  var searchterm = requestdata.request.intent.slots.Radio.value;

  // Simulating <none found> in askShoutcast
  if(searchterm == 'undefined' || searchterm ==""){
    cb(JSON.parse({radios:[]}));
    return;
  }
  console.log("-- SHOUTCAST REQUEST --");console.log(JSON.stringify({
    "action":"search",
    "string":searchterm,
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

//  This function is used to determine weither the radio can be played
//  Checking if it has an uid and a valid ssl certificate

/*  Returning bool */
function validRadio(radioData){

}

//  This function modifies the speech data only if needed
//  (if no radio or several radios have been found)

/*  Returning string */
function exceptionSpeech(data, speech){

  var speech2 = speech;

  if(data.radios.length==0)
    speech2 = "I couldn't find such radio.";

  else if(data.radios.length>1){
    speech2 = "I found several radios, could you be more specific. Here is a sample of what I found : ";
    data.radios.forEach(function(rad){speech2+=rad.Name+", "});
    speech2[-2]='.';
  }

  return speech2;

}


//  Having alexa talking, answering a question to get the track name played by a radio
//  callback function is supposed to send a server response and take json body as argument

/*  Returning void */
function trackRespond(req,res,cb){

  var responseObject =
  {
    "version": "1.0",
    "response": {
      "outputSpeech": {
        "type": "PlainText"
      },
      "shouldEndSession": false
    }
  }

  askShoutcast(req, (data)=>{

    var speech = data.radios[0].Name+" is playing "+data.radios[0].Title; //  Here is what alexa will tell the user, default value set
    var finalspeech = exceptionSpeech(data,speech);

    responseObject.response.outputSpeech.text = finalspeech;
    cb(responseObject);

  });

}


//  Asking alexa to start playing a stream
//  callback function is supposed to send a server response and take json body as argument

/*  Returning void */
function streamPlayRespond(req,res,cb){
  askShoutcast(req, (data)=>{
    var sres = new streamResponse(req,res,data);
    cb(sres.play());
  });

}

//  Exporting functions
module.exports = {
  trackRespond : trackRespond,
  streamPlayRespond : streamPlayRespond
}
