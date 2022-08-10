const multer = require('multer');
const mime = require('mime');

const storage = multer.diskStorage({
  destination: './upload/profile/',
  filename: (req, file, callback) => {
    callback(null, `${req.body.username}.${mime.getExtension(file.mimetype)}`);
  },
});

module.exports = photoUploaderMiddleware = () => {
  return multer({
    storage: storage,
    fileFilter: (req, file, callback) => {
      if (file.mimetype == 'image/png' || file.mimetype == 'image/jpeg') {
        callback(null, true);
      } else {
        callback(new Error('Wrong format: image must be PNG or JPEG'));
      }
    },
  });
};
