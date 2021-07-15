'use strict'

class Cache {
  constructor (opts = {}) {
    this._map = new Map()
    this._registry = new FinalizationRegistry((key) => {
      this._map.delete(key)
    })
    this._ttl = opts.ttl || 0
  }

  set (key, value) {
    const entry = new Entry(key, value, this._ttl)
    this._map.set(key, entry)
    this._registry.register(value, key, entry)
    return this
  }

  get (key) {
    const entry = this._map.get(key)
    if (!entry) {
      return undefined
    }

    if (entry.isExpired(this._ttl)) {
      this._map.delete(key)
      this._registry.unregister(entry)
      return undefined
    }

    const value = entry.ref.deref()

    if (value === undefined) {
      this._map.delete(key)
      return undefined
    }

    return value
  }
}

let _currentSecond

function currentSecond () {
  if (_currentSecond !== undefined) {
    return _currentSecond
  }
  _currentSecond = Math.floor(Date.now() / 1000)
  setTimeout(_clearSecond, 1000).unref()
  return _currentSecond
}
function _clearSecond () {
  _currentSecond = undefined
}

class Entry {
  constructor (key, value) {
    this.key = key
    this.ref = new WeakRef(value)
    this.savedAt = currentSecond()
  }

  isExpired (ttl) {
    if (ttl > 0) {
      const now = currentSecond()
      if (now - this.savedAt > ttl) {
        return true
      }
    }

    return false
  }
}

module.exports = Cache
