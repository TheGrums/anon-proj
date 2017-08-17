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

  app.post('/', function(req, res) {
    var responder = require('./responseBuilder');
    responder.respond(req,res);
  });

  app.listen(8888);

}

module.exports = {
  start : startServer
}
