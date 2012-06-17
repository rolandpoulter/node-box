//myBuild
(function(){
var myBuild = (function(){"use strict";
	var global = this,
	    require = this.require,
	    modules = {};
	function resolveModule (path) {
		var slash = path.indexOf('/'),
		    name, mod, m;
		if (slash === -1) return path;
		name = path.substring(0, slash);
		path = path.substr(slash);
		mod = modules[name];
		if (!mod) return path;
		for (m in modules) {
			if (modules[m] === mod && m !== name) {
				break;
			}
			m = null;
		}
		return (m ? m : name) + '/' + path;
	}
	function resolve (path, from) {
		if (path.charAt(0) === '/') return path;
		if (path.charAt(0) !== '.') {
			return resolveModule(path);
		}
		var names = path.split('/'), clean = [],
		    len = names.length, i = 0, p;
		from = from || '';
		if (from.charAt(from.length - 1) === '/') {
			from = from.substring(0, from.length - 1);
		}
		for (; i < len; i += 1) {
			p = names[i];
			if (p === '../') {
				from = path.substring(0, path.lastIndexOf('/')) || '';
			} else if (p && p !== './') {
				clean.push(p);
			}
		}
		if (from === '/') from = '';
		return from + '/' + clean.join('/');
	}
	return {
		require: function (path, from) {
			var module = modules[path] || modules[path + '/index'];
			if (!module) {
				path = resolve(path, from);
				module = modules[path] || modules[path + '/index'];
			}
			if (module) {
				if (module.install) {
					module.install();
				}
				return module.exports;
			}
			throw new Error('not found');
		},
		provide: function (path, factory, module) {
			var that = this;
			modules[path] = {
				exports: {},
				require: function (path) {
					var from = path.substring(0, path.lastIndexOf('/'));
					return that.require(path, from);
				},
				install: function () {
					delete this.install;
					factory.call(global, this.require, this, this.exports);
					return this;
				}
			};
			if (module) {
				modules[module] = modules[path];
			}
			return this;
		},
		freeze: function (path) {
			var obj;
			delete this.provide;
			delete this.freeze;
			if (path) {
				obj = this.require(path);
				obj.require = this.require;
				obj.conflict = this.conflict;
				obj.noConflict = this.noConflict;
			}
			return this;
		}
	};
}).call(this);
myBuild.provide("/source", function (require, module, exports) {
var moduleFoo = require('moduleFoo'),
    scriptBar = require('./scriptBar');
exports.foo = moduleFoo;
exports.bar = scriptBar;
});
myBuild.provide("/scriptBar", function (require, module, exports) {
exports.name = 'scriptBar';
});
myBuild.provide("/node_modules/moduleFoo/index", function (require, module, exports) {
exports.name = 'moduleFoo';
});
(function(){"use strict";
	/*global module name api main global require*/
	var that = this;
	if (typeof module !== 'undefined') {
		module.exports = myBuild.freeze();
	} else {
		myBuild = myBuild.freeze("./source");
		myBuild.conflict = this["myBuild"];
		myBuild.noConflict = function () {
			if (require) {
				that.require = that.require.conflict;
			}
			return (that["myBuild"] = (this.conflict || this));
		};
		this["myBuild"] = myBuild;
	}
}).call(this);
}).call(this);
//Fri Dec 09 2011 20:55:55 GMT-0800 (PST)