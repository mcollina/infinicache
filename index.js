'use strict'

class Cache {
  constructor (opts = {}) {
    this._map = {}
    this._registry = new FinalizationRegistry((key) => {
      delete this._map[key]
    })
    this._ttl = opts.ttl || 0
  }

  set (key, value) {
    const entry = new Entry(key, value, this._ttl)
    this._map[key] = entry
    this._registry.register(value, key)
    return this
  }

  get (key) {
    const entry = this._map[key]
    if (entry === undefined) {
      return undefined
    }

    if (entry.isExpired(this._ttl)) {
      delete this._map[key]
      this._registry.unregister(entry.deref())
      return undefined
    }

    const value = entry.deref()

    if (value === undefined) {
      delete this._map[key]
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

class Entry extends WeakRef {
  constructor (key, value, ttl) {
    super(value)

    this.key = key
    this.savedAt = ttl ? currentSecond() : 0
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
