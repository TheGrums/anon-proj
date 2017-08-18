//  Reproducing the response logic
//  At the end responseObject is to be serialized to
//  produce a server response that satisfies the amazon requirements


var Stream = function(t,u,oim){// String(token), string, int
  this.token = t;
  this.url = u;
  this.offsetInMilliseconds = oim;
}

var AudioItem = function(stream){ // Stream object
  this.stream = stream;
}

var Directive = function(playBehavior,audioItem,type){ // String, AudioItem object, string
  this.audioItem = audioItem;
  this.playBehavior = playBehavior;
  this.type = type;
}

var OutputSpeech = function(text){  // String
  this.type = "PlainText"; //  Assuming type will always be text
  this.text = text;
}

var Response = function(shouldEndSession, directives, outsp){ // bool, array[Directive object], OutputSpeech Object
  this.directives = directives;
  this.outputSpeech = outsp;
  this.shouldEndSession = shouldEndSession;
}

var responseObject = function(response){ // Response object
  this.version = "1.0";
  this.response = response;
}

module.exports = {
  Stream : Stream,
  AudioItem : AudioItem,
  Directive : Directive,
  OutputSpeech : OutputSpeech,
  Response : Response,
  responseObject: responseObject
}
