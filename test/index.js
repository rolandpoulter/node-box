module.exports = require('spc').describe('lib', function () {
	add(require('./lib/Box'));
})

require('spc/reporter/dot')(module.exports);