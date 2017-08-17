function askShoutcast(req, cb){

  var srequest = require('request');

  srequest.post({
    url:'http://optout.shoutcast.com/radioinfo.cfm',
    form:{
      "action":"uid",
      "uid":"41CD62A6-6CFE-4AEA-9038-226715492F0A",
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
    responseObject.response.outputSpeech.text = data.radios[0].Name+" is playing "+data.radios[0].Title;
    res.json(responseObject);
  });

}

module.exports = {
  ask : askShoutcast,
  respond : buildResponse
}
