/*jslint smarttabs:true */

"use strict";

var path = require('path'),
    async = require('async'),
    Reference = require('./Reference'),
    JSTokenizer = require('./JSTokenizer'),
    Requirement = require('./Requirement');

module.exports = Reference.clss('Script', function (def) {
	def.setSource = function (source) {
		this.source = source;

		return this;
	};

	def.compileSource = function (from, apiName) {
		return this.mockModule(from, apiName, this.source);
	};

	def.process = function () {
		var needs = this.listNeededRequirements(),
		    that = this;

		if (needs && needs.length) {
			async.forEach(needs, this.loadRequirement.bind(this), function (error) {
				that.loader.finish(error, that);
			});
		}

		return this;
	}

	def.loadRequirement = function (name, callback) {
		new Requirement(this.loader.dependencyList, name, this.dirname, callback).process();

		return this;
	};

	def.listNeededRequirements = function () {
		var tokens = new JSTokenizer().tokenize(this.source).tokens,
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

							if (next.type === 'string') needs.push(next.text);
						}
					}
				}
			});
		}

		return needs;
	};
});
