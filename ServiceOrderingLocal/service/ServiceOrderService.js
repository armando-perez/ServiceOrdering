'use strict';

//Minimal Service with filtering (equality match only) and attribute selection
//Error Handing Need to define a global error hqndler
//Paging and Range based Iterator to be added
//Notification to be added add listener and implement hub

var util = require('util');

var uuid = require('node-uuid');

var mongoUtils = require('../utils/mongoUtils')

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var Set = require("collections/set");
// Mongo URL

// This is a global variable we'll use for handing the MongoDB client around
var mongodb;

var config = require('./config.json');

var argv = require('minimist')(process.argv);
var dbhost = argv.dbhost ? argv.dbhost: config.db_host;
const mongourl = config.db_prot + "://" + dbhost + ":" + config.db_port + "/" + config.db_name;
MongoClient.connect(mongourl, function (err, db) {

        if (err) {
            console.log(err);
        } else {
            mongodb = db.db("tmf");
        }
    }
);

var generateOrderState = function (serviceOrderItems){
  debugger;
  var states = new Set()
  for (var i = 0; i < serviceOrderItems.length; i++) {
    states.add(serviceOrderItems[i].state)
  }
  var statesArray = states.toArray()
  var ret = 0;
  if(statesArray.length == 1){
    return statesArray[0]
  }
  else if(statesArray.length >= 2){

    if(states.has("In Progress")) {
      return "In Progress"
    }
    else if(states.has("Failed") && states.has("Completed") && statesArray.length == 2) {
      return "Partial"
    }
    else if(states.has("Failed") && states.has("Completed") && states.has("Cancelled") && statesArray.length == 3) {
      return "Partial"
    }
    else if(states.has("Failed") && states.has("Cancelled") && statesArray.length == 2) {
      return "Failed"
    }
    else if(states.has("Completed") && states.has("Cancelled") && statesArray.length == 2) {
      return "Completed"
    }
  }
}


// generate a new order state based on the action and the service state
// The rules followed are from the specificatin document
function isStateConsitent(action, serviceState) {
  if ((serviceState == "blank" && action == "add") ||
    (serviceState == "Designed" && action == "modify") ||
    (serviceState == "Inactive" && action == "modify") ||
    (serviceState == "Active") || (action == "no change") ||
    ((serviceState == "Terminated" || serviceState == "Reserved" || serviceState == "Designed" ) && action == "delete"))
    {
      return true
    }
    else {
      false
    }
  }


