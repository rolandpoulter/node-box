var BoxJS = require('../../Box');
module.exports = new BoxJS({
	name: 'myBuild',
	main: './source',//can be a file or directory
	from: __dirname + '/',//must be a directory
	write: __dirname + '/output.js',
	uglify: __dirname + '/output-min.js',
	header: '//myBuild',
	footer: '//' + Date(),
	apiName: 'myBuild',
	verbose: true
});