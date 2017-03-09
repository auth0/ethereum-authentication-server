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

const express = require('express'),
      Q = require('q'),
      uuid = require('node-uuid'),
      jwt = require('jsonwebtoken'),
      authenticationService = require('../services/controllers/authenticationService.js'),
      applicationConfigurationService = require('../services/configuration/applicationConfigurationService.js'),
      userAuthenticationRequest = require('../model/userAuthenticationRequest.js'),
      clientsDetailsService = require('../services/challenge/clientsDetailsService.js'),
      userAuthenticationRequestValidator = require('../services/validation/userAuthenticationRequestValidator.js'),
      errorHandler = require('./errorHandler.js'),
      log = require('../util/log.js');

const router = express.Router();

router.post('/', function (req, res, next) {
	const requestId = uuid.v4();
    const details = clientsDetailsService.getDetailsFromClient(req.clientIp, req.headers['user-agent']);
	log.info(requestId + ' Received user authentication request:' + JSON.stringify(req.body));

	Q.fcall(function validateBody() {
        return userAuthenticationRequestValidator.validate(req.body);
    }).then(function initiateAuthentication() {
	    return authenticationService.authenticateUser(userAuthenticationRequest(req.headers.referer, req.body.email, requestId, details))
	}).then(function onSuccess() {
		log.info(requestId + ' Authentication was successful');
		jwt.sign({email: req.body.email, primaryAddress: req.body.primaryAddress},
		    applicationConfigurationService.rsaKeys.privateKey, { algorithm: 'RS256', expiresIn: applicationConfigurationService.jwtExpirationTime}, function(err, token) {
		  res.status(200).json(token);
		});
		
	}).fail(function onFailure(error) {
	    errorHandler.handleError(res,error,requestId,403);
	});
});

module.exports = router;
