import express from "express";
import mongoose from "mongoose";
import documentRoutes from "./routes/documentRoutes.js";

const app = express();
app.use(express.json());

app.use("/", documentRoutes);

mongoose.connect("mongodb://localhost:27017/vectorDB")
    .then(() => app.listen(5000, () => console.log("Server running on port 5000")))
    .catch(err => console.error("MongoDB connection error:", err)); 
