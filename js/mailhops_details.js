var port = browser.runtime.connect({ name: "MailHops" });
port.postMessage({ command: "details" });

port.onMessage.addListener(function(msg) {
  updateContent(msg);  
  document.getElementById("mh-map-button").addEventListener("click", function () {
    browser.tabs.create({ url: msg.message.map_url });  
  });
});

document.getElementById("mh-options-button").addEventListener("click", function () {
  browser.tabs.create({ url: '/content/preferences.html' });  
});

function updateContent(msg) {    
  
  if (msg.message.error) {
    document.getElementById('hop-message').classList.add('warning');
    document.getElementById('mh-map-button').style.display = 'none';    
    document.getElementById('hop-message-header').innerHTML = msg.message.error;
    return;
  }
  document.getElementById('hop-message').classList.remove('warning');
  document.getElementById('mh-map-button').style.display = 'inline-block';
  
  const route = msg.response.route || [];
  const sender = msg.message.sender || null;
  const unit = msg.unit || "mi";
  let client = null;
  let items = [];
  
  for (var i = 0; i < route.length; i++) { 
    var header = 'Private';
    var icon = '/images/local.png';
    var distance = '';
    // set the client route
    if (route[i].client)
      client = route[i];
    
    if(route[i].countryCode)
      icon = '/images/flags/' + route[i].countryCode.toLowerCase() + '.png';
    
    if(route[i].city && route[i].state)      
      header = route[i].city + ', ' + route[i].state;                
    else if(route[i].city && route[i].countryCode)      
      header = route[i].city + ', ' + route[i].countryCode;        
    else if (route[i].city)              
      header = route[i].city;               
    else if (route[i].state)              
      header = route[i].state;               
    else if (route[i].countryName)           
      header = route[i].countryName;                
    
    var description = '<a href="https://mailhops.com/whois/' + route[i].ip + '" target="_blank" title="Who Is?">' + route[i].ip + '</a><br/>';
    
    if (msg.message.secure.indexOf(route[i].ip) !== -1) {
      description += '<img src="/images/auth/lock.png" title="Used TLS or SSL" /> ';
    }
    
    if (route[i].host)          
      description += route[i].host;
    if (route[i].whois && route[i].whois.descr)          
      description += route[i].whois.descr;
    if (route[i].whois && route[i].whois.netname)          
      description += route[i].whois.netname;
    
    var weather = '';
    if (route[i].weather) {
      weather = ' <img src="' + route[i].weather.icon_url + '" width="25" /> ';
      weather += Math.round(route[i].weather.temp).toString() + '°' + route[i].weather.temp_unit+' ';        
      weather += route[i].weather.summary;        
    }
      
    var asn = '';
    if (route[i].asn) {
      asn = '<br/>ASN Org: ' + route[i].asn.autonomous_system_organization;
      asn += ' (<a href="https://dnschecker.org/asn-whois-lookup.php?query='+route[i].asn.autonomous_system_number+'" target="_blank" title="ASN Lookup">' + route[i].asn.autonomous_system_number + '</a>)'
    }
    
    var auth = '';
    if (msg.message.auth.length) {
      for (var a = 0; a < msg.message.auth.length; a++){
        if(msg.message.auth[a].icon)
          auth += '<label class="tiny ui label ' + msg.message.auth[a].color + '"><img src="' + msg.message.auth[a].icon + '"/>' + msg.message.auth[a].type + ' ' + msg.message.auth[a].copy + '</label>';        
        else if(msg.message.auth[a].link)
          auth += '<a class="tiny ui label ' + msg.message.auth[a].color + '" href="'+msg.message.auth[a].link+'" target="_blank">' + msg.message.auth[a].type + '</a>';        
      }
    }
    // append child
    items.push('<div class="item">\
    <div class="content">\
    <div class="header"><img src="'+ icon + '" /> ' + header + weather +' <label class="ui circular label icon" style="float: right;">'+ (i + 1) +'</label></div>\
    <div class="description">'+ description + asn + '</div>\
    </div>\
    </div>');    
  }
  // header
  document.getElementById('hop-message-header').innerHTML = `${route.length} Hops`;
  if (sender && client) {    
    document.getElementById('hop-message-header').innerHTML += ' over '+MailHopsUtils.getDistance(sender, client, unit) + ' ' + unit;    
  }
  // hop list
  document.getElementById('hop-list').innerHTML = items.join('');
  try {
    document.getElementById('mh-auth').innerHTML = auth;    
  } catch (error) {
    console.error('MailHops', error);
  }
}