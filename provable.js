var Random = require('random-js')
var crypto = require('crypto');
var assert = require('assert')
var lodash = require('lodash')

//create random
var seed = Random.generateEntropyArray()
var engine = Random.engines.mt19937().seedWithArray(seed)
var rand = new Random(engine)

//generate random uuid
function createSeed(){
  return rand.uuid4()
}

//generate sha256 hash based on seed
function sha256(seed){
  return crypto.createHash('sha256').update(seed).digest('hex');
}

//update sha hash based on seed
function rehash(hash,seed){
  if(hash == null) return hash
  if(seed == null) return hash
  return crypto.createHmac('sha256',hash).update(seed).digest('hex')
}

//generate random hash series
function generate(count,seed){
  seed = seed || createSeed()
  count = count || 1
  var result = Array(count)
  for(var i = count-1; i >= 0; i--){
    seed = sha256(seed)
    result[i]= seed
  }
  return result
}

function Engine(options,change){
  function defaults(options){
    return lodash.defaults(lodash.clone(options),{
      id:createSeed(),
      index:0,
      count:1,
      seed:createSeed(),
      publicSeed:null,
    })
  }

  var state = {}
  var hashes = null

  function onChange(state){
    change(state)
  }

  function int32(hash){
    return parseInt(hash.slice(-8),16)
  }

  function engine(){
    return int32(engine.next(state.publicSeed))
  }

  engine.state = function(){
    return state
  }

  engine.hashes = function(){
    return hashes
  }

  engine.last = function(publicSeed){
    return engine.peek(state.index-1,publicSeed)
  }

  engine.peek = function(index,publicSeed){
    if(index !== 0 && index == null) index = state.index
    publicSeed = publicSeed || state.publicSeed
    return rehash(hashes[index],publicSeed)  
  }


  engine.next = function(publicSeed){
    var hash = engine.peek(null,publicSeed)
    assert(hash,'end of hash series')
    state.index++
    onChange(state)
    return hash
  }


  function init(){
    state = defaults(options)
    if(!lodash.isFunction(change)){
      change = function(){}
    }
    hashes = generate(state.count,state.seed)
    onChange(state)
    return engine
  }

  return init()
}

Engine.generate = generate
Engine.createSeed = createSeed
Engine.rehash = rehash

module.exports = Engine 
