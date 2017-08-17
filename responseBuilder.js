function askShoutcast(req, cb){

  var srequest = require('request');
  var requestdata = req.body;
  var searchterm = requestdata.request.intent.slots.Radio.value;

  // Simulating <none found> in askShoutcast
  if(searchterm == 'undefined' || searchterm ==""){
    cb(JSON.parse({radios:[]}));
    return;
  }

  srequest.post({
    url:'http://optout.shoutcast.com/radioinfo.cfm',
    form:{
      "action":"search",
      "string":searchterm,
      "limit":3,
      "format":"json",
      "extended":"yes"
    }
  },
  function(err,res,body){
    cb(JSON.parse(body));
  });

}

//  This function modifies the speech data only if needed
//  (if no radio or several radios have been found)
function exceptionSpeech(data, speech){

  var speech2 = speech;

  if(data.radios.length!=1)
    speech2 = data.radios[0].Name+" is playing "+data.radios[0].Title;

  else if(data.radios.length>1){
    speech2 = "I found several radios, could you be more specific. Here is a sample of what I found : ";
    data.radios.forEach(function(rad){speech2+=rad.Name+", "});
    speech2[-2]='.';
  }

  return speech2;

}

function buildTrackResponse(req,res){

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

  askShoutcast(req, function(data){

    var speech = data.radios[0].Name+" is playing "+data.radios[0].Title; //  Here is what alexa will tell the user, default value set
    var finalspeech = exceptionSpeech(data,speech);

    responseObject.response.outputSpeech.text = finalspeech;
    res.json(responseObject);
  });

}

var streamResponse = function(req,res,data){

  this.req = req;
  this.res = res;
  this.data = data;
  this.responseObject = {
    "version": "1.0",
    "response": {
      "outputSpeech": {
        "type": "PlainText"
      },
      "directives": [
        {
          "playBehavior":"REPLACE_ALL",
          "audioItem":{
            "stream": {
              "offsetInMilliseconds":0
            }
          }
        }
      ],
      "shouldEndSession": true
    }
  };

  this.play = function(){

    //  Generating adapted speech
    var speech = "Playing "+this.data.radios[0].Title+" on "+this.data.radios[0].Name;
    var finalspeech = exceptionSpeech(data,speech);

    if(data.radios[0].UID=='undefined'||data.radios[0].UID==""){
      finalspeech = "This radio cannot be played. Ask them to provide a fucking ssl certificate or to move to shoutcast.com";
      this.responseObject.directives = null;
      return;
    }

    this.responseObject.outputSpeech.text = finalspeech;

    //  Defining action
    this.responseObject.response.directives.type="AudioPlayer.Play";

    //  Adding stream informations
    this.responseObject.response.directives.audioItem.stream.token = this.data.radios[0].Uid

  };

  this.stop = function(){

    //  Generating adapted speech
    var speech = "";
    this.responseObject.outputSpeech.text = speech;

    //  Defining action
    this.responseObject.response.directives.type="AudioPlayer.Stop";

  };

}

function buildStreamResponse(req,res){

}

//  Exporting functions
module.exports = {
  trackResponse : buildTrackResponse,
  streamResponse : buildStreamResponse
}
