/*
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
*/