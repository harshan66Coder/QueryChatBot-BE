import express from "express";
import multer from "multer";
import { uploadFiles, getQuestions } from "../controllers/documentController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.array("files"), uploadFiles);


router.get("/questions/:docId", getQuestions);

export default router;
