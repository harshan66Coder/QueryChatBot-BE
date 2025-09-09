import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
    filename: String,
    originalName: String,
    text: String,
    chunks: Array, // { text, vector, meta }
    vectorStorePath: String, // path to local folder
});

const Document = mongoose.model("Document", DocumentSchema);
export default Document;
