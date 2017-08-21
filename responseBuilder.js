//  Adding several properties to strings

String.prototype.noWhiteSpaces = function(){
  return this.replace(/\s/,"");
};
String.prototype.hasWhiteSpaces = function(){
  return /\s/.test(this);
};
String.prototype.noSpecChars = function(){
  var newst = this.replace(/[=%&\|\#\+\*\[\]\:]/g," ");
  return newst.replace(/\([A-Za-z0-9]*\)/g,"");
}

//  Creating an Object to answer a stream request with more flexibility
//  Currently covering play and stop functions
var streamResponse = function(req,res,data){

  this.req = req;
  this.res = res;
  this.data = data;
  this.man = require('./objectsCollection');

  this.play = function(cb){

    //  Lazyness
    var man = this.man;

    //  Those variables are to be sub-components of the responseObject
    var stream = {}, response = {}, outspeech = {}, directive = {}, audioItem = {};

    //  Generating adapted speech
    var speech = "Playing "+(this.data.radios[0].Title==""?"music":this.data.radios[0].Title)+" on "+this.data.radios[0].Name;

    //  Building the response object step by step
    outspeech = new man.OutputSpeech(speech);
    stream = new man.Stream(this.data.radios[0].UID, "", 0);
    audioItem = new man.AudioItem(stream);
    directive = new man.PlayDirective("REPLACE_ALL",audioItem,"AudioPlayer.Play");
    response = new man.Response(true,[directive],outspeech);

    return new man.responseObject(response);

  };

  this.stop = function(){
    var man = this.man;
    //  Wait for it...
    return new man.responseObject(new man.Response(true,[new man.PlayDirective(null,null,"AudioPlayer.Stop")]));
    //  Tadaaaam !
  };

}

function getStreamUrl(resobj,cb,cbarg){

  console.log(JSON.stringify(resobj,null,2));
  if(!resobj.response.directives.length){ //  Avoid processing exception responses
    cb(resobj,cbarg);
    return;
  }

  var sreq = require('request');

  sreq.post({
    url:'http://optout.shoutcast.com/radioinfo.cfm',
    form:{
      "action":"uid",
      "uid":resobj.response.directives[0].audioItem.stream.token,
      "limit":3,
      "format":"json",
      "extended":"yes",
      "caller":"alexa"
    }
  },
  function(err,res,body){
    resobj.response.directives[0].audioItem.stream.url = "https://listen.shoutcast.com/"+JSON.parse(body).radios[0].RadUrl;
    cb(resobj,cbarg);
  });

}

/*  Returning void */
function askShoutcast(searchterm, cb){

  var srequest = require('request');

  // Simulating <none found> in askShoutcast
  if(searchterm == 'undefined' || searchterm ==""){
    cb(JSON.parse({radios:[]}));
    return;
  }

  srequest.post({
    url:'http://optout.shoutcast.com/radioinfo.cfm',
    form:{
      "action":"advancedsearch",
      "station":searchterm,
      "limit":3,
      "format":"json",
      "extended":"yes",
      "caller":"alexa"
    }
  },
  function(err,res,body){
    console.log("-- SHOUTCAST RESPONSE --");console.log(JSON.stringify(JSON.parse(body), null, 2));

    //  If the requested name is not found and has white spaces, try without them.
    var pat = /\s/;
    if(!JSON.parse(body).radios.length&&searchterm.hasWhiteSpaces()){
      var newst = searchterm.noWhiteSpaces();
      askShoutcast(newst, cb);
    }
    else cb(JSON.parse(body));
  });

}

//  This function acts like a filter, it throws errors for specific cases (UID missing, no radios found)
//  and executes a callback function that accepts another function as argument (cbarg) (mostly the original callback function that executes res.json())
//  that's tricky but made to keep a pure function
//  do not use this function unless you understand how it works

function filterData(data,req,cb1,cbarg,...args){

  if(!data.radios||!data.radios.length){
    throw "I couldn't find any station named "+req.body.request.intent.slots.Radio.value+".";
  }
  else if(data.radios.length>1){
    var man = require('./objectsCollection');
    var msg = "I found several radio stations, could you be more specific ? Here is a sample of what I've found :";
    data.radios.forEach((a)=>{msg+=" "+a.Name+",";});
    cbarg(new man.responseObject(new man.Response(false,[new man.ElicitDirective("Radio",new man.Intent(req.body.request.intent.name,{"Radio":new man.Slot("Radio")}),"Dialog.ElicitSlot")],new man.OutputSpeech(msg)))); // Executing the second callback function to respond directly
  }
  else{
    cb1(cbarg,args);
  }

}

//  Having alexa talking, answering a question to get the track name played by a radio
//  callback function (cb) is supposed to send a server response and take json body as argument (in the following functions)

/*  Returning void */
function trackRespond(req,res,cb){
  askShoutcast(req.body.request.intent.slots.Radio.value, (data)=>{

    var man = require('./objectsCollection');
    try {filterData(data,req,(func)=>{func(new man.responseObject(new man.Response(false,[],new man.OutputSpeech(data.radios[0].Name+" is playing "+data.radios[0].Title))));},cb);}
    catch(err) {simpleSpeechRespond(err,req,res,cb);}

  });

}

//  Needs review for purity

//  Asking alexa to start playing a stream
/*  Returning void */
function streamPlayRespond(req,res,cb){
  askShoutcast(req.body.request.intent.slots.Radio.value, (data)=>{
    var sres = new streamResponse(req,res,data);

    try {filterData(data,req,(cbfunc,stresponse)=>{
      getStreamUrl(stresponse[0].play(),(resobj,cbfunc)=>{
        cbfunc(resobj);
      },cbfunc);
    },cb,sres);} //  Callback executed after last external request (getting streamUrl)

    catch(err) {simpleSpeechRespond(err,req,res,cb);}

  });
}

//  Asking alexa to stop playing a stream
/*  Returning void */
function streamStopRespond(req,res,cb){
  var sres = new streamResponse(req,res,{});
  cb(sres.stop());
}


//  Having alexa talking
/*  Returning void */
function simpleSpeechRespond(text,req,res,cb){
  var man = require('./objectsCollection');
  cb(new man.responseObject(new man.Response(false,[],new man.OutputSpeech(text))));
}

//  Exporting functions
module.exports = {
  trackRespond : trackRespond,
  streamPlayRespond : streamPlayRespond,
  streamStopRespond : streamStopRespond,
  simpleSpeechRespond : simpleSpeechRespond
}
