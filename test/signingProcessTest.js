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

const requestId = "bf1ce828-968f-11e6-ae22-56b6b6499611".toLowerCase(),
      primaryAddress = "0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe".toLowerCase(),
      contractAddress = "0x5eD8Cee6b63b1c6AFce3AD7c92f4fD7E1B8fAd9F".toLowerCase(),
      secondaryAddress = "0xDa4a4626d3E16e094De3225A751aAb7128e96526".toLowerCase(),
      email = "someone@gmail.com",
      registrationToken = "bliblibli",
      signature = "blablebla",
      EthCryptoMock = require('./mocks/ethCryptoMock.js'),
      EthRegistrationServiceMock = require('./mocks/ethRegistrationServiceMock.js'),
      ApplicationConfigurationServiceMock = require('./mocks/applicationConfigurationServiceMock.js'),
      DBServiceMock = require('./mocks/dbServiceMock.js'),
      FCM = require('./mocks/fcmNodeMock.js'),
      proxyquire = require('proxyquire'),
      JWT_HEADER_ENCODED = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.';//encoded header should be the same

var ethCryptoMock = EthCryptoMock(undefined,signature,true);
var ethRegistrationServiceMock = EthRegistrationServiceMock(undefined,secondaryAddress,contractAddress);
var dbServiceMock = DBServiceMock([{
	secondaryAddress : secondaryAddress,
	registrationToken : registrationToken
}],[{
	email : email,
	primaryAddress : primaryAddress
}]);

var applicationConfigurationServiceMock = ApplicationConfigurationServiceMock(undefined,undefined,100000);
var validator = {};
var fcmNodeMock = FCM(validator);
applicationConfigurationServiceMock['@global'] = true;

const chai = require('chai'),
chaiHttp = require('chai-http'),
should = chai.should();

chai.use(chaiHttp);

var stubs = {
	"node-uuid": {
		v4: function v4() {
			return requestId;
		},
		"@global" : true
	},
	'fcm-node' : fcmNodeMock,
	"eth-registration-service" : ethRegistrationServiceMock,
	"eth-crypto" : ethCryptoMock,
	"eth-db-service" : dbServiceMock,
	'./applicationConfigurationService.js' : applicationConfigurationServiceMock	
};

var server = proxyquire('../index.js',stubs);

function sendAuthenticationRequest() {
    return chai.request(server)
    .post('/authenticate')
    .send({
        email : email
    })
}

function sendMobileRegistrationRequest() {
    return chai.request(server)
    .post('/register/mobile')
    .send({
        secondaryAddress : secondaryAddress,
        registrationToken : registrationToken
    })
}

function sendUserRegistrationRequest() {
    return chai.request(server)
    .post('/register/user')
    .send({
        primaryAddress : primaryAddress,
        email : email
    });
}

function sendSignature(done) {
    chai.request(server)
    .post('/signature')
    .send({
        requestId : requestId,
        signature : signature
    }).end(function(err,res) {
        res.should.have.status(200);
        if(done) {
            done();
        }
    });
}

function sendSignatureRejection() {
    chai.request(server)
    .post('/signature/reject')
    .send({
        requestId : requestId,
        signature : signature
    }).end(function(err,res) {
        res.should.have.status(200);
    });
}


describe('/signature',function test() {
	it('should properly relay signature request and return a authentication response',function(done) {
		validator.validate = function validate(message) {
		    console.log("Validating push notification...");
			//PUSH NOTIFICATION TEST
			//TODO validate push notification
		};
		sendAuthenticationRequest()
		.end(function(err,res) {
           res.body.should.contain(JWT_HEADER_ENCODED);
           res.should.have.status(200);
           done();
        });
		setTimeout(function submitSignature() {
			sendSignature();
		},2000);
	});
	
	it('should properly relay signature request and return a mobile registration response',function(done) {
		validator.validate = function validate(message) {
		    console.log("Validating push notification...");
			//PUSH NOTIFICATION TEST
			//TODO validate push notification
		};
        sendMobileRegistrationRequest().end(function(err,res) {
           res.should.have.status(200);
        });
		setTimeout(function submitSignature() {
			sendSignature(done);
		},2000);
	});
	
	it('should properly relay signature request and return a user registration response',function(done) {
		validator.validate = function validate(message) {
			//PUSH NOTIFICATION TEST
			console.log("Validating push notification...");
			//TODO validate push notification
		};
		sendUserRegistrationRequest()
		.end(function(err,res) {
            res.should.have.status(201);
            done();
        });
		setTimeout(function submitSignature() {
			sendSignature();
		},2000);
	});

	it('should properly relay signature rejection request and return a authentication response',function(done) {
        validator.validate = function validate(message) {
            console.log("Validating push notification...");
            //PUSH NOTIFICATION TEST
            //TODO validate push notification
        };
        sendAuthenticationRequest()
        .end(function(err,res) {
           res.should.have.status(403);
           done();
        });
        setTimeout(function submitSignature() {
            sendSignatureRejection();
        },2000);
    });

    it('should properly relay signature rejection request and return a user registration response',function(done) {
        validator.validate = function validate(message) {
            //PUSH NOTIFICATION TEST
            console.log("Validating push notification...");
            //TODO validate push notification
        };
        sendUserRegistrationRequest()
        .end(function(err,res) {
            res.should.have.status(403);
            done();
        });
        setTimeout(function submitSignature() {
            sendSignatureRejection();
        },2000);
    });
});
 