exports.serviceOrderCreate = function(req, res, next) {
  /**
   * Create a service order
   * This operation creates a service order entity. The specification document provides the list of mandatory and non mandatory attributes when creating a ServiceOrder, including any possible rule conditions and applicable default values. POST should be used without specifying the id and the href, the Service Order Management system is in charge of generating the id + href for the ServiceOrder.  Specific business errors for current operation will be encapsulated in  HTTP Response 422 Unprocessable entity
   *
   * serviceOrder POSTReqServiceOrder
   * returns ServiceOrder
   **/

  var args = req.swagger.params;
  var serviceOrder = args.serviceOrder.value;
  var orderItems = serviceOrder.orderItem;

  var mandatory_missing = false
  var invalid_request = false
  var object ;


  if (serviceOrder.id != undefined || serviceOrder.href != undefined ||
  serviceOrder.state != undefined || serviceOrder.orderDate != undefined ||
  serviceOrder.completionDate != undefined || serviceOrder.expectedCompletionDate != undefined ||
  serviceOrder.startDate != undefined ) {
              console.log("1 " +mandatory_missing +" "+invalid_request);
    invalid_request = true;
  }

  // Define uninitialized values
  serviceOrder.id = uuid.v4();


  serviceOrder.href = "https://host:port/serviceOrder/";
  serviceOrder.orderDate = new Date().toISOString();
  serviceOrder.completionDate = "";

  if (serviceOrder.id == undefined) {
    serviceOrder.expectedCompletionDate = "";
  }
  serviceOrder.startDate = new Date().toISOString();;


  var self = req.url + "/" + serviceOrder.id;
  serviceOrder.href = req.headers.host + self;



  if(orderItems == undefined || orderItems == []) {
          console.log("2 " +mandatory_missing +" "+invalid_request);
    mandatory_missing = true;
  }
  else {
    // Generate the orderItem state based on the action
    orderItems.forEach(function(item){
      var action = item.action;


      if (item.state == undefined) {
        item.state = "Acknowledged";
      }
      else {
        console.log("3 " +mandatory_missing +" "+invalid_request);
        invalid_request = true;
      }




      if (item.appointment != undefined) {
        object = item.appointment
        if (object.id == undefined && object.href == undefined) {
          console.log("4 " +mandatory_missing +" "+invalid_request);

          mandatory_missing = true;
        }
      }

      if (item.orderItemRelationship != undefined) {
        object = item.orderItemRelationship
        if (object.type == undefined || object.id == undefined) {
          console.log("5 " +mandatory_missing +" "+invalid_request);

          mandatory_missing = true;
        }
      }

      // based on an action the state is changed, if no action is given
      // the state isn't changed
      if  (action == undefined || item.id == undefined || item.service == undefined) {
        console.log("6 " +mandatory_missing +" "+invalid_request);

        mandatory_missing = true;
      }
      else {

        if (item.service.serviceSpecification != undefined) {
          object = item.service.serviceSpecification
          if (object.id == undefined && object.href == undefined) {
            console.log("7 " +mandatory_missing +" "+invalid_request);

            mandatory_missing = true;
          }
        }


        if (item.service.serviceRelationship != undefined) {
          object = item.service.serviceRelationship
          if (object.type == undefined || object.service == undefined) {
            console.log("8 " +mandatory_missing +" "+invalid_request);

            mandatory_missing = true;
          }
        }
        if ((item.service.serviceCharacteristic != undefined) &&
              (item.service.serviceCharacteristic != [])) {
          item.service.serviceCharacteristic.forEach(function(object){
            if (object.name == undefined || object.valueType == undefined || object.value == undefined) {
              console.log("9 " +mandatory_missing +" "+invalid_request);

              mandatory_missing = true;
            }
          })
        }

        if ((item.service.place != undefined) &&
              (item.service.place != [])) {
          item.service.place.forEach(function(object){
            if (object.id == undefined && object.href == undefined) {
              console.log("15 " +mandatory_missing +" "+invalid_request);

              mandatory_missing = true;
            }
            if (object.role == undefined) {
              console.log("16 " +mandatory_missing +" "+invalid_request);

              mandatory_missing = true;
            }
          })
        }
        if (item.action != "add"){
          if (item.service.id == undefined || item.service.href == undefined){
            console.log("10 " +mandatory_missing +" "+invalid_request);

            mandatory_missing = true
          }
        }

        if(!invalid_request && !isStateConsitent(action, item.service.serviceState))
        {
          console.log("11 " +mandatory_missing +" "+invalid_request);

          invalid_request = true;
        }
        console.log(item.state)
      }

    });
  }

  if (serviceOrder.orderRelationship != undefined) {
    object = serviceOrder.orderRelationship
    if (object.id == undefined && object.href == undefined) {
      console.log("12 " +mandatory_missing +" "+invalid_request);

      mandatory_missing = true;
    }
    if (object.type == undefined) {
      mandatory_missing = true;
    }
  }

  if (serviceOrder.relatedParty != undefined) {
    object = serviceOrder.relatedParty
    object.forEach(function(item){
      if (item.id == undefined && item.href == undefined) {
        console.log("13 " +mandatory_missing +" "+invalid_request);

        mandatory_missing = true;
      }
      if (item.role == undefined) {
        console.log("14 "+JSON.stringify(item)+JSON.stringify(serviceOrder.relatedParty)+item.role +mandatory_missing +" "+invalid_request);

        mandatory_missing = true;
      }
    });
  }


  if (serviceOrder.note != undefined) {
    object = serviceOrder.note
    if (object.author == undefined || object.text == undefined) {
      console.log("17 " +mandatory_missing +" "+invalid_request);

      mandatory_missing = true;
    }
  }

  serviceOrder.state = generateOrderState(orderItems)

  if (invalid_request === true) {
    // This sends an error message for a missing mandatory field.
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Location', self);
    var error = {
    };

    error = {
        'code':   'ERR0021', 'message': 'Invalid Request', 'description': 'Invalid structure of the Request.' , 'infoURL': '-'
    };
    res.statusCode = 400;
    res.end(JSON.stringify(error));
    return null;
  }

  if (mandatory_missing === true) {
    // This sends an error message for a missing mandatory field.
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Location', self);
    var error = {
    };

    error = {
        'code':   'ERR0021', 'message': 'Invalid Request', 'description': 'Mandatory Parameter is missing.' , 'infoURL': '-'
    };
    res.statusCode = 400;
    res.end(JSON.stringify(error));
    return null;
  }



  // Use connect method to connect to the server
  MongoClient.connect(mongourl, function (err, db) {
          if (err) {
              console.log("Create ServiceOrder"+err);
          } else {
            assert.equal(null, err);

            // Get the documents collection
            var collection = mongodb.collection('serviceOrder');
            // Insert some documents
            collection.insert(serviceOrder, function (err, result) {
                assert.equal(err, null)
            });
            db.close();
          }
      }
  );

  res.setHeader('Content-Type', 'application/json');

  res.setHeader('Location', self);
    res.statusCode = 201;

  res.end(JSON.stringify(serviceOrder));
}

