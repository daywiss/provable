var Random = require('random-js')
var crypto = require('crypto');
var seed = Random.generateEntropyArray()
var engine = Random.engines.mt19937().seedWithArray(seed)
var rand = new Random(engine)
var winston = require('../config/winston')
var Promise = require('bluebird')


exports.constants = {}
//max hex values we use from hash to calculate random number
exports.constants.maxHex = 13
exports.constants.maxInt = Math.pow(2,exports.constants.maxHex * 4)
//taken from bustabit client seed
exports.constants.clientSeed = '000000000000000007a9a31ff7f07463d91af6b5454241d5faf282e5e0fe1b3a'

exports.sha256 = function(seed){
  return crypto.createHash('sha256').update(seed).digest('hex');
}

exports.createSeed = function(){
  return rand.uuid4()
}

//returns series of random hashes which we can use for random
exports.createSeries = function(count,seed){
  if(seed == null){
    seed = exports.createSeed()
  }
  count = count || 1
  var result = Array(count)
  for(var i = count-1; i >= 0; i--){
    seed = exports.sha256(seed)
    result[i]= seed
  }
  return result
}             

//not a provable hash 
exports.randomHash = function(){
  return rand.hex(exports.constants.maxHex)
}

exports.parseFloat = function(hash){
  return exports.real(hash)
}

exports.parseInt = function(hash){
  return parseInt(hash.slice(0,exports.constants.maxHex) ,16)
}

exports.hmac = function(hash){
 return crypto.createHmac('sha256', hash).update(exports.constants.clientSeed).digest('hex');
}

//[min,max]
exports.real = function(hash,min,max){
   var hash = crypto.createHmac('sha256', hash).update(exports.constants.clientSeed).digest('hex');
   var integer = exports.parseInt(hash)
   if(min == null) min = 0
   if(max == null) max = 1
   
   var scale = max - min
   return min + scale * (integer / exports.constants.maxInt)
}

//[min,max)
exports.integer = function(hash,min,max){
   return Math.floor(exports.real(hash,min,max))
}

exports.bool = function(hash,percent){
  if(percent == null) percent = .5
  var real = exports.real(hash)
  return real <= percent
}

//taken directly from bustabit source
exports.mod = function(hash,mod){

  if(mod == null || mod <= 0) return false
  if(hash == null) return false

  // We will read in 4 hex at a time, but the first chunk might be a bit smaller
  // So ABCDEFGHIJ should be chunked like  AB CDEF GHIJ
  var val = 0;

  var o = hash.length % 4;
  for (var i = o > 0 ? o - 4 : 0; i < hash.length; i += 4) {
    val = ((val << 16) + parseInt(hash.substring(i, i+4), 16)) % mod;
  }

  return val === 0;
}

//call this to get the random generator
exports.Provable = Provable

function Provable(id,count){
  this.count = count || 10000
  this.id = id
  this.redis = require('../redis-models/provable')
  this.rethink = require('../models/provable')
  // this.init(id,count)
}

Provable.prototype.state = function(){
  return {
    id:this.id,
    seriesid:this.seriesid,
  }
}

Provable.prototype.init = function(id,count){
  var self = this
  //get the last series used for this id
  return this.rethink.getLastSeries(id).then(function(seriesid){
    if(seriesid){
      self.seriesid=seriesid
      return self.redis.length(seriesid).then(function(len){
        if(len == null || len == 0){
          return self.rethink.rest(seriesid).then(function(rest){
            winston.info('service.provable initializing provable redis server with previous series')
            return self.redis.init(seriesid,rest)
          })
        }else{
          winston.info('service.provable redis hashes existed',len)
          return true
        }
      })
    }else{
      winston.info('service.provable creating first provable series')
      return self.rethink.createSeries(id,count).then(function(seriesid){
        return self.rethink.rest(seriesid).then(function(rest){
          self.seriesid = seriesid
          return self.redis.init(seriesid,rest)
        })
      })
    }
  })
}

Provable.prototype.next = Promise.method(function(){
  var self = this
  if(this.seriesid == null){
    return this.init(this.id,this.count).then(function(){
      return self.next()
    })
  }
  return this.redis.next(this.seriesid).then(function(val){
    //no more values in this series
    if(val == null){
      winston.info('service.provable out of random values, starting new series')
      //create new series with rethink
      return self.rethink.createSeries(self.id,self.count).then(function(seriesid){
        //initialize redis 
        return self.init(self.id)
      }).then(function(){
        return self.next()
      })
    }else{
      //increment random counter
      winston.info('service.provable returned random hash', val)
      self.rethink.increment(self.seriesid)
      return val
    }
  })
})

// Provable.prototype.nextSync = function(){
//   var self = this
//   this.next().then(function(hash){
//     self._next = hash
//   })
//   return this._next 
// }

Provable.prototype.nextInt = function(){
  this.next().then(function(hash){
    return exports.parseInt(hash)
  })
}






