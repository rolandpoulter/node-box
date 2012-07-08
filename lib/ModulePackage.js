/*jslint smarttabs:true */

"use strict";

var Reference = require('./Reference');

module.exports = Reference.clss('ModulePackage', function (def) {
	def.compileSource = function () {
		return this.loader.dependencyList.get(this.loader.dir).compileSource();
	};

	def.setData = function (data) {
		this.data = data;

		return this;
	};
});
