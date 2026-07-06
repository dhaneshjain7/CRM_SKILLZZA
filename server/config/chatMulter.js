const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '../uploads/chat');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(12).toString('hex');
    const ext    = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}_${unique}${ext}`);
  },
});

// Allowed: images, PDF, Word, Excel
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx'];

const EXT_TO_TYPE = {
  '.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.gif': 'image', '.webp': 'image',
  '.pdf': 'pdf',
  '.doc': 'word', '.docx': 'word',
  '.xls': 'excel', '.xlsx': 'excel',
};

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) {
    return cb(new Error(`File type not allowed. Accepted: Images, PDF, Word, Excel. Got: ${ext}`), false);
  }
  cb(null, true);
};

const chatUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

module.exports = { chatUpload, EXT_TO_TYPE };
