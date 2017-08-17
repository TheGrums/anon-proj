function askShoutcast(req){
  var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
  var shoutcastRequest = new XMLHttpRequest();

  shoutcastRequest.onreadystatechange = function() {
    if(this.readyState == 4 && this.status == 200){return JSON.parse(shoutcastRequest.responseText);}
  }
  shoutcastRequest.open("POST","http://optout.shoutcast.com/radioinfo.cfm?action=uid&uid=41CD62A6-6CFE-4AEA-9038-226715492F0A&limit=1&format=json");
  shoutcastRequest.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  shoutcastRequest.send();

}

module.exports = {
  ask : askShoutcast
}
