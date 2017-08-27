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

var PlayDirective = function(playBehavior,audioItem,type){ // String, AudioItem object, string
  this.audioItem = audioItem;
  this.playBehavior = playBehavior;
  this.type = type;
}

var ElicitDirective = function(slotToElicit, updatedIntent, type){
  this.slotToElicit = slotToElicit;
  this.updatedIntent = updatedIntent;
  this.type = type;
}

var Slot = function(name){
  this.name = name;
  this.confirmationStatus = "NONE";
}

var Intent = function(name,slots){//  slots has to be a list of Slot objects
  this.name = name;
  this.confirmationStatus = "NONE";
  this.slots = slots;
}

var OutputSpeech = function(text){  // String
  this.type = "SSML";
  this.ssml = text;
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

responseObject.prototype.mute = function(){
  let newthis = this;
  remove(newthis.response.outputSpeech);
  return newthis;
}

module.exports = {
  Stream : Stream,
  AudioItem : AudioItem,
  PlayDirective : PlayDirective,
  Slot : Slot,
  ElicitDirective : ElicitDirective,
  Intent : Intent,
  OutputSpeech : OutputSpeech,
  Response : Response,
  responseObject: responseObject
}
