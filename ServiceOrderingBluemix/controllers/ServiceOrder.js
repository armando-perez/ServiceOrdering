'use strict';

var url = require('url');

var ServiceOrder = require('../service/ServiceOrderService');

module.exports.serviceOrderCreate = function serviceOrderCreate (req, res, next) {
  ServiceOrder.serviceOrderCreate(req, res, next);
};

module.exports.serviceOrderDelete = function serviceOrderDelete (req, res, next) {
  ServiceOrder.serviceOrderDelete(req, res, next);
};

module.exports.serviceOrderFind = function serviceOrderFind (req, res, next) {
  ServiceOrder.serviceOrderFind(req, res, next);
};

module.exports.serviceOrderGet = function serviceOrderGet (req, res, next) {
  ServiceOrder.serviceOrderGet(req, res, next);
};

module.exports.serviceOrderPatch = function serviceOrderPatch (req, res, next) {
  ServiceOrder.serviceOrderPatch(req, res, next);
};
