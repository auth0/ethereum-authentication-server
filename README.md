Ethereum-authentication-server
============
Performs the role of Auth0 servers.

### How to use it

Consult the swagger.yml for more details regarding the exposed api

### Quick Start

#### Before you start, tools you will need

* install npm
* put your certificates and rsa keys in the config directory
  * config/certs should contain the following files: 
    * server.crt  
	* server.csr  
	* server.key
  * config/rsa_keys should contain the following files: 
    * id_rsa
	* id_rsa.pub

## Run application:
* folder:
  * auth0\ethereum-authentication-server
        
```script
./start.sh GO-ETHEREUM-URL DATABASE-HOST FIREBASE-API-KEY
```
Inside `./start.sh` file there are more parameters to be configured

Go to 
`https://localhost:3000/information` 