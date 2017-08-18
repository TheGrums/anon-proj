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

  if(data.radios.length==0)
    speech2 = "I couldn't find such radio.";

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

    if(finalspeech!=speech){//  if we didn't find any radio or several
      this.responseObject.response.outputSpeech.text=finalspeech;
      this.responseObject.directives=null;
      this.responseObject.shouldEndSession=false;
      return;
    }

    if(data.radios[0].UID=='undefined'||data.radios[0].UID==""){
      finalspeech = "This radio cannot be played.";
      this.responseObject.response.outputSpeech.text = finalspeech;
      this.responseObject.response.directives = null;
      return;
    }

    this.responseObject.response.outputSpeech.text = finalspeech;

    //  Defining action
    this.responseObject.response.directives[0].type="AudioPlayer.Play";

    //  Adding stream informations
    this.responseObject.response.directives[0].audioItem.stream.token = this.data.radios[0].UID;
    this.responseObject.response.directives[0].audioItem.stream.url = "https://listen.shoutcast.com/ledjamradio.mp3";

  };

  this.stop = function(){

    //  Generating adapted speech
    var speech = "";
    this.responseObject.response.outputSpeech.text = speech;

    //  Defining action
    this.responseObject.response.directives[0].type="AudioPlayer.Stop";

  };

}

function buildStreamResponse(req,res){
  askShoutcast(req, function(data){

    var sres = new streamResponse(req,res,data);
    sres.play();
    console.log(sres.responseObject);
    console.log("--------");
    console.log({
      "version": "1.0",
      "response": {
        "outputSpeech": {
          "type": "PlainText",
          "text": "YOLO"
        },
        "directives": [
          {
            "type":"AudioPlayer.Play",
            "playBehavior":"REPLACE_ALL",
            "audioItem":{
              "stream": {
                "token":"sdlfhqsdmlfkjqsmdf",
                "url":"https://listen.shoutcast.com/ledjamradio.mp3",
                "offsetInMilliseconds":0
              }
            }
          }

        ],
        "shouldEndSession": true
      }
    });
    res.json(sres.responseObject);

  });

}

//  Exporting functions
module.exports = {
  trackResponse : buildTrackResponse,
  streamResponse : buildStreamResponse
}
