"use strict";

var fs = require('fs'),
    Requirement = require('../Requirement'),
    PackageLoader = require('./PackageLoader');

module.exports = Requirement.clss('DirectoryLoader', function (def) {
	this.fromFile = Requirement.fromSelf;

	def.process = function (callback) {
		this.once('ready', callback);

		var file = this.file = this.fullpath(),
		    that = this;

		fs.exists(file, function (exists) {
			if (exists) fs.stat(file, function (error, stat) {
				if (error) that.error(error).finish(error);

				else if (stat.isDirectory()) that.loadPackage();

				else that.missingDirectory().finish();
			});

			else that.missing('File').finish();
		});

		return this;
	};

	def.loadPackage = function () {
		PackageLoader.fromDirectory(this).process();

		return this;
	};

	def.missingDirectory = function (error) {
		return this.missing('Directory', error);
	};
});
