'use strict';

var https = require('https');
var querystring = require('querystring');

// GM API
var host = 'gmapi.azurewebsites.net';

// Helper Functions

// Uses https://rapiddg.com/blog/calling-rest-api-nodejs-script
function performRequest(endpoint, method, data, success) {
  var dataString = JSON.stringify(data);
  var headers = {};
  
  if (method == 'GET') {
    endpoint += '?' + querystring.stringify(data);
  }
  else {
    headers = {
      'Content-Type': 'application/json',
      'Content-Length': dataString.length
    };
  }
  var options = {
    host: host,
    path: endpoint,
    method: method,
    headers: headers
  };

  var req = https.request(options, function(res) {
    res.setEncoding('utf-8');

    var responseString = '';

    res.on('data', function(data) {
      responseString += data;
    });

    res.on('end', function() {
      console.log(responseString);
      var responseObject = JSON.parse(responseString);
      success(responseObject);
    });
  });

  req.write(dataString);
  req.end();
}

// Mapping GM API Response to Smartcar API Spec

function mapGmVehicle(item) {
  var doorCount; 
  if (item.data.fourDoorSedan.value === 'True') {
    doorCount = 4;
  } else if (item.data.twoDoorCoupe.value === 'True') {
    doorCount = 2;
  } else {
    doorCount = 0;
  }

  return {
    "vin": item.data.vin.value,
    "color": item.data.color.value,
    "doorCount": doorCount,
    "driveTrain": item.data.driveTrain.value
  };
}

function mapGmSecurityDoors(item) {
  var doors = []; 
  var doorArray = item.data.doors.values;
  var doorArrayLength = doorArray.length;

  for (var i = 0; i < doorArrayLength; i++) {
    var door = doorArray[i];
    doors.push({ 
      'location': door.location.value,
      'locked': door.locked.value === 'True'
    });
  }
  
  return doors;
}

// Creating endpoint handlers

module.exports.getVehicle = function(event, context, cb) {
  console.log("Request received:\n", JSON.stringify(event));
  console.log("Context received:\n", JSON.stringify(context));

  performRequest('/getVehicleInfoService', 'POST', {
    'id': event.path.vehicleID,
    'responseType': "JSON"
  }, function(data) {
    console.log(event.path.vehicleID);
    console.log("getVehicle", JSON.stringify(data));
    cb(null, mapGmVehicle(data));
  });
}

module.exports.getSecurityDoors = function(event, context, cb) {
  console.log("Request received:\n", JSON.stringify(event));
  console.log("Context received:\n", JSON.stringify(context));

  performRequest('/getSecurityStatusService', 'POST', {
    'id': event.path.vehicleID,
    'responseType': "JSON"
  }, function(data) {
    console.log(event.path.vehicleID);
    console.log("mapGmSecurityDoors", JSON.stringify(data));
    cb(null, mapGmSecurityDoors(data));
  });
}
