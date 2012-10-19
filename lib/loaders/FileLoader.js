"use strict";

var fs = require('fs'),
    util = require('../util'),
    Script = require('../Script'),
    Requirement = require('../Requirement'),
    DirectoryLoader = require ('./DirectoryLoader');

module.exports = Requirement.clss('FileLoader', function (def) {
	this.fromRequirement = this.fromSelf;

	def.init = function () {
		this.initRequirement.apply(this, arguments)

		this.script = new Script(this);

		return this;
	};

	def.process = function (callback) {
		this.once('ready', callback);

		this.name = util.removeFileExt(this.name);

		var file = this.file = this.fullpath(),
		    full = this.full = file + '.js',
		    that = this;

		if (this.dependencyList.includes(file))
			return this.finish(null, null, file);

		this.dependencyList.include(file, this.script);

		if (this.isDirectory()) this.loadDirectory();

		else fs.exists(full, function (exists) {
			if (exists) that.readFile();

			else that.loadDirectory();
		});

		return this;
	};

	def.loadDirectory = function () {
		DirectoryLoader.fromFile(this).process();

		return this;
	};

	def.readFile = function () {
		var that = this;

		fs.readFile(this.full, 'utf8', function (error, source) {
			if (error) return that.error(error).finish(error);

			that.script.setSource(source || '').process();
		});

		return this;
	};

	def.missingFile = function (error) {
		return this.missing('File', error);
	};
});
