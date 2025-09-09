// // // routes/uploadRoutes.js
// // import express from 'express';
// // import multer from 'multer';
// // import path from 'path';
// // import fs from 'fs';
// // import { fileURLToPath } from 'url';
// // import { uploadHandler, getQuestionsHandler } from '../controllers/fileController.js';

// // // emulate __dirname in ESM
// // const __filename = fileURLToPath(import.meta.url);
// // const __dirname = path.dirname(__filename);

// // // temporary upload directory used by multer before moving to stored_files
// // const TMP_UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
// // if (!fs.existsSync(TMP_UPLOAD_DIR)) fs.mkdirSync(TMP_UPLOAD_DIR, { recursive: true });

// // const storage = multer.diskStorage({
// //   destination: (req, file, cb) => cb(null, TMP_UPLOAD_DIR),
// //   filename: (req, file, cb) => {
// //     const ext = path.extname(file.originalname);
// //     cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
// //   }
// // });

// // const fileFilter = (req, file, cb) => {
// //   const ext = path.extname(file.originalname).toLowerCase();
// //   if (['.csv', '.sqlite', '.db'].includes(ext)) cb(null, true);
// //   else cb(new Error('Only csv, sqlite, and db files are allowed'), false);
// // };

// // const maxFiles = parseInt(process.env.MAX_UPLOAD_FILES || '10', 10);
// // const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || String(50 * 1024 * 1024), 10);

// // const upload = multer({
// //   storage,
// //   fileFilter,
// //   limits: { fileSize: maxFileSize }
// // });

// // const router = express.Router();

// // router.post('/upload', upload.array('files', maxFiles), uploadHandler);
// // router.get('/files/:id/questions', getQuestionsHandler);

// // export default router;


// // routes/uploadRoutes.js
// import express from 'express';
// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';
// import { uploadFiles, fetchQuestions } from '../controllers/fileController.js';

// const router = express.Router();

// const UPLOADS_DIR = path.resolve('uploads');
// if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, UPLOADS_DIR),
//   filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
// });
// const upload = multer({ storage });

// router.post('/upload', upload.array('files', 10), uploadFiles);
// // use path param style:
// router.get('/files/:id/questions', fetchQuestions);
// // also support query param style:
// router.get('/questions', fetchQuestions);

// export default router;
