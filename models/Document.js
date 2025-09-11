import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
    filename: String,
    originalName: String,
    text: String,
    chunks: Array, 
    vectorStorePath: String, 
});

const Document = mongoose.model("Document", DocumentSchema);
export default Document;
