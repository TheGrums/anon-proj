//  Adding several properties to strings

String.prototype.noWhiteSpaces = function(){
  return this.replace(/\s/g,"");
};
String.prototype.hasWhiteSpaces = function(){
  return /\s/.test(this);
};
String.prototype.noSpecChars = function(){
  var newst = this.replace(/[=%&\|\#\+\*\[\]\:]/g," ");
  return newst.replace(/\([A-Za-z0-9]*\)/g,"");
}
String.prototype.extractUid = function(){
  if(/[*]/.test(this))return this.split(/[*]/)[1];
  else return this;
}
String.prototype.extractGenre = function(){
  if(/[*]/.test(this))return this.split(/[*]/)[0];
  else throw "No genre found !".err();
}

//  Little magic twist to write less
String.prototype.err = function(){
  return new Error(this);
}

//  Creating an Object to answer a stream request with more flexibility
//  Currently covering play and stop functions
var streamResponse = function(req,res,data){

  this.req = req;
  this.res = res;
  this.data = data;
  this.man = require('./objectsCollection');

  this.play = function(genre){
    //  Lazyness
    var man = this.man;

    //  Those variables are to be sub-components of the responseObject
    var stream = {}, response = {}, outspeech = {}, directive = {}, audioItem = {};
    //  Generating adapted speech
    var speech = (typeof data.radios[0].Title !== "undefined"?"<speak>Playing "+(this.data.radios[0].Title==""?"music":"<emphasis>"+this.data.radios[0].Title)+"</emphasis> on "+this.data.radios[0].Name:"")+"</speak>";

    //  Building the response object step by step
    outspeech = new man.OutputSpeech(speech);
    stream = new man.Stream((typeof genre==="undefined"?this.data.radios[0].UID:genre+"*"+this.data.radios[0].UID), "", 0);
    audioItem = new man.AudioItem(stream);
    directive = new man.PlayDirective("REPLACE_ALL",audioItem,"AudioPlayer.Play");
    response = new man.Response(true,[directive],outspeech);

    if(/(Controller)/.test(req.body.request.type))delete(response.outputSpeech);

    return new man.responseObject(response);

  };

  this.stop = function(){
    var man = this.man;
    //  Wait for it...
    return new man.responseObject(new man.Response(true,[new man.PlayDirective(null,null,"AudioPlayer.Stop")]));
    //  Tadaaaam !
  };

  this.next = function(){
    var newrads = this.data.radios.map((a,b,c)=>{if(a.UID==this.req.body.context.AudioPlayer.token.extractUid())return c[(b+1)%c.length]; }, this);
    var finalarray = newrads.filter((a)=>{return typeof a!=="undefined";});
    this.data.radios = finalarray;
    return this.play(this.req.body.context.AudioPlayer.token.extractGenre());
  }

  this.previous = function(){
    var newrads = this.data.radios.map((a,b,c)=>{if(a.UID==this.req.body.context.AudioPlayer.token.extractUid())return c[(b-1<0?c.length-1:b-1)]; },this);
    var finalarray = newrads.filter((a)=>{return typeof a!=="undefined";});
    this.data.radios = finalarray;
    return this.play(this.req.body.context.AudioPlayer.token.extractGenre());
  }

}

//  Grabbing a streamurl
function getStreamUrl(resobj,cb,cbarg){


  if(!resobj.response.directives.length){ //  Avoid processing exception responses
    cb(resobj,cbarg);
    return;
  }

  var sreq = require('request');

  sreq.post({
    url:'http://optout.shoutcast.com/radioinfo.cfm',
    form:{
      "action":"uid",
      "uid":(resobj.response.directives[0].audioItem.stream.token.extractUid()),
      "limit":1,
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
function askShoutcast(searchkey, searchterm, cb, req, res, ...addarg){
  var srequest = require('request');

  // Simulating <none found> in askShoutcast
  if(typeof searchterm === "undefined" || searchterm ==""){
    cb(JSON.parse({radios:[]}));
    return;
  }
  var form = {
    "action":"advancedsearch",
    "limit":15,
    "format":"json",
    "extended":"yes",
    "caller":"alexa"
  };
  form[searchkey] = searchterm;
  srequest.post({
    url:'http://optout.shoutcast.com/radioinfo.cfm',
    form:form
  },
  function(err,res,body){

    //  If the requested name is not found and has white spaces, try without them.
    if((typeof JSON.parse(body).radios === "undefined"||!JSON.parse(body).radios.length)&&searchterm.hasWhiteSpaces()){
      var newst = searchterm.noWhiteSpaces();
      askShoutcast(searchkey, newst, cb, req, res, addarg);
    }
    else cb(JSON.parse(body),req,res, addarg);
  });

}

//  This function acts like a filter, it throws errors for specific cases (UID missing, no radios found)
//  and executes a callback function that accepts another function as argument (cbarg) (mostly the original callback function that executes res.json())
//  that's tricky but made to keep a pure function
//  do not use this function unless you understand how it works

function filterData(data,req,cb1,cbarg,...args){

  if(typeof data.radios === "undefined"||!safeStationList(data).radios.length){
    throw ("I couldn't find any station named "+req.body.request.intent.slots.Radio.value+".").err();
  }
  else if(safeStationList(data).radios.length>1&&(typeof req.body.request.dialogState === "undefined"||req.body.request.dialogState=="STARTED")){
    var man = require('./objectsCollection');
    var msg = "<speak>This led me to several radio stations, could you be more specific ? Here is a sample of what I've found :";
    safeStationList(data).radios.slice(0,3).forEach((a)=>{msg+=" "+a.Name+"<break strength='medium' />";});
    msg+="</speak>";
    cbarg(new man.responseObject(new man.Response(false,[new man.ElicitDirective("Radio",new man.Intent(req.body.request.intent.name,{"Radio":new man.Slot("Radio")}),"Dialog.ElicitSlot")],new man.OutputSpeech(msg)))); // Executing the second callback function to respond directly
  }
  else if(typeof data.radios[0].UID==="undefined"||data.radios.UID==""){
    throw "<speak>Sorry<break strength='medium'/> this radio station can't be played due to technical reasons.</speak>".err();
  }
  else{
    cb1(cbarg,args);
  }

}

// This function is deleting non-playable content from shoutcast's answer

function safeStationList(data){

  var newdat = data;
  if(typeof newdat.radios==="undefined"||!newdat.radios.length){
    throw "<speak>I couldn't find such radio station available.</speak>".err();
  }
  var radios = newdat.radios;
  newdat.radios = radios.filter(function(a){
    return !(typeof a.UID === "undefined" || a.UID == "");
  });
  if(!newdat.radios.length){
    throw "<speak>The stations I've found can't be played currently.</speak>".err();
  }
  return newdat;

}

//  Having alexa talking, answering a question to get the track name played by a radio
//  callback function (cb) is supposed to send a server response and take json body as argument (in the following functions)

/*  Returning void */
function trackRespond(req,res,cb){
  askShoutcast("station", req.body.request.intent.slots.Radio.value, (data,req,res)=>{

    var man = require('./objectsCollection');
    try {filterData(data,req,(func)=>{func(new man.responseObject(new man.Response(true,[],new man.OutputSpeech("<speak><emphasis>"data.radios[0].Name+"</emphasis> is playing <emphasis>"+data.radios[0].Title+"</emphasis></speak>"))));},cb);}
    catch(err) {console.log("ERROR : "+err.message);simpleSpeechRespond(err.message,req,res,cb);}

  },req,res);

}


//  Asking alexa to play a specific music type
function streamGenreRespond(action,req,res,cb){
  var searchterm;

  if(action==1||action==-1){
    if(typeof req.body.context.AudioPlayer.token === "undefined"){simpleSpeechRespond("<speak>This can't be done<break strength='medium'/> sorry.</speak>",req,res,cb);return;}
    try{searchterm = req.body.context.AudioPlayer.token.extractGenre();}
    catch(err){console.log("ERROR : "+err.message);simpleSpeechRespond("<speak>This can't be done<break strength='medium'/> sorry.</speak>",req,res,cb);return;}
  }
  else if(action==0){
    if(typeof req.body.request.intent.slots.Genre.value === "undefined"||req.body.request.intent.slots.Genre.value==""){simpleSpeechRespond("<speak>An error occured.</speak>",req,res,cb);return;}
    searchterm = req.body.request.intent.slots.Genre.value;
  }
  askShoutcast("genre", searchterm, (data,req,res,addarg)=>{
  try{
      var sres = new streamResponse(req,res,safeStationList(data));
      var endres;
      if(addarg[0]==1)endres = sres.next();
      else if(addarg[0]==-1)endres = sres.previous();
      else endres = sres.play(addarg[1]);
      getStreamUrl(endres,(resobj,cbfunc)=>{cbfunc(resobj);},cb);
  }catch(err){
    console.log("ERROR : "+err.message);
    simpleSpeechRespond(err.message,req,res,cb);
  }

  },req,res,action,searchterm);

}

//  Needs review for purity

//  Asking alexa to start playing a stream
/*  Returning void */
function streamPlayRespond(req,res,cb){
  askShoutcast("station", req.body.request.intent.slots.Radio.value, (data,req,res)=>{
    var sres = new streamResponse(req,res,data);

    try {

      filterData(data,req,(cbfunc,stresponse)=>{

        getStreamUrl(stresponse[0].play(),(resobj,cbfunc)=>{
          cbfunc(resobj);
        },cbfunc);

      },cb,sres);

    } //  Callback executed after last external request (getting streamUrl)

    catch(err) {console.log("ERROR : "+err.message);simpleSpeechRespond(err.message,req,res,cb);}

  },req,res);
}

function streamResumeRespond(req,res,cb){

  if(typeof req.body.context.AudioPlayer.token === "undefined"){simpleSpeechRespond("<speak>This can't be done<break strength='medium'/> sorry.</speak>",req,res,cb);return;}

  try {
    let genre = req.body.context.AudioPlayer.token.extractGenre();
    let sres = new streamResponse(req,res,{"radios":[{"UID":req.body.context.AudioPlayer.token.extractUid()}]}); //  Sending fake data, containing only UID, won't matter, .play() is secure
    getStreamUrl(sres.play(genre), (resobj,cb)=>{cb(resobj);}, cb);
  }
  catch(err){
    let sres = new streamResponse(req,res,{"radios":[{"UID":req.body.context.AudioPlayer.token.extractUid()}]}); //  Sending fake data, containing only UID, won't matter, .play() is secure
    getStreamUrl(sres.play(), (resobj,cb)=>{cb(resobj);}, cb);
  }

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
  cb(new man.responseObject(new man.Response(true,[],new man.OutputSpeech(text))));
}

//  Exporting functions
module.exports = {
  streamResumeRespond : streamResumeRespond,
  streamGenreRespond : streamGenreRespond,
  trackRespond : trackRespond,
  streamPlayRespond : streamPlayRespond,
  streamStopRespond : streamStopRespond,
  simpleSpeechRespond : simpleSpeechRespond
}
