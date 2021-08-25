var fs = require('fs');
var rs = fs.createReadStream('blk01010.dat','hex');

rs.readByte = function(n) {
	return rs.read(2*n)
}

rs.on('readable', function () {
	console.log(rs.readByte(4));
	console.log(rs.readByte(4));
	console.log(rs.readByte(4));
});

	// rs.pipe(process.stdout);}