exports.serviceOrderDelete = function(req, res, next) {
  /**
   * Delete a service order
   * This operation deletes a service order entity. This operation is available only to Admin API users.  Specific business errors for current operation will be encapsulated in  HTTP Response 422 Unprocessable entity
   *
   * id String
   * no response value expected for this operation
   **/

    var id = String(req.swagger.params.id.value);

    MongoClient.connect(mongourl, function (err, db) {
      if (err) throw err;
      var query = {
        id: id
      };

      mongodb.collection('serviceOrder').deleteOne(query, function(err, obj) {
        if (err) throw err;

        res.setHeader('Content-Type', 'application/json');

        if (obj.result.n == 1){
            res.statusCode = 204;
            res.end(JSON.stringify(obj));
        }

        if (obj.result.n == 0){
            error = {
                'code':   'ERR0001', 'message': 'Entry not found', 'description': 'provide a different id' , 'infoURL': '-'
            };
            res.statusCode = 404;
            res.end(JSON.stringify(error));
        }

        db.close();

        });
    });
}

exports.serviceOrderFind = function(req, res, next) {
  /**
   * List service orders
   * Retreive and list service order entities according to given criteria. Attribute selection is enabled for all first level attributes. Filtering may be available depending on the compliance level supported by an implementation. Providing filtering criteria is mandatory to avoid too many answers retrieved  Specific business errors for current operation will be encapsulated in  HTTP Response 422 Unprocessable entity
   *
   * state String Example of filtering attribute that can be used (optional)
   * orderDate String Example of filtering attribute that can be used (optional)
   * relatedPartyId String Example of filtering attribute that can be used (optional)
   * relatedPartyRole String Example of filtering attribute that can be used (optional)
   * fields String Attribute selection (optional)
   * offset String Requested index for start of resouces to be provided in response requested by client (optional)
   * limit String Requested number of resources to be provided in response requested by client (optional)
   * returns List
   **/

  var args = req.swagger.params;

  MongoClient.connect(mongourl, function (err, db) {
        try {
          assert.equal(null, err);
      }
      catch (err) {
          console.log("Find "+err)
      }

      // Get the documents collection and filtering ?

      var collection = mongodb.collection('serviceOrder');


    // console.log(req)

      console.log(req.query);

      var queryToMongo = require('query-to-mongo')
      var query = queryToMongo(req.query)
      console.log(query)

      // Find some documents based on criteria plus attribute selection
      collection.find(query.criteria,
      mongoUtils.fieldFilter(args.fields.value)).toArray(function (err, docs) {
          assert.equal(err, null);
          console.log(docs);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(docs));
          //res.json( docs );
      });


  })
}

exports.serviceOrderGet = function(req, res, next) {
  /**
   * Retrieve a service order
   * This operation retrieves a service order entity.  Attribute selection is enabled for all first level attributes.  Specific business errors for current operation will be encapsulated in  HTTP Response 422 Unprocessable entity
   *
   * id String
   * fields String Attribute selection (optional)
   * returns ServiceOrder
   **/


  MongoClient.connect(mongourl, function (err, db) {
      assert.equal(null, err);
      var collection = mongodb.collection('serviceOrder');
      var id = String(req.swagger.params.id.value);

      const query = {
          id: id
      }

      collection.findOne(query, function (err, doc) {
          res.setHeader('Content-Type', 'application/json');
          try {
          assert.equal(err, null);
          }
          catch (err) {

          console.log(err);
          res.statusCode = 500;
          var error = { };
          error = { 'code': 'ERR0001' , 'reason' : err , 'message:' : 'provide a different id' };
          res.end(JSON.stringify(error));
           }

          if (doc == null) {
              res.statusCode = 404;
              var error = {
              };
              error = {
                  'code':   'ERR0001', 'reason': 'not found', 'message:': 'provide a different id'
              };
              res.end(JSON.stringify(error));
          } else {

              delete doc[ "_id"]

              res.end(JSON.stringify(doc));
          }
      })
  })
}

exports.serviceOrderPatch = function(req, res, next) {
  /**
   * Patch a service order
   * This operation allows partial updates of a service order entity. Support of json/merge (https://tools.ietf.org/html/rfc7386) is mandatory, support of json/patch (http://tools.ietf.org/html/rfc5789) is optional.  The  specification document provides the list of patchable and non patchable attributes, including constraint rules on their usage.  Specific business errors for current operation will be encapsulated in  HTTP Response 422 Unprocessable entity
   *
   * id String
   * serviceOrder ServiceOrder
   * returns ServiceOrder
   **/

  MongoClient.connect(mongourl, function (err, doc) {
     assert.equal(null, err);
     var collection = mongodb.collection('serviceOrder');

     var serviceOrder = req.swagger.params.serviceOrder.value;
     var id = String(req.swagger.params.id.value);

     const query = {
         id: id
     }

     var patchDoc = {
         $set: serviceOrder
     }

     collection.update(query, patchDoc, function (err, doc) {
         assert.equal(err, null);
         //res.json(doc);
         // Find one document
         collection.findOne(query, function (err, doc) {
             res.setHeader('Content-Type', 'application/json');
             delete doc[ "_id"]
             res.end(JSON.stringify(doc));
         })
     })
   })
}
