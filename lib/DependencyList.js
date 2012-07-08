/*jslint smarttabs:true */

"use strict";

module.exports = require('clss').clss('DependencyList', function (def) {
	def.init = function () {
		this.dependencies = {};

		return this;
	};

	def.get = function (path) {
		return this.dependencies[path];
	};

	def.includes = function (path) {
		return this.dependencies.hasOwnProperty(path);
	};

	def.include = function (path, dependency) {
		if (!this.main) this.main = path;

		return this.dependencies[path] = dependency;
	};

	def.forEach = function (iterator, that) {
		that = that || this;

		Object.keys(this.dependencies).forEach(function (key) {
			iterator.call(that, that.dependencies[key], key);
		}, this);

		return this;
	};
});
