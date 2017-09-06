var test = require('tape')
var Random = require('random-js')
var Engine = require('./')
var utils = require('./utils')
var lodash = require('lodash')
// var crypto = require('crypto-js')
var crypto = require('crypto')

//create random
// var seed = Random.generateEntropyArray()
// var engine = Random.engines.mt19937().seedWithArray(seed)
// var rand = new Random(engine)


test('provable',function(t){
  var engine = null
  var random = null
  var options = {
    count:100000,
    seed:'test seed',
    publicSeed:'another seed',
  }
  t.test('init',function(t){
    engine = Engine(options)
    t.ok(engine)
    t.end()
  })
  t.test('hashes',function(t){
    var hashes = engine.hashes()
    t.equal(hashes.length,options.count)
    t.end()
  })
  t.test('hashes slice',function(t){
    var hashes = engine.hashes(0,10)
    t.equal(hashes.length,10)
    t.end()
  })
  t.test('stats',function(t){
    var stats = {count:0,min:Math.pow(2,32),max:0,hist:{}}
    var val = engine()
    do{
      stats.min = stats.min > val ? val: stats.min
      stats.max = stats.max < val ? val: stats.max
      stats.count++
      // if(stats.hist[val] == null) stats.hist[val] = 0
      // stats.hist[val]++
      try{
        val = engine()
        // console.log(val)
      }catch(e){
        val = null
      }
    }while(val)

    t.ok(stats.min > 0)
    t.ok(stats.max < Math.pow(2,32))
    t.equal(stats.count,options.count)
    console.log(stats)
    t.end()
  })
  t.test('state',function(t){
    var state = engine.state(options)
    t.equal(state.index,options.count)
    t.equal(state.seed,options.seed)

    state = Engine().state()
    t.ok(state.seed.length)
    t.notEqual(state.seed,options.seed)
    t.end()
  })
  t.test('random',function(t){
    engine = Engine(options)
    random = Random(engine)
    t.ok(random)
    t.end()
  })
  t.test('next',function(t){
    engine = Engine({count:10})
    var hash = engine.next()
    t.ok(hash.length)
    var nextHash = engine.peek()
    var scrambled = engine.next('clientseed')
    t.notEqual(nextHash,scrambled)
    t.end()
  })

  t.test('last',function(t){
    var next = engine.next()
    var last = engine.last()
    var curr = engine.peek()
    t.equal(next,last)
    t.notEqual(curr,last)
    t.end()
  })

  t.test('random stats',function(t){
    var val = random.bool()
    var stats = {count:0,'true':0,'false':0}
    do{
      stats[val]++
      stats.count++
      try{
        val = random.bool()
      }catch(e){
        val = null
      }
    }while(val !== null)
    var prob = stats.true/options.count
    console.log(stats,prob)
    t.equal(stats.count,options.count)
    t.ok(lodash.inRange(prob,.49,.51))
    t.end()
  })

  t.test('resume',function(t){
    engine = Engine(options)
    lodash.times(100,engine)
    var state = engine.state()
    var next = engine.peek()

    engine = Engine(state)
    var hash = engine.next()
    t.equal(hash,next)
    t.end()
  })

  t.test('generate',function(t){
    var series = Engine.generate(10,'test')
    t.equal(series.length,10)
    series = Engine.generate(10,'seed')
    t.equal(series.length,10)
    t.end()
  })

  t.test('proving stuff',function(t){
    var hash = 'bea3d13023a3f99f16553c6bc9e02f78b09de773d2d226b93afffe16022be98f'
    var provable = Engine({
      seed:hash,
      count:10,
    })
    var hashes = provable.hashes(null,null,true,true)
    var original = lodash.clone(provable.hashes())
    t.deepEqual(original,hashes.slice(1).reverse())
    t.equal(hashes[0],hash)
    t.deepEqual(original,provable.hashes())
    t.end()
  })

  t.test('rands',function(t){
    var hash = 'bea3d13023a3f99f16553c6bc9e02f78b09de773d2d226b93afffe16022be98f'
    t.ok(Engine.toFloat(hash))
    t.ok(Engine.toInt(hash))
    t.ok(Engine.toBool(hash))
    t.end()
  })

})
