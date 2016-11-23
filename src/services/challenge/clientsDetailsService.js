/** 
* The MIT License (MIT) 
*  
* Copyright (c) 2016 Auth0, Inc. <support@auth0.com> (http://auth0.com) 
*  
* Permission is hereby granted, free of charge, to any person obtaining a copy 
* of this software and associated documentation files (the "Software"), to deal 
* in the Software without restriction, including without limitation the rights 
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell 
* copies of the Software, and to permit persons to whom the Software is 
* furnished to do so, subject to the following conditions: 
*  
* The above copyright notice and this permission notice shall be included in all 
* copies or substantial portions of the Software. 
*  
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
* SOFTWARE. 
*/
'use strict';

const geoIp2 = require('geoip2'),
	  publicIp = require('public-ip'),
      LOCAL_IP_REGEX = /(^127\.)|(^10\.)|(^172\.1[6-9]\.)|(^172\.2[0-9]\.)|(^172\.3[0-1]\.)|(^192\.168\.)/,
      DEFAULT_CITY = "London";

var serversIp;

geoIp2.init();

publicIp.v4().then(function(ip){
    serversIp = ip;
    console.log("Server's external ip is:" + serversIp);
});

module.exports = (function init(){
    return{
        getDetailsFromClient : function getDetailsFromClient(ip, userAgent){
            var clientsDetailsToReturn = {};
            var clientIpTrimmed = ip == "::1" ? "localhost" : ip.split(":")[3];//obtains 'clear' host
            var city;
            if (clientIpTrimmed == "localhost" || LOCAL_IP_REGEX.test(clientIpTrimmed)){//if it is local ip
                city = serversIp ? geoIp2.lookupSimpleSync(serversIp).city : DEFAULT_CITY;//gets location of server's ip
            }
            else {
                city = geoIp2.lookupSimpleSync(clientIpTrimmed).city;//gets location
            }
            clientsDetailsToReturn["city"] = city;
            clientsDetailsToReturn["ip"] = clientIpTrimmed;
            clientsDetailsToReturn["osAndWebBrowser"] = userAgent;
            return clientsDetailsToReturn;
        }
    }
})();