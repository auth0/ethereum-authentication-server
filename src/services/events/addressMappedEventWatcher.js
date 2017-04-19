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
    RegistrationNotification = require('../../model/registrationFinishedNotification.js'),
    mobilePushNotificationService = require('../challenge/mobilePushNotificationService.js'),
    log = require('../../util/log.js');

module.exports = (function init() {

    return {
        reactToEvent: function reactToEvent(primary, secondary) {
            dbService.getUserCredentialsSecondaryAddress(secondary)
            .then(function checkDbResult(result) {
                if (result.length == 0) {
                    throw new Error("Received AddressMapped event for non-existent user! " + primary + " " + secondary + " " + JSON.stringify(result));
                }
                result[0].primaryAddress = primary;
                return Q.all([Q.fcall(function () {return result[0]}),dbService.insertPrimaryAddress(result[0].email, primary)])
            }).spread(function sendPushNotificationToMobile(userInfo) {
                var notification = RegistrationNotification(userInfo.email, userInfo.primaryAddress,
                    userInfo.secondaryAddress, userInfo.registrationToken)
                log.info("Sending registration succesful push notification:" + JSON.stringify(notification.toPushNotification()))
                mobilePushNotificationService.sendPushNotification(notification);
            }).fail(function onFailure(error) {
                log.error(error);
            });
        }
    };
})();