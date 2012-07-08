/*jslint smarttabs:true */

"use strict";

var fs = require('fs'),
    ujs = require('uglify-js'),
    path = require('path'),
    async = require('async'),
    Emitter = require('mttr'),
    Options = require('ptns'),
    DependencyList = require('./DependencyList'),
    Requirement = require('./Requirement');

module.exports = Emitter.clss('BoxJS', function (def) {
	Options.create(def);

	def.options = {
		apiName: 'api',
		header: '',
		footer: '',
		from: './',
		name: 'module'
	};

	def.init = function (options, callback) {
		this.dependencyList = new DependencyList();
		this.requirements = [];

		return this.initEmitter().once('ready', callback).newOptions(options);
	};

	def.forget = function () {
		delete this.source;

		return this.initBox();
	}

	def.require = function (name, path) {
		path = path || this.options.from;

		var requirement = new Requirement(this.dependencyList, name, path);

		this.requirements.push(requirement);

		return this;
	}

	def.process = function (callback) {
		var that = this.periodic('ready').once('ready', callback);

		async.forEach(this.requirements, function (requirement, next) {
			requirement.process(next);

		}, function (error) {
			if (error) that.errors.push(error);

			that.forever('ready');
		});

		return this;
	};

	def.compile = function (callback) {
		if (typeof this.source === 'string') return this;

		var that = this;

		this.once('ready', function () {
			this.source = this.options.header;
			this.source += '\n(function(){\n' + this.mockRequire();

			this.dependencyList.forEach(function (dependency) {
				that.source += '\n' + dependency.compileSource(
					that.options.from,
					that.options.apiName
				);
			});

			this.source += '\n' + this.bootstrapMain(
				this.options.name,
				this.options.apiName,
				this.dependencyList.main
			) + '\n}).call(this);';
			this.source += '\n' + this.options.footer;

			if (typeof callback === 'function') {
				callback.call(this);
			}
		});

		return this;
	};

	def.mockRequire = function () {
		if (this._mockRequire) return this._mockRequire;

		return this._mockRequire = fs.readFileSync(__dirname + '/../src/api.js', 'utf8');
	};

	def.bootstrapMain = function (name, apiName, main) {
		if (!this._bootsrapMain) {
			this._bootstrapMain = fs.readFileSync(__dirname + '/../src/out.js.txt', 'utf8');
		}

		if ((/[^a-z0-9_$]/i).test(name)) name = '["' + name + '"]';

		else name = '.' + name;

		return this._bootstrapMain.
			replace(/\(api\)/g, apiName).
			replace(/\(name\)/g, name).
			replace(/\(main\)/g, path.normalize('/' + main));
	};

	def.write = function (file, callback) {
		if (this.source) fs.writeFile(file, this.source, 'utf8', callback);

		else callback();

		return this;
	};

	def.uglify = function (file, callback) {
		var ast,
		    src;

		if (!this.source) return callback();

		try {
			ast = ujs.parser.parse(this.source);
			ast = ujs.uglify.ast_mangle(ast);
			ast = ujs.uglify.ast_squeeze(ast);
			src = ujs.uglify.gen_code(ast);

		} catch (error) {
			return callback(error);
		}

		fs.writeFile(file, src, 'utf8', callback)

		return this;
	};
});
