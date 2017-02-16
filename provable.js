var Random = require('random-js')
var crypto = require('crypto');
var assert = require('assert')
var lodash = require('lodash')

//create random
var seed = Random.generateEntropyArray()
var engine = Random.engines.mt19937().seedWithArray(seed)
var rand = new Random(engine)

function Engine(options){
  function defaults(options){
    return lodash.defaults(lodash.clone(options),{
      id:rand.uuid4(),
      index:0,
      count:1,
      seed:createSeed(),
      onChange:function(){},
      clientSeed:null,
    })
  }

  var state = {}
  var hashes = null

  function onChange(state){
    state.onChange(state)
  }

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

  function nextHash(){
    var hash = hashes[state.index++]
    onChange(state)
    assert(hash,'end of hash series')
    if(state.clientSeed) hash = crypto.createHmac('sha256',hash).update(state.clientSeed).digest(hex)
    return hash
  }

  function int32(hash){
    return parseInt(hash.slice(-8),16)
  }

  function next(){
    return int32(nextHash())
  }

  next.state = function(){
    return state
  }
  next.hashes = function(){
    return hashes
  }
  next.getHash = function(index){
    return hashes[index]
  }

  next.peekHash = function(){
    return hashes[state.index]  
  }

  next.nextHash = nextHash
  next.generate = generate

  function init(){
    state = defaults(options)
    hashes = generate(state.count,state.seed)
    onChange(state)
    return next
  }

  return init()
}

module.exports = Engine 
