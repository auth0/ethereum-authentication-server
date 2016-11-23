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

const Q = require('q'),
      EthCrypto = require('eth-crypto'),
      promiseMap = require('../maps/promiseMap.js'),
      requestIdChallengeMap = require('../maps/requestIdChallengeMap.js'),
      mobilePushNotificationService = require('./mobilePushNotificationService.js'),
      randomChallengeService = require('./randomChallengeService.js'),
      applicationConfiguration = require('../configuration/applicationConfigurationService.js'),
      log = require('../../util/log.js'),
      ethCrypto = new EthCrypto();

module.exports = (function init() {
	
	return {
		challengeMobile : function challengeMobile (request) {
			return randomChallengeService.generateRandomString()
			.then(function sendPushNotificationAndWaitForSignature(challengeString) {
				log.info(request.getRequestId() + ' starting challenge for registrationToken '
				    + request.getRegistrationToken() + 'generated random challenge:' + challengeString);
				request.setChallenge(challengeString);
				requestIdChallengeMap.putChallengeString(request.getRequestId(), request.toPushNotification().data.requestInfo);
				var deferred = Q.defer();
				promiseMap.registerPromise('C' + request.getRequestId(), deferred, applicationConfiguration.signatureTimeout);
				mobilePushNotificationService.sendPushNotification(request);
				return deferred.promise;
			}).then(function verifySignature(signature) {
				log.info(request.getRequestId() + " verifying signature " + signature);
				var challengeString = requestIdChallengeMap.getChallengeString(request.getRequestId());
				log.info("The following information should be signed:"+challengeString);
				requestIdChallengeMap.remove(request.getRequestId());
				return ethCrypto.validateSignature(challengeString, signature, request.getSecondaryAddress());
			}).then(function afterSignatureVerification(result) {
				log.info(request.getRequestId() + " signature is: " + (result ? "valid" : "invalid"));
				if (result) {
					promiseMap.resolvePromise('M' + request.getRequestId());
				} else {
					promiseMap.rejectPromise('M' + request.getRequestId(), new Error("Invalid signature!"));
				}
				return result;
			});
		}
	};
})();
