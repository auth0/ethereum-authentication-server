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
'use strict'

const express = require('express'),
      bodyParser = require('body-parser'),
      path = require('path'),
      https = require('https'),
      requestIp = require('request-ip'),
      applicationConfiguration = require('./src/services/configuration/applicationConfigurationService.js'),
      registerRoute = require('./src/routes/register.js'),
      authenticateRoute = require('./src/routes/authenticate.js'),
      initializeRoute = require('./src/routes/initialize.js'),
      signatureRoute = require('./src/routes/signature.js'),
      publicKey = require('./src/routes/publicKey.js'),
      app = express();

app.use(bodyParser.json());
app.use(requestIp.mw());
app.use(function(req, res, next) {
   res.header('Access-Control-Allow-Origin', '*');
   res.header('Access-Control-Allow-Methods', 'GET, POST');
   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
   next();
});
app.use('/register', registerRoute);
app.use('/authenticate', authenticateRoute);
app.use('/initialize', initializeRoute);
app.use('/signature', signatureRoute);
app.use('/publickey', publicKey);

https.createServer(applicationConfiguration.httpsOptions, app).listen(3000, function () {
    console.log('[HTTPS] Listening on port 3000...');
});

module.exports = app; //for testing
