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
      dbService = require('../wrappers/dbServiceWrapper.js'),
      ethRegistrationService = require('../wrappers/etheterumRegistryServiceWrapper.js'),
      challengeService = require('../challenge/challengeService.js'),
      secondaryAddressFromEthereumValidator = require('../validation/secondaryAddressFromEthereumValidator.js'),
      mobileMappingQueryResultValidator = require('../validation/mobileMappingQueryResultValidator.js'),
      log = require('../../util/log.js');

module.exports = (function initialize() {
	
	return {
		registerUser : function registerUser(request) {
			return Q.fcall(function retrieveAuthenticationKey() {
				return ethRegistrationService.getAuthenticationKey(request.getPrimaryAddress());
			}).then(function validateAuthenticationKey(secondaryAddress) {
				log.info(request.getRequestId() + ' retrieved  secondary address:' + secondaryAddress);
				secondaryAddressFromEthereumValidator.validate(secondaryAddress);
				request.setSecondaryAddress(secondaryAddress);
				return dbService.getMappingByAddress(secondaryAddress);
			}).then(function verifyDbData(dataFromDb) {
				mobileMappingQueryResultValidator.validate(dataFromDb);
				return dataFromDb[0];
			}).then(function initiateChallenge(mobileMapping) {
				request.setRegistrationToken(mobileMapping.registrationToken);
				return challengeService.challengeMobile(request);
			}).then(function registerUserIfChallengeSuccesful(result) {
				if (result) {
					log.info(request.getRequestId() + ' mobile challenge was succesful');
					return dbService.insertUserCredential(request.getEmail(), request.getPrimaryAddress());
				} else {
					throw new Error("Challenge failed!");
				}
			});
		}
	};
})();
