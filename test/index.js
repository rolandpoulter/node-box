/*jslint smarttabs:true */

var Modulator = require('rqr'),
    assert = require('assert'),
    build = require('./build');

assert(Modulator.test(build));

console.log('modulator passed');