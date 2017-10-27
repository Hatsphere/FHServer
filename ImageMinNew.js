var sharp = require('sharp');

sharp('input.jpg')
    .resize(500, 500, {
        kernel: sharp.kernel.lanczos2,
        interpolator: sharp.interpolator.nohalo
    })
    .background('white')
    .embed()
    .toFile('output.tiff')
    .then(function() {
    // output.tiff is a 200 pixels wide and 300 pixels high image
    // containing a lanczos2/nohalo scaled version, embedded on a white canvas,
    // of the image data in inputBuffer
    });
