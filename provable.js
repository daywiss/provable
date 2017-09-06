var crypto = require('crypto');
var assert = require('assert')
var defaults = require('lodash/defaults')
var isFunction = require('lodash/isFunction')
var utils = require('./utils')

function Engine(options,change){

  function defaultState(options){
    return defaults({},options,{
      id:utils.createSeed(),  //unique id for this hash series
      index:0,                      //point in hash we are at
      count:1,                      //number of hashes in series
      seed:utils.createSeed(),      //starting seed
      publicSeed:null,              //additional client side for extra security
      maxHex:8,  //max characters to slice from hash to generate integer
    })
  }

  var state = {}
  var hashes = null

  function onChange(state){
    change(state)
  }

  //random js calls this
  function engine(){
    return utils.toInt(engine.next(state.publicSeed),state.maxHex)
  }

  engine.state = function(){
    return state
  }

  //query hash array
  engine.hashes = function(start,end,includeSeed,reverse){
    start = start || 0
    if(includeSeed){
      end = end || state.count + 1
    }else{
      end = end || state.count
    }
    var list = hashes

    if(includeSeed){
      list = hashes.concat([state.seed])
    }

    list = list.slice(start,end)

    if(reverse){
      return list.reverse()
    }else{
      return list
    }
  }

  engine.last = function(publicSeed){
    return engine.peek(state.index-1,publicSeed)
  }

  engine.peek = function(index,publicSeed){
    if(index !== 0 && index == null) index = state.index
    publicSeed = publicSeed || state.publicSeed
    return utils.rehash(crypto,hashes[index],publicSeed)  
  }


  engine.next = function(publicSeed){
    var hash = engine.peek(null,publicSeed)
    assert(hash,'end of hash series')
    state.index++
    onChange(state)
    return hash
  }

  function init(){
    state = defaultState(options)
    state.maxInt = Math.pow(2,state.maxHex * 4) //maximum sized integer we can get from single hash
    assert(state.seed,'requires seed value')

    if(!isFunction(change)){
      change = function(){}
    }

    hashes = utils.generate(crypto,state.count,state.seed)
    onChange(state)
    return engine
  }

  return init()
}

//add helper static functions
Engine.generate = utils.generate.bind(null,crypto)
Engine.createSeed = utils.createSeed.bind(null,crypto)
Engine.rehash = utils.rehash.bind(null,crypto)
Engine.sha256 = utils.sha256.bind(null,crypto)

//some basic hash parsing
Engine.toInt = utils.toInt
Engine.toFloat = utils.toFloat
Engine.toBool = utils.toBool

module.exports = Engine 
