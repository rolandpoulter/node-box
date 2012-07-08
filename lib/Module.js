/*jslint smarttabs:true */

"use strict";

var Reference = require('./Reference');

module.exports = Reference.clss('Module', function (def) {
	def.compileSource = function (from, apiName) {
		var source = '';

		//console.log(this.loader);

		if (this.versions.length) {
			source += this.versions[0].compileSource(from, apiName);
		}

		source += '\n' +
			this.mockModule(from, apiName, 'module.exports = require(\'./' + this.fullpath + '\');');

		return source;
	};

	def.foundVersions = function (versions) {
		this.versions = versions;

		return this;
	};
});
