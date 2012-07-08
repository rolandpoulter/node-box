/*jslint smarttabs:true */

"use strict";

var path = require('path'),
    Emitter = require('mttr'),
    FileLoader,
    ModuleLoader;

module.exports = Emitter.clss('Requirement', function (def) {
	this.fromSelf = this.fromSelf || function (self) {
		var Self = this;

		return new Self(self.dependencyList, self.name, self.path, self.finish.bind(self));
	};

	def.init = function (dependencyList, name, path, callback) {
		this.dependencyList = dependencyList;

		this.errors = [];

		this.name = name;
		this.path = path || './';

		return this.initEmitter().once('ready', callback);
	};

	def.isDirectory = function () {
		return this.name.charAt(this.name.length - 1) === '/';
	};

	def.fullpath = function () {
		return path.resolve(this.path + (this.name ? '/' + this.name : ''));
	};

	def.process = function (callback) {
		this.once('ready', callback);

		var isModule = ('./').indexOf(this.name.charAt(0)) === -1,
		    Loader = isModule ? ModuleLoader : FileLoader,
		    finish = this.finish.bind(this);

		new Loader(this.dependencyList, this.name, this.path).process(finish);

		return this;
	};

	def.finish = function (error, reference, dependencyKey) {
		this.reference = reference = reference || this.reference;

		if (!this.reference && dependencyKey) {
			this.reference = this.dependencyList.get(dependencyKey);
		}

		return this.emit('ready', error, reference);
	};

	def.missing = function (type, error, value) {
		error = error || new Error(
			'Missing ' + type.toLowerCase() + ': ' + this.name + ' from: ' + this.path
		);

		error['missing' + type] = value || this;

		return this.error(error);
	};

	def.error = function (error) {
		this.errors.push(error);

		return this;
	};
});

FileLoader = require('./loaders/FileLoader');
ModuleLoader = require('./loaders/ModuleLoader');
