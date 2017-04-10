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
    dbService = require('../services/wrappers/dbServiceWrapper'),
    eventWatcher = require('../services/events/addressMappedEventWatcher'),
    errorHandler = require('./errorHandler.js'),
    log = require('../util/log.js'),
    applicationConfiguration = require('../services/configuration/applicationConfigurationService.js'),
    ethRegistrationService = require('../services/wrappers/etheterumRegistryServiceWrapper.js'),
    router = express.Router();

var initialized;

router.get('/', function (req, res) {
    if (!initialized) {
        initialized = true;
        const requestId = uuid.v4();
        log.info(requestId + ' Received server initialization request');
        ethRegistrationService.registerEventListener(eventWatcher.reactToEvent);
        return dbService.createUserCredentialsTable()
            .then(function () {
                dbService.insertUserCredential("someone@gmail.com","0x1c27d0daa7c2bdb644de7a0880354a5c6389e6ba","428472842384298ryw97fhsgfw79r293gr297fg2973fg798fgw7rgf")
            })
            .then(function () {
                log.info(requestId + ' Initialization successful!');
                res.send(applicationConfiguration.mapperContractAddress);
            }).fail(function onFailure(error) {
                errorHandler.handleError(res, error, requestId, 403);
            });
    } else {
        res.send(applicationConfiguration.mapperContractAddress);
    }
});

module.exports = router;
