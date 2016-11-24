var redis = require('../config/redis')
var Promise = require('bluebird')

exports.init = Promise.method(function(key,hashes){
  if(key == null) throw 'must provide unique key for series'
  if(hashes == null) throw 'must provide array of hashes'
  return exports.clear(key).then(function(){
    return redis.rpush(key,hashes)
  }) 
})                       

exports.length = function(key){
  return redis.llen(key)
}
exports.next = function(key){
  return redis.lpop(key)
}
exports.peek = function(key){
  return redis.lindex(key,0)
}

exports.clear = function(key){
  return redis.del(key)
}

