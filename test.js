'use strict'

const { test } = require('tap')
const Cache = require('.')
const { promisify } = require('util')
const immediate = promisify(setImmediate)
const sleep = promisify(setTimeout)

test('create a cache baked by WeakRef', async ({ equal }) => {
  const cache = new Cache()

  {
    const obj = { foo: 'bar' }
    cache.set('hello', obj)
    equal(cache.get('hello'), obj)
  }

  await immediate()

  // We need to allocate a bazillion amount of objects
  // to trigger a GC
  const data = []
  for (let i = 0; i < 1000000; i++) {
    data.push({ i })
  }

  equal(cache.get('hello'), undefined)
})

test('ttl', async ({ equal }) => {
  const cache = new Cache({ ttl: 1 })

  {
    const obj = { foo: 'bar' }
    cache.set('hello', obj)
    equal(cache.get('hello'), obj)
  }

  await sleep(2000)

  equal(cache.get('hello'), undefined)
})

test('unknown key', async ({ equal }) => {
  const cache = new Cache()

  equal(cache.get('unknown'), undefined)
})
