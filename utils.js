var assert = require('assert')

// exports.createSeed = function(rand){
//   assert(rand,'requires rand')
//   return rand.uuid4()
// }

exports.createSeed = function(len,possible){
    var text = "";
    len = len || 32
    possible = possible || "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghipqrstuvwxyz0123456789";

    for (var i = 0; i < len; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

exports.sha256 = function(crypto,seed){
  assert(crypto,'requires crypto')
  try{
    return crypto.createHash('sha256').update(seed).digest('hex');
  }catch(e){
    return crypto.SHA256(seed).toString()
  }
}

exports.rehash = function(crypto,hash,seed){
  assert(crypto,'requires crypto')
  assert(hash,'requires hash')
  if(seed == null) return hash
  try{
    return crypto.createHmac('sha256',hash).update(seed).digest('hex')
  }catch(e){
    var hmacHasher = crypto.algo.HMAC.create(crypto.algo.SHA256, hash);
    return hmacHasher.finalize(seed).toString();
  }
}

//reads maxHex characters from end of hash ( least significant bits)
exports.toInt = function(hash,maxHex){
  assert(hash,'requires hash')
  maxHex = maxHex || 8
  assert(hash.length >= maxHex,'hash is not long enough')
  return parseInt(hash.slice(-maxHex),16)
}

exports.toFloat = function(hash,min,max,exclusive){
  assert(hash,'requires hash')
  if(min == null) min = 0
  if(max == null) max = 1
  var integer = toInt(hash)
  var scale = max - min
  var limit = exclusive ? maxInt + 1 : maxInt
  return min + scale * (integer/limit)
}

exports.toBool = function(hash,percent){
  if(percent == null) percent = .5
  var num = toFloat(hash,0,1,true)
  return num < percent
}

exports.generate = function(crypto,count, seed){
  assert(seed,'requires seed value')
  count = count || 1
  var result = Array(count)
  for(var i = count-1; i >= 0; i--){
    seed = exports.sha256(crypto,seed)
    result[i]= seed
  }
  return result
}
