function askShoutcast(req, cb){

  var srequest = require('request');
  var requestdata = JSON.parse(req);
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
      "limit":1,
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
    console.log(data);
    responseObject.response.outputSpeech.text = (data.radios.length ? data.radios[0].Name+" is playing "+data.radios[0].Title:"I couldn't find such radio on shoutcast.com");
    res.json(responseObject);
  });

}

module.exports = {
  respond : buildResponse
}
