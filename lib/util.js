/*jslint smarttabs:true */

"use strict";

var path = require('path');

exports.removeFileExt = function (file, ext) {
	return path.dirname(file) + '/' + path.basename(file, ext || '.js');
};
