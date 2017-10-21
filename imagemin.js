let imagemin = require('imagemin');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminPngquant = require('imagemin-pngquant');

var optimizeImage = function (path, destination, callback) {
    imagemin([path], destination + 'build/images', {
        plugins: [
            imageminJpegtran({quality: '65-70'}),
            imageminPngquant({quality: '65-70'})
        ]
    }).then(files => {
        callback(files[0]);
    });
}

module.exports = {
    optimize: optimizeImage
}
