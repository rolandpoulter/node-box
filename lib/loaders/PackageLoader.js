/*jslint smarttabs:true */

"use strict";

var fs = require('fs'),
    FileLoader = require('./FileLoader'),
    Requirement = require('../Requirement'),
    ModulePackage = require('../ModulePackage');

module.exports = Requirement.clss('PackageLoader', function (def) {
	this.fromDirectory = Requirement.fromSelf;

	def.init = function () {
		this.initRequirement.apply(this, arguments);

		this.modulePackage = new ModulePackage(this);

		return this;
	}

	def.process = function (callback) {
		this.once('ready', callback);

		if (this.isDirectory()) {
			this.name = this.name.substr(0, this.name.length - 1);
		}

		var dir = this.dir = this.fullpath() + '/',
		    pack = this.pack = dir + 'package.json',
		    that = this;

		if (this.dependencyList.includes(dir))
			return this.finish(null, null, dir);

		this.dependencyList.include(this.dir, this.modulePackage);

		fs.exists(pack, function (exists) {
			if (exists) that.loadPackage();

			else that.loadFile('index');
		});

		return this;
	};

	def.loadFile = function (name) {
		new FileLoader(this.dependencyList, name, this.dir, this.finish.bind(this)).process();

		return this;
	};

	def.loadPackage = function () {
		var that = this;

		fs.readFile(this.pack, 'utf8', function (error, jsonPackage) {
			if (that.dependencyList.includes(that.dir))
				return that.finish(null, null, that.dir);

			if (error) return that.error(error).finish(error);

			try {
				jsonPackage = JSON.parse(jsonPackage);

				that.modulePackage.setData(jsonPackage);

				if (jsonPackage.main) that.loadFile(jsonPackage.main);

				else that.loadFile('index');

			} catch (error) {
				that.error(error).finish(error);
			}
		});

		return this;
	};

	def.missingPackage = function (error) {
		return this.missingPackage('Package', error);
	};
});
