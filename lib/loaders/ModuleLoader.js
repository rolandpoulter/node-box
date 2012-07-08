/*jslint smarttabs:true */

"use strict";

var async = require('async'),
    Module = require('../Module'),
    FileLoader = require('./FileLoader'),
    Requirement = require('../Requirement'),
    DependencyList = require('../DependencyList'),
    ModulesPathList = require('../ModulesPathList');

module.exports = Requirement.clss('ModuleLoader', function (def, supr) {
	def.init = function () {
		this.initRequirement.apply(this, arguments);

		this.module = new Module(this);

		this.modulesPathList = new ModulesPathList(this.path).list;
		this.scopedDependencyList = new DependencyList();

		return this;
	};

	def.process = function (callback) {
		this.once('ready', callback);

		var that = this,
		    full = this.fullpath(),
		    found;

		if (this.dependencyList.includes(full))
			return this.finish(null, null, full);

		found = this.found = [];

		this.dependencyList.include(this.name, this.module);

		function iterator (directory, callback) {
			that.loadFile(directory, function (error, reference) {
				if (error) that[error.missingFile ? 'missingModule' : 'error'](error);

				else if (reference) found.push(reference);

				callback(error &&
					!error.missingFile &&
					!error.missingModule &&
					!error.missingPackage &&
					!error.missingDirectory ?
						error : undefined);
			});
		}

		if (this.modulesPathList.length) {
			async.forEach(this.modulesPathList, iterator, that.finish.bind(this));
		}

		else this.missingModule().finish();

		return this;
	};

	def.finish = function (error) {
		this.module.foundVersions(this.found);

		return supr.finish.call(this, error, this.module);
	};

	def.loadFile = function (directory, callback) {
		new FileLoader(this.scopedDependencyList, this.name, directory).process(callback);

		return this;
	};

	def.missingModule = function (error) {
		return this.missing('Module', error, this.module);
	};
});
