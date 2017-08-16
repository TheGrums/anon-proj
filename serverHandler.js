
function buildResponse(res){
  return res.json({
  "version": "1.0",
  "sessionAttributes": {
    "supportedHoriscopePeriods": {
      "daily": true,
      "weekly": false,
      "monthly": false
    }
  },
  "response": {
    "outputSpeech": {
      "type": "PlainText",
      "text": "Today will provide you a new learning opportunity.  Stick with it and the possibilities will be endless. Can I help you with anything else?"
    },
    "shouldEndSession": false
  }
});
}

function startServer(){

  let express = require('express'),
      bodyParser = require('body-parser'),
      app = express();
      alexaVerifier = require('alexa-verifier');

  function requestVerifier(req, res, next) {
      alexaVerifier(
          req.headers.signaturecertchainurl,
          req.headers.signature,
          req.rawBody,
          function verificationCallback(err) {
              if (err) {
                  res.status(401).json({ message: 'Verification Failure', error: err });
              } else {
                  next();
              }
          }
      );
  }

  app.use(bodyParser.json());

  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  app.post('/', requestVerifier, function(req, res) {
      buildResponse(res);
  });

  app.listen(8888);

}

module.exports = {
  start : startServer
}
