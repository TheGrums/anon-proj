let express = require('express'),
    bodyParser = require('body-parser'),
    app = express();

app.use(bodyParser.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.post('/', function(req, res) {
    res.json({
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
    "card": {
      "type": "Simple",
      "title": "Horoscope",
      "content": "Today will provide you a new learning opportunity.  Stick with it and the possibilities will be endless."
    },
    "reprompt": {
      "outputSpeech": {
        "type": "PlainText",
        "text": "Can I help you with anything else?"
      }
    },
    "shouldEndSession": false
  }
});
});
app.listen(8888);
