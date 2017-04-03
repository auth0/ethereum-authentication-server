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
      signatureResponseService = require('../services/controllers/signatureResponseService.js'),
      signatureRejectionService = require('../services/controllers/signatureRejectionService.js'),
      signatureRequestValidator = require('../services/validation/signatureRequestValidator.js'),
      signatureRejectionRequestValidator = require('../services/validation/signatureRejectionRequestValidator.js'),
      log = require('../util/log.js'),
      router = express.Router();

router.post('/', function (req, res, next) {
	const requestId = req.body.requestId;
	log.info(requestId + ' Received signature submission request, signature:' + JSON.stringify(req.body));

	Q.fcall(function validateBody() {
	    signatureRequestValidator.validate(req.body);
	}).then(function initiateSignatureSubmission() {
		var deferred = Q.defer();
		signatureResponseService.submitSignature(requestId, req.body, deferred);
		return deferred.promise;
	}).then(function onSuccess() {
		log.info(requestId + ' Signature submission concluded succesfully!');
		res.sendStatus(200);
	}).fail(function onFailure(error) {
		errorHandler.handleError(res,error,requestId,403);
	});
});

router.post('/reject', function (req, res, next) {
	const requestId = req.body.requestId;
	log.info(requestId + ' Received signature rejection request');

	Q.fcall(function validateBody() {
		signatureRejectionRequestValidator.validate(req.body);
	}).then(function initiationSignatureRejectionSubmission() {
        signatureRejectionService.submitSignatureRejection(requestId);
	}).then(function onSuccess() {
		log.info(requestId + ' Signature rejection concluded succesfully!');
		res.sendStatus(200);
	}).fail(function onFailure(error) {
		errorHandler.handleError(res,error,requestId,403);
	});
});

module.exports = router;
