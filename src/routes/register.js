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
      registerUserService = require('../services/controllers/registerUserService.js'),
      registerMobileService = require('../services/controllers/registerMobileService.js'),
      clientsDetailsService = require('../services/challenge/clientsDetailsService.js'),
      userValidator = require('../services/validation/userValidator.js'),
      mobileValidator = require('../services/validation/mobileValidator.js'),
      UserRegistrationRequest = require('../model/userRegistrationRequest.js'),
      MobileRegistrationRequest = require('../model/mobileRegistrationRequest.js'),
      errorHandler = require('./errorHandler.js'),
      log = require('../util/log.js');

const router = express.Router();

router.post('/user', function (req, res, next) {
	const requestId = uuid.v4();
    const details = clientsDetailsService.getDetailsFromClient(req.clientIp, req.headers['user-agent']);
	log.info(requestId + ' Received user registration request:' + req.body.primaryAddress + ' ' + req.body.email);

	Q.fcall(function validateBody() {
		userValidator.validate(req.body);
	}).then(function initiateRegistration() {
		return registerUserService.registerUser(UserRegistrationRequest(req.headers.referer, req.body.email, req.body.primaryAddress,
		       requestId, details));
	}).then(function onSuccess() {
		log.info(requestId + ' User registration was succesful');
		res.sendStatus(201);
	}).fail(function onFailure(error) {
		errorHandler.handleError(res,error,requestId,403);
	});
});

router.post('/mobile', function (req, res, next) {
	const requestId = uuid.v4();
    const details = clientsDetailsService.getDetailsFromClient(req.clientIp, req.headers['user-agent']);
	log.info(requestId + ' Received mobile registration request:' + req.body.secondaryAddress + ' ' + req.body.registrationToken);

	Q.fcall(function validateBody() {
		mobileValidator.validate(req.body);
		res.sendStatus(200);
	}).then(registerMobileService.registerMobile(MobileRegistrationRequest(req.body.registrationToken,
	        req.body.secondaryAddress,requestId, details, req.body.email))
	).then(function onSuccess() {
		log.info(requestId + ' mobile registration request was submitted succesfully');
	}).fail(function onFailure(error) {
		errorHandler.handleError(res,error,requestId,403);
	});
});

module.exports = router;
