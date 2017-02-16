var test = require('tape')
var Random = require('random-js')
var Engine = require('./')
var lodash = require('lodash')


test('provable',function(t){
  var engine = null
  var random = null
  var options = {
    count:100000,
    // seed:'test seed',
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
    var state = engine.state()
    t.equal(state.index-1,options.count)
    t.end()
  })
  t.test('random',function(t){
    engine = Engine(options)
    random = Random(engine)
    t.ok(random)
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
    var next = engine.peekHash()

    engine = Engine(state)
    var hash = engine.nextHash()
    t.equal(hash,next)
    t.end()
  })
})
