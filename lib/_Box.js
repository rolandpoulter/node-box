/*jslint smarttabs:true */

"use strict";

var fs = require('fs'),
    ujs = require('uglify-js'),
    path = require('path'),
    JSTokenizer = require('./JSTokenizer');

function isFunc (func) {
	return typeof func === 'function';
}

function safeApply (func, that, args) {
	if (isFunc(func)) return func.apply(that, args);
}

var api,
    out;

module.exports = require('clss')('BoxJS', function (def) {
	def.init = function (options, callback) {
		options = options || {};

		this.verbose = options.verbose || false;
		this.apiName = options.apiName || 'api';

		this.header = options.header || '';
		this.footer = options.footer || '';

		this.name = options.name || 'module';
		this.from = options.from ? path.resolve(options.from) : process.cwd();

		this.source = '';
		this.output = [];
		this.memory = {};

		return this.run(options, callback);
	};

	def.run = function (options, callback) {
		this.log('run', [options, callback]);

		options = options || {};
		callback = callback || options.callback;

		this.lastMain = options.main = options.main || '';

		this.require(options.main, function (err) {
			if (!err) {
				this.compile(function (err) {
					var count = 0,
					    that = this,
					    errs = [];

					function end (err) {
						count -= 1;

						if (err) errs.push(err);

						if (count === 0) {
							safeApply(callback, that, [errs.length > 1 ? errs : errs[0]]);
						}
					}

					function out () {
						options.write = path.resolve(options.write);
						options.uglilfy = path.resolve(options.uglify);

						if (options.write) {
							count += 1;
							that.write(options.write, end);
						}

						if (options.uglify) {
							count += 1;
							that.uglify(options.uglify, end);
						}

						if (count === 0) {
							safeApply(callback, that);
						}
					}

					if (!err) {
						out();

						if (options.watch || options.watch === 0) {

							this.watch(options.watch, function () {
								safeApply(options.watcher, this);
								count = 2;
								out();
							});
						}

					} else {
						safeApply(callback, this, [err]);
					}
				});

			} else {
				safeApply(callback, this, [err]);
			}

		}, this.from, this.name);

		return this;
	};

	def.reset = function (options, callback) {
		delete this.lastMain;

		return this.unwatch().initRqr(options || this, callback);
	};

	def.forget = function () {
		this.source = '';
		this.output = [];
		this.memory = {};

		delete this.main;

		return this;
	};

	def.require = function (name, callback, from) {
		from = from || this.from;
		this.log('require', [name, from]);

		if (('./').indexOf(name.charAt(0)) !== -1) {
			this.requireFileOrDirectory(from + '/' + name, callback);

		} else {
			this.requireNodeModule(name, callback, from);
		}

		return this;
	};

	def.requireFile = function (file, callback) {
		this.log('requireFile', file);

		if (!this.main) {
			this.main = this.removeFileExt(path.relative(this.from, file));
		}

		var that = this;

		if (this.memory[file]) {
			safeApply(callback, this);

		} else {
			fs.readFile(file, 'utf8', function (err, source) {

				if (err || that.memory[file]) {
					safeApply(callback, that, [err]);

				} else {
					source = source || '';

					that.output.push({file: file, source: source});
					that.rememberFile(file);

					that.requireRequirments(
						path.dirname(file),
						path.basename(file),
						source,
						callback
					);
				}
			});
		}
		return this;
	};

	def.requireDirectory = function (dir, callback) {
		if (this.memory[dir]) {
			safeApply(callback, this);

			return this;
		}

		this.log('requireDirectory', dir);

		var that = this,
		    pack = dir + '/package.json',
		    main = '/index';

		function end (err) {
			var src;

			if (!err) {
				src = 'module.exports = require(".' +
					path.normalize('/' + that.removeFileExt(main)) + '");';

				that.memory[dir] = true;

				that.output.push({
					dir: true,
					file: dir + '/',
					source: src
				});
			}

			safeApply(callback, that, [err]);
		}

		path.exists(pack, function (exists) {
			if (exists) {

				fs.readFile(pack, 'utf8', function (err, data) {

					if (err) {
						safeApply(callback, that, [err]);

					} else try {
						data = JSON.parse(data);

						if (data.main) {
							main = '/' + data.main;
							that.requireFileOrDirectory(dir + main, end);

						} else {
							that.requireFileOrDirectory(dir + main, end);
						}

					} catch (jsonErr) {

						safeApply(callback, that, [
							new Error(jsonErr + ' from: ' + pack)
						]);
					}
				});

			} else {
				main = dir + main + '.js';

				path.exists(main, function (exists) {
					if (exists) that.requireFile(main, end);

					else safeApply(callback, that, [that.missingFile(dir)]);
				});
			}
		});

		return this;
	};

	def.requireFileOrDirectory = function (name, callback) {
		this.log('requireFileOrDirectory', name);

		var clean = this.removeFileExt(path.resolve(name)),
		    file = this.memory[clean + '.js'],
		    that = this;

		function end () {
			that.log('end requireFileOrDirectory', name);

			path.exists(clean, function (exists) {
				if (exists) {

					fs.stat(clean, function (err, stat) {
						if (err) {
							safeApply(callback, that, [err]);

						} else if (stat.isDirectory()) {
							that.requireDirectory(clean, callback);
						}
					});

				} else {
					safeApply(callback, that, [that.missingFile(clean)]);
				}
			});
		}

		if (file) {
			safeApply(callback, this);

		} else if (name.charAt(name.length - 1) !== '/') {

			path.exists(clean + '.js', function (exists) {
				if (exists) {
					that.requireFile(clean + '.js', callback);

				} else end();
			});

		} else end();

		return this;
	};

	def.requireNodeModule = function (name, callback, from) {
		this.log('requireNodeModule', [name, from]);

		if (this.memory[name]) {
			safeApply(callback, this);

			return this;
		}

		var that = this,
		    list = this.listModuleDirectories(from || this.from),
		    count = list.length,
		    found;

		function end (err) {
			if (count < 1 || found) return;

			that.log('end requireNodeModule', [name, from]);

			if (!err) found = true;

			else if (!err.missingFile && !err.missongModule) {
				count = 1;
			}

			count -= 1;

			if (found || count === 0) {

				if (err && err.missingFile) {
					err = new Error('Missing module: ' + name + ', from: ' + from);
					err.missingModule = name;
				}

				safeApply(callback, that, [err]);
			}
		}

		if (count) {
			this.memory[name] = true;

			list.forEach(function (dir) {
				var f = dir + '/' + name;
				that.requireFileOrDirectory(f, end, name);
			});

		} else {
			safeApply(callback, that, [new Error('Missing module: ' + name + ', from: ' + from)]);
		}

		return this;
	};

	def.requireRequirments = function (from, name, source, callback) {
		this.log('requireRequirements', [from, name]);

		var count = 0,
		    needs = this.listNeededRequirements(source),
		    that = this;

		function end (err) {
			if (count < 1) return;

			that.log('end requireRequirements', [from, name]);

			count -= 1;

			if (err && (!err.missingFile || err.missingModule)) {
				count = 0;
			}

			if (count === 0) {
				safeApply(callback, that, [err]);
			}
		}

		if (needs && needs.length) {
			count = needs.length;

			needs.forEach(function (_name) {
				that.require(_name, end, from);
			});

		} else {
			count = 1;
			end();
		}

		return this;
	};

	def.listModuleDirectories = function (from, callback) {
		this.log('listModuleDirectories', from);

		var parts = from.split('/'),
		    root = parts.indexOf('node_modules'),
		    dirs = [],
		    i = parts.length - 1;

		if (root === -1) root = 0;

		while (i >= root) {

			if (parts[i] === 'node_modules') {
				dirs.push(parts.join('/'));

			} else if (parts.length) {
				dirs.push(parts.join('/') + '/node_modules');
				parts.pop();
			}

			i -= 1;
		}

		return dirs;
	};

	def.listNeededRequirements = function (source) {
		this.log('listNeededRequirements');

		var tokens = new JSTokenizer().tokenize(source).tokens,
		    needs = [];

		if (tokens && tokens.length) {

			tokens.forEach(function (token, ind) {
				var last,
				    next,
				    i,
				    l;

				if (token.type === 'identity' && token.text === 'require') {
					i = ind;

					do {
						last = i && tokens[i -= 1];

					} while (last && last.type === 'white');

					if (!last || last.text !== '.') {
						i = ind;
						l = tokens.length;

						do {
							next = i < l && tokens[i += 1];

						} while (next && next.type === 'white');

						if (next.text === '(') {
							do {
								next = i < l && tokens[i += 1];

							} while (next && next.type === 'white');

							if (next.type === 'string') {
								needs.push(next.text);
							}
						}
					}
				}
			});
		}

		return needs;
	};

	def.discoverModuleAPI = function (callback) {
		var that = this;

		function end (err) {
			if (err || (api && out)) {
				safeApply(callback, that, [err, api, out]);
			}
		}

		function alt (err, data) {
			api = data;
			end(err);
		}

		if (api && out) {
			end();

		} else {
			fs.readFile(__dirname + '/../src/api.js', 'utf8', function (err, data) {
				api = data;
				end(err);
			});

			fs.readFile(__dirname + '/../src/out.js.txt', 'utf8', function (err, data) {
				out = data;
				end(err);
			});
		}
		return this;
	};

	def.rememberFile = function (file) {
		this.log('rememberFile', file);

		this.memory[file] = this.memory[this.removeFileExt(file)] = true;

		return this;
	};

	def.missingFile = function (file) {
		this.log('missingFile', file);

		var err = new Error('Missing file: ' + file);

		err.missingFile = file;

		return err;
	};

	def.removeFileExt = function (file) {
		return path.dirname(file) + '/' + path.basename(file, '.js');
	};

	def.compileFile = function (item) {
		this.log('compileFile', item.file);

		var file = path.normalize(
			'/' + this.removeFileExt(path.relative(this.from, item.file))
		),  name = this.apiName + '_' + file.substr(file.lastIndexOf('/') + 1).replace(/[^A-Za-z0-9$_]/, '_');

		if (item.dir && file !== '/')  {
			file += '/';
		}

		return ([
			this.apiName + '.provide("' + file + '", function ' + name + ' (require, module, exports) {',
				item.source,
			'});'
		]).join('\n');
	};

	def.compileOutput = function () {
		this.log('compileOutput');

		var that = this,
		    source = [];

		this.output.forEach(function (item) {
			source.push(that.compileFile(item));
		});

		return source.join('\n');
	};

	def.compile = function (callback) {
		this.log('compile');

		if (this.source) {
			safeApply(callback, this);

		} else {
			this.discoverModuleAPI(function (err, api, out) {
				var source = '',
				    name = this.name;

				if ((/[^a-z0-9_$]/i).test(name)) {
					name = '["' + name + '"]';

				} else {
					name = '.' + name;
				}

				out = out.
					replace(/\(api\)/g, this.apiName).
					replace(/\(name\)/g, name).
					replace(/\(main\)/g, path.normalize('/' + this.main));

				if (this.header) {
					source += this.header + '\n';
				}

				source += '(function()' + '{\n';
				source += 'var ' + this.apiName + ' = ' + api + '\n';
				source += this.compileOutput() + '\n';
				source += out + '\n';
				source += '}).call(this);';

				if (this.footer) {
					source += '\n' + this.footer;
				}

				this.source = source;

				safeApply(callback, this, [err]);
			});
		}

		return this;
	};

	def.write = function (file, callback) {
		var that = this;

		function end (err) {
			safeApply(callback, that, [err]);
		}

		if (this.source) {
			fs.writeFile(file, this.source, 'utf8', end);

		} else {
			end('Empty source.');
		}

		return this;
	};

	def.uglify = function (file, callback) {
		var that = this,
		    src = this.source,
		    ast;

		function end (err) {
			safeApply(callback, that, [err]);
		}

		if (src) {
			try {
				ast = ujs.parser.parse(src);
				ast = ujs.uglify.ast_mangle(ast);
				ast = ujs.uglify.ast_squeeze(ast);
				src = ujs.uglify.gen_code(ast);

			} catch (err) {
				return end(err);
			}

			if (this.header) {
				src = this.header + '\n' + src;
			}

			fs.writeFile(file, src, 'utf8', end);

		} else {
			end('Empty source.');
		}

		return this;
	};

	def.watch = function (options, callback) {
		var that = this,
		    name,
		    wait,
		    watch,
		    timer,
		    files = this.watchers,
		    persist;

		options = options || {};
		callback = callback || options.callback;

		delete options.callback;

		if (isFinite(options)) {
			watch = options;
			options = {};

		} else {
			watch = options.interval;
		}

		wait = options.wait;
		wait = isFinite(wait) ? wait : 100;
		watch = isFinite(watch) ? watch : 0;

		persist = options.persist;

		if (!files) {
			files = this.watchers = [];
		}

		for (name in this.memory) {

			if (this.memory[name] === true && name.substr(name.length - 3) === '.js') {

				if (files.indexOf(name) === -1) {
					files.push(name);
				}
			}
		}

		options = {
			persistent: persist,
			interval: watch
		};

		files.forEach(function (file) {
			function update () {
				clearTimeout(timer);

				timer = setTimeout(function () {

					that.forget().run({main: that.lastMain}, function (err) {

						safeApply(callback, that, [err]);
					});
				}, wait);
			}

			if (fs.watch) fs.watch(file, options, function (event, filename) {
				if (event === 'change') update();
			});

			else fs.watchFile(file, options, function (curr, prev) {
				if (curr.mtime > prev.mtime) update();
			});
		});

		return this;
	};

	def.unwatch = function () {
		var files = this.watchers;

		if (files) {

			files.forEach(function (file) {
				fs.unwatchFile(file);
			});

			delete this.watchers;
		}

		return this;
	};

	def.log = function () {
		if (this.verbose) console.log.apply(console, arguments);

		return this;
	};
});
