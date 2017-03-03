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
      initializeService = require('../services/configuration/initializeService.js'),
      dbService = require('../services/wrappers/dbServiceWrapper'),
      errorHandler = require('./errorHandler.js'),
      log = require('../util/log.js'),
	  applicationConfiguration = require('../services/configuration/applicationConfigurationService.js'),
      router = express.Router();

var smartContractAddress;

router.get('/', function(req, res, next) {
    if(!smartContractAddress){
        const requestId = uuid.v4();
        log.info(requestId + ' Received server initialization request');
        var promiseTable = [];
        promiseTable.push(dbService.createMobileMappingTable());
        promiseTable.push(dbService.createUserCredentialsTable());
        promiseTable.push(initializeService.deploy(applicationConfiguration.mapperContractAddress));

        return Q.all(promiseTable).spread(function(createMobileMappingTableStatus, createUserCredentialsTableStatus, address){
            log.info(requestId + ' Initialization succesful!');
            smartContractAddress = address;
            res.send(address);
        }).fail(function onFailure(error) {
            errorHandler.handleError(res,error,requestId,403);
        });
    }
    else{
        res.send(smartContractAddress);
    }
});

module.exports = router;
