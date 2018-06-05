'use strict';

var fs = require('fs'),
    path = require('path'),
    http = require('http');

var app = require('connect')();
var swaggerTools = require('swagger-tools');
var jsyaml = require('js-yaml');
var Set = require('collections/set')
var serverPort = 8080;

// swaggerRouter configuration
var options = {
  swaggerUi: path.join(__dirname, '/swagger.json'),
  controllers: path.join(__dirname, './controllers'),
  useStubs: process.env.NODE_ENV === 'development' // Conditionally turn on stubs (mock mode)
};

// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
var spec = fs.readFileSync(path.join(__dirname,'api/swagger.yaml'), 'utf8');
var swaggerDoc = jsyaml.safeLoad(spec);

// Initialize the Swagger middleware
swaggerTools.initializeMiddleware(swaggerDoc, function (middleware) {

  // Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
  app.use(middleware.swaggerMetadata());

  // Validate Swagger requests
  app.use(middleware.swaggerValidator());

  // Route validated requests to appropriate controller
  app.use(middleware.swaggerRouter(options));

  // Serve the Swagger documents and Swagger UI
  app.use(middleware.swaggerUi());

//  var orderitems = JSON.parse('[ { "id": "1", "action": "add", "@type": "standard", "service": { "serviceState": "Active", "serviceCharacteristic": [ { "name": "vCPE_IP", "valueType": "String", "value": { "@type": "IPAddress", "@schemaLocation": "http....", "vCPE_IP": "193.218.236.21"  }} ], "serviceSpecification": { "id": "12", "href": "http://...:serviceSpecification/12", "name": "vCPE","version": "1", "@type": "vCPE", "@schemaLocation": "http..." }}}, ]');
  //Rejected
  /*var orderitems = JSON.parse('[ { "id": "1", "action": "add", "@type": "standard", "state" : "Rejected" },\
    { "id": "2", "action": "add", "@type": "standard", "state" : "Rejected" } ]');
*/
  // Partial
  /*var orderitems = JSON.parse('[ { "id": "1", "action": "add", "@type": "standard", "state" : "Cancelled" }, \
      { "id": "2", "action": "add", "@type": "standard", "state" : "Completed" } , \
      { "id": "3", "action": "add", "@type": "standard", "state" : "Failed" } ]');
*/
// Failed
var orderitems = JSON.parse('[ { "id": "1", "action": "add", "@type": "standard", "state" : "Failed" }, \
    { "id": "2", "action": "add", "@type": "standard", "state" : "Cancelled" } , \
    { "id": "3", "action": "add", "@type": "standard", "state" : "Cancelled" } ]');

// In Progress
/*var orderitems = JSON.parse('[ { "id": "1", "action": "add", "@type": "standard", "state" : "Cancelled" }, \
    { "id": "2", "action": "add", "@type": "standard", "state" : "In Progress" } , \
    { "id": "3", "action": "add", "@type": "standard", "state" : "Completed" } ]');
*/

/*
  var states = new Set()
  for (var i = 0; i < orderitems.length; i++) {
    states.add(orderitems[i].state)
  }
  var statesArray = states.toArray()
  var ret = 0;
  if(statesArray.length == 1){
    ret = statesArray[0]
  }
  else if(statesArray.length >= 2){

    if(states.has("In Progress")) {
      ret = "In Progress"
    }
    else if(states.has("Failed") && states.has("Completed") && statesArray.length == 2) {
      ret = "Partial"
    }
    else if(states.has("Failed") && states.has("Completed") && states.has("Cancelled") && statesArray.length == 3) {
      ret = "Partial"
    }
    else if(states.has("Failed") && states.has("Cancelled") && statesArray.length == 2) {
      ret = "Failed"
    }
    else if(states.has("Completed") && states.has("Cancelled") && statesArray.length == 2) {
      ret = "Completed"
    }
  }
  console.log(ret);
  console.log(JSON.stringify(states))
  console.log(JSON.stringify(states.toArray().length))*/

  // Start the server
  http.createServer(app).listen(serverPort, function () {
    console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
  });

});
