var sharp=require('sharp');


var optimizeImage=function(destination, callback){
sharp(inputBuffer)
	.resizw(500, 500,{
	kernel: sharp.kernel.lanczos2,
	interpolator: sharp.interpolator.nohalo
	})
	.background('White')
	.embed()
	.tofile('Output.webp', destination+'build/image')
	.then(files => {
		callback(files[0]);
	});

}

module.exports = {
	optimize: optimizeImage
}
