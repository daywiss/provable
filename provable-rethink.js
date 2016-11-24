var winston = require('../config/winston')
var Provable = require('../services/provable')
var r = require('../config/rethinkdb')
var config = require('../config/config').provable
var lodash = require('lodash')
var Promise = require('bluebird')

var defaultConfig = {
  //wouldnt make this much higher than 10000
  //or expect latency during generation
  seriesCount:10000
}

config = lodash.extend(defaultConfig,config)

exports.createKey = function(name,date){
  date = date || Date.now()
  return [name,date].join('!')
}

exports.parseKey = function(key){
  var parts = key.split('!')
  if(parts.length != 2) throw 'invalid key'
  return {
    name:parts[0],
    created:parts[1]
  }
}

exports.getLastSeries = function(name){
  return r.table('random').between(name,name+'~')
    .pluck('id').orderBy('id').run().then(function(results){
      if(results == null || results.length == 0) return null
      console.log('last series',results)
      return results[results.length-1].id
    })
}

exports.countSeries = function(name){
  return r.table('random').between(name,name+'~').count().run()
}

//clear all series with for this namespace
//only use for testing and if you know what u are doing
exports.clear = function(name){
  return r.table('random').between(name,name+'~').delete().run()
}

exports.createSeries = function(name,count){
  count = count || config.seriesCount
  var seed = Provable.createSeed()
  var series = Provable.createSeries(count,seed)
  var date = Date.now()
  var insert = {
    id:exports.createKey(name,date),
    name:name,
    seed:seed,
    hashes:series,
    index:0,
    created:date,
    count:series.length
  }
  return r.table('random').insert(insert).run().then(function(){
    //return handler
    winston.info('provable created new series, id:',insert.id)
    return insert.id
  })
}

exports.increment = function(key){
  return r.table('random').get(key).update({
    index:r.row('index').add(1)
  }).run()
}

exports.index = function(key){
  return r.table('random').get(key).do(r.row('index')).run()
}

exports.next = function(key){
  return r.table('random').get(key).do(
    r.row('hashes').nth(r.row('index'))
  ).run()
}

exports.get = function(key,index){
  return r.table('random').get(key).do(
    r.row('hashes').nth(index)
  ).run()
}

exports.rest = function(key){
  return r.table('random').get(key).do(
    r.row('hashes').slice(r.row('index'))
  ).run()
}


