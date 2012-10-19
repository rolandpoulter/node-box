/*jslint smarttabs:true */

var BoxJS = require('../../lib/Box'),
    path = require('path')

module.exports = require('spc').describe('BoxJS', function () {
	before(function () {
		should();
	});

	beforeEach(function () {
		this.subject = new BoxJS({
			from: path.join(__dirname, '..', '..')
		});
	});

	describe('adding a requirement', function () {
		beforeEach(function () {
			this.subject.require('./lib/Box');
		});

		it('should have added a new requirement', function () {
			this.subject.requirements.length.should.equal(1);
		});

		describe('and processing', function () {
			beforeEach(function (done) {
				this.subject.process(done);
			});

			it('expands the requirements', function () {
				Object.keys(this.subject.dependencyList.dependencies).length.should.equal(21);
			});

			describe('and compiling', function () {
				beforeEach(function (done) {
					this.subject.compile(done);
				});

				it('ok', function (done) {
					this.subject.write(__dirname + '/../output.js', done);

					//console.log(Object.keys(this.subject.dependencyList.dependencies));
				});
			});
		});
	});
});
