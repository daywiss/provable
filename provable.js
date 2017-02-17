var Random = require('random-js')
var crypto = require('crypto');
var assert = require('assert')
var lodash = require('lodash')

//create random
var seed = Random.generateEntropyArray()
var engine = Random.engines.mt19937().seedWithArray(seed)
var rand = new Random(engine)

function createSeed(){
  return rand.uuid4()
}

function sha256(seed){
  return crypto.createHash('sha256').update(seed).digest('hex');
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
      clientSeed:null,
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
    return int32(engine.next())
  }

  engine.state = function(){
    return state
  }

  engine.hashes = function(){
    return hashes
  }

  engine.last = function(){
    engine.peek(state.index-1)
  }

  engine.peek = function(index){
    if(index !== 0 && index == null) index = state.index
    return hashes[index]  
  }

  engine.next = function(){
    var hash = hashes[state.index]
    assert(hash,'end of hash series')
    state.index++
    onChange(state)
    if(state.clientSeed) hash = crypto.createHmac('sha256',hash).update(state.clientSeed).digest(hex)
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

module.exports = Engine 
