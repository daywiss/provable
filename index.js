var utils = require('./provable-utils.js')
var lodash = require('lodash')
var crypto = require('crypto')

function sha256(seed)
  return crypto.createHash('sha256').update(seed).digest('hex');
}

exports.createSeed = function(){
  return crypto.createHash('sha256').digest('hex')
}

function createSeries(count,seed){
  count = count || 1
  var result = Array(count)
  for(var i = count-1; i >= 0; i--){
    seed = sha256(seed)
    result[i]= seed
  }
  return result
}

module.exports = function(options){
  var maxHex = 13
  var maxInt = Math.pow(2,exports.constants.maxHex * 4)

  var defaults = {
    count:10000,
    seed:createSeed(),
  }

  var methods = {}

  methods.c

  return methods
}
