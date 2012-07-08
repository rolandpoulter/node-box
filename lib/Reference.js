/*jslint smarttabs:true */

"use strict";

var path = require('path');

module.exports = require('clss')('Reference', function (def) {
	def.init = function (loader) {
		this.loader = loader;
		this.fullpath = loader.fullpath();

		this.dirname = path.dirname(this.fullpath);
		this.dependencyList = loader.dependencyList;

		return this;
	};

	def.mockModule = function (from, apiName, source) {
		var file = path.normalize('/' + path.relative(from, this.fullpath)),
		    name = apiName + '_';

		name += file.substr(file.lastIndexOf('/') + 1).
			replace(/[^A-Za-z0-9$_]/, '_');

		return apiName + '.provide("' + file + '", function ' + name +
			' (require, module, exports, __dirname, __firname) {' + source +  '});';
	};
});
