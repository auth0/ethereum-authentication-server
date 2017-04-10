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

const dbService = require('../wrappers/dbServiceWrapper.js'),
	  applicationConfiguration = require('../configuration/applicationConfigurationService.js'),
	  mandrill = require('mandrill-api/mandrill'),
	  mandrill_client = new mandrill.Mandrill(applicationConfiguration.mandrillKey),
      log = require('../../util/log.js');

module.exports = (function init() {
	
	var async = false;
	var ip_pool = "Main Pool";
	var send_at = null;
	
	return {
		sendEmail : function sendEmail(message) {
			return Q.fcall(function () {
                mandrill_client.messages.send({"message": message.toEmail(), "async": async, "ip_pool": ip_pool, "send_at": send_at}, function(result) {
                    console.log(result);
                }, function(e) {
                    console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
                });
            })
		}
	};
})();