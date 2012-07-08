/*jslint smarttabs:true */

"use strict";

module.exports = require('clss').clss('ModulesPathList', function (def) {
	def.init = function (from) {
		var parts = (this.from = from).split('/'),
		    root = parts.indexOf('node_modules'),
		    dirs = this.list = [],
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

		return this;
	};
});
