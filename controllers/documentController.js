import fs from "fs";
import path from "path";
import crypto from "crypto";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import Document from "../models/Document.js";
import { CSVLoader, SQLiteLoader } from "../utils/loaders.js";
import { getEmbedding, generateLLMResponse } from "../utils/embeddings.js";

const STORED_FILES_DIR = path.join(process.cwd(), "stored_files");
const VECTOR_STORE_DIR = path.join(process.cwd(), "vector_store");
if (!fs.existsSync(STORED_FILES_DIR)) fs.mkdirSync(STORED_FILES_DIR);
if (!fs.existsSync(VECTOR_STORE_DIR)) fs.mkdirSync(VECTOR_STORE_DIR);

export const uploadFiles = async (req, res) => {
    try {
        const { apiKey, model } = req.body;
        if (!apiKey) return res.status(400).json({ error: "API key is required" });
        if (!req.files || req.files.length === 0) return res.status(400).json({ error: "No files uploaded" });

        const uploaded = [];
        const skipped = [];

        await Promise.all(req.files.map(async (file) => {
            try {
                const ext = path.extname(file.originalname).toLowerCase();
                if (![".csv", ".sqlite", ".db"].includes(ext)) {
                    skipped.push(file.originalname);
                    fs.unlinkSync(file.path);
                    return;
                }

                const dest = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
                const destPath = path.join(STORED_FILES_DIR, dest);
                fs.renameSync(file.path, destPath);

                const docs = ext === ".csv"
                    ? await new CSVLoader(destPath).load()
                    : await new SQLiteLoader(destPath).load();

                const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 500, chunkOverlap: 50 });
                const splitDocs = await splitter.splitDocuments(docs);

                const chunks = await Promise.all(splitDocs.map(async (d) => ({
                    text: d.pageContent,
                    vector: await getEmbedding(d.pageContent, apiKey, model),
                    meta: d.metadata || {}
                })));

                const docVectorDir = path.join(VECTOR_STORE_DIR, dest);
                if (!fs.existsSync(docVectorDir)) fs.mkdirSync(docVectorDir);

                chunks.forEach((chunk, i) => {
                    fs.writeFileSync(path.join(docVectorDir, `chunk_${i}.json`), JSON.stringify(chunk, null, 2));
                });

                fs.writeFileSync(path.join(docVectorDir, `full_vectors.json`), JSON.stringify({ documentId: dest, originalName: file.originalname, chunks }, null, 2));

                const doc = new Document({
                    filename: dest,
                    originalName: file.originalname,
                    text: docs.map(d => d.pageContent).join("\n"),
                    chunks,
                    vectorStorePath: docVectorDir
                });
                await doc.save();

                uploaded.push({ id: doc._id, originalName: doc.originalName, vectorStoreFolder: docVectorDir });
            } catch (fileErr) {
                console.error(`Error processing file ${file.originalname}:`, fileErr);
            }
        }));

        const response = { uploaded };
        if (skipped.length > 0) response.skipped = skipped;

        res.json(response);
    } catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ error: err.message || String(err) });
    }
};

export const getQuestions = async (req, res) => {
    try {
        const { apiKey, model, q, topk } = req.query; 
        if (!apiKey) return res.status(400).json({ error: "API key is required" });

        const { docId } = req.params;
        const topK = parseInt(topk || "5", 10);

        const doc = await Document.findById(docId);
        if (!doc) return res.status(404).json({ error: "Document not found" });

        const query = q || "Generate 5 questions based on the content";
        const queryVec = await getEmbedding(query, apiKey, model);

        const cosineSim = (a, b) => {
            const dot = a.reduce((acc, v, i) => acc + v * b[i], 0);
            const magA = Math.sqrt(a.reduce((acc, v) => acc + v * v, 0));
            const magB = Math.sqrt(b.reduce((acc, v) => acc + v * v, 0));
            return dot / (magA * magB || 1e-10);
        };

        const scored = doc.chunks.map(c => ({ ...c, score: cosineSim(queryVec, c.vector) }));
        const topChunks = scored.sort((a, b) => b.score - a.score).slice(0, topK);

        const context = topChunks.map(c => c.text).join("\n\n");
        const messages = [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: `Context:\n${context}\n\nPlease generate 5 concise, numbered questions from the content.` }
        ];

        const questions = await generateLLMResponse(messages, apiKey, model);
        res.json({ docId, questions, topChunks });
    } catch (err) {
        console.error("Questions error:", err);
        res.status(500).json({ error: err.message || String(err) });
    }
};
