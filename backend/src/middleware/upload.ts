import multer from 'multer';

// Keep file in buffer memory for raw parsing
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // Limit configuration files to 2MB
  },
  fileFilter: (req, file, cb) => {
    // Allow common network text logs or generic config formats
    if (file.originalname.match(/\.(txt|cfg|log|conf|ini)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only configuration text formats (.txt, .cfg, .log, .conf) are supported.'));
    }
  }
});
