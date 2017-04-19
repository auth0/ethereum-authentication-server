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
    ethRegistrationService = require('../wrappers/etheterumRegistryServiceWrapper.js'),
    addressValidator = require('../validation/addressValidator.js'),
    userCredentialsQueryResultValidator = require('../validation/userCredentialsQueryResultValidator.js'),
    log = require('../../util/log.js');

module.exports = (function init() {
    return {
        createService: function createService(challengeService) {
            return {
                authenticateUser: function authenticateUser(request) {
                    return dbService.getUserCredentialsByEmail(request.getEmail())
                        .then(function verifyDbData(dataFromDb) {
                            userCredentialsQueryResultValidator.validate(dataFromDb);
                            return dataFromDb[0];
                        }).then(function retrieveSecondaryKey(row) {
                            log.info(request.getRequestId() + " retrieved user credentials:" + JSON.stringify(row));
                            request.setRegistrationToken(row.registrationToken);
                            request.setPrimaryAddress(row.primaryAddress);
                            return ethRegistrationService.getAuthenticationKey(row.primaryAddress);
                        }).then(function retrieveMobileData(secondaryAddress) {
                            log.info(request.getRequestId() + ' retrieved  secondary address:' + secondaryAddress);
                            addressValidator.validate(secondaryAddress);
                            request.setSecondaryAddress(secondaryAddress);
                        }).then(function initiateChallenge() {
                            return challengeService.challengeMobile(request);
                        }).then(function checkResult(result) {
                            if (result.signingProcessSuccessful) {
                                log.info(request.getRequestId() + ' mobile challenge was succesful');
                                return result;
                            } else {
                                throw new Error("Challenge failed!");
                            }
                        });
                }
            };
        }
    }
})();
