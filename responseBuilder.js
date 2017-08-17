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
      "format":"json"
    }
  },
  function(err,res,body){
    cb(JSON.parse(body));
  });

}

function buildResponse(req,res){

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

    var speech = "I couldn't find such radio on shoutcast.com"; //  Here is what alexa will tell the user, default value set

    if(data.radios.length==1)
      speech = data.radios[0].Name+" is playing "+data.radios[0].Title;

    else if(data.radios.length>1){
      speech = "I found several radios, could you be more specific. Here is a sample of what I found :";
      data.radios.forEach(function(rad){speech+=" "+rad.Name});
    }

    responseObject.response.outputSpeech.text = speech;
    res.json(responseObject);
  });

}

//  Exporting functions
module.exports = {
  respond : buildResponse
}
