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

    const customChallengeSuffix = "C";

    return {
        challengeMobile: function challengeMobile(request) {
            return Q.fcall(function sendPushNotificationAndWaitForSignature() {
                    log.info(request.getRequestId() + ' starting challenge for registrationToken '
                        + request.getRegistrationToken() + 'starting custom challenge:' + request.getChallenge());
                    requestIdChallengeMap.putChallengeString(request.getRequestId(), request.toPushNotification().data.requestInfo);
                    requestIdChallengeMap.putChallengeString(request.getRequestId() + customChallengeSuffix, request.getChallenge());
                    var deferred = Q.defer();
                    promiseMap.registerPromise('C' + request.getRequestId(), deferred, applicationConfiguration.signatureTimeout);
                    mobilePushNotificationService.sendPushNotification(request);
                    return deferred.promise;
                }).then(function verifySignature(signatureBody) {
                    var requestSignature = signatureBody.signature;
                    var challengeSignature = signatureBody.challengeSignature;
                    log.info(request.getRequestId() + " verifying signatures " + requestSignature + " and " + challengeSignature);
                    var requestChallengeString = requestIdChallengeMap.getChallengeString(request.getRequestId());
                    var customChallengeString = requestIdChallengeMap.getChallengeString(request.getRequestId() + customChallengeSuffix);
                    log.info("The following information should be signed:" + requestChallengeString + " and " + customChallengeString);
                    requestIdChallengeMap.remove(request.getRequestId());
                    requestIdChallengeMap.remove(request.getRequestId() + customChallengeSuffix);
                    return Q.all([
                        ethCrypto.validateSignature(requestChallengeString, requestSignature, request.getSecondaryAddress()),
                        ethCrypto.validateSignature(customChallengeString, challengeSignature, request.getSecondaryAddress()),
                        Q.fcall(function () {
                            return challengeSignature;
                        })
                    ]);
                }).spread(function afterSignatureVerification(resultRequestSignature, resultCustomSignature, challengeSignature) {
                    log.info(request.getRequestId() + " request signature is: " + (resultRequestSignature ? "valid" : "invalid")
                        + ", custom signature of " + challengeSignature + " is " + (resultCustomSignature ? "valid" : "invalid"));
                    var signingProcessSuccessful = resultRequestSignature && resultCustomSignature;
                    if (signingProcessSuccessful) {
                        promiseMap.resolvePromise('M' + request.getRequestId());
                    } else {
                        promiseMap.rejectPromise('M' + request.getRequestId(), new Error("Invalid signature!"));
                    }
                    return {
                        secondaryAddress : request.getSecondaryAddress(),
                        primaryAddress : request.getPrimaryAddress(),
                        signingProcessSuccessful : signingProcessSuccessful,
                        challengeSignature : challengeSignature
                    };
                });
        }
    };
})();
