# Provable
A Provably random engine which can be plugged into [random-js](https://www.npmjs.com/package/random-js). 

#Install
`npm install --save provable`

#About
This library attempts to implement the algorithm first outlined in the bitcoin talk formums:
[https://bitcointalk.org/index.php?topic=922898.0](https://bitcointalk.org/index.php?topic=922898.0).
The idea behind provably random is that a deteministic series of related but random hashes are generated before
any random outcomes are calculated. Once generated, each hash in the series is used to create a random outcome.
The provable part comes in when a client wants to verify the integrity of the outcome. After every outcome
is produced the hash which produced it can also be made public. If one has access to the current hash and
the previous hash (from the previous outcome), then a SHA256 can be used on the current hash to generate the previous.
This should hold true for all hashes in the series as they are exposed. You cannot predict the next hash, but you
can verify the previous hash by hashing its predecessor. Any deviation from this verification result would mean that the hashes
were tampered with  and not part of the pregenerated series. Hence you can "prove" the random outcome was fair.

#Usage
This library can be used standalone to generate a series of random hashes. The engine can then
be plugged into random-js in order to give you more control over your random values. By default
the engine will only supply a 32-bit random integer based on the next hash in the series. The 
state of the engine can be saved and resumed as needed.

```js
  var Provable = require('provable')

  var engine = Provable({
    count:10000, //default:1, number of hashes in the series to produce, takes longer depending on how big the number is
    seed:'optional seed to start your series with' //defaults to a random uuid4
  })

  //return a random int32
  var int32 = engine()

  //raw sha256 hash. Increments your hash index. Throws an error if no hashes left.
  //if you want to do your own random calculations then use this. 
  var hash = engine.nextHash()

  //internal state of the engine. Use this to save and resume your engine.
  var state = engine.state()

  //resuming will re-generate the entire hash chain from your seed and pick up where you
  //left off with the index
  var resumedEngine = Provable(state)

```

#Random-JS
[Random-js](https://www.npmjs.com/package/random-js) can give you more control over the values you can get. Keep in mind that random-js
only uses 32 bits of the hash, the rest is discarded. This provable engine defaults to using the 32 least
significant bits of the hash when generating the random integer.

```js
  var Random = require('random-js')
  var Engine = require('provable')

  //use random like a random-js object
  var random = Random(Engine({ count:10000 })

  //some examples
  random.bool()
  random.integer(min,max)
  random.real(min,max,inclusive)
  //etc...

  //keep in mind, the provable engine will throw when out of values, so you should wrap 
  //each call in try catch. When the engine throws, you should start a new serie When the engine throws, you should start a new series. 


```

#API
##Construction
