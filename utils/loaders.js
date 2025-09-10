import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import { Document as LC_Document } from "langchain/document";

export class CSVLoader {
    constructor(filePath) { this.filePath = filePath; } 
    async load() {
        const text = fs.readFileSync(this.filePath, "utf-8");
        return text.split("\n").filter(Boolean).map((line, i) => new LC_Document({
            pageContent: line,
            metadata: { line: i + 1, source: path.basename(this.filePath) },
        }));
    }
}

export class SQLiteLoader {
    constructor(filePath, tableLimit = 2000) { this.filePath = filePath; this.tableLimit = tableLimit; }
    async load() {
        const db = new sqlite3.Database(this.filePath);
        const tables = await new Promise((res, rej) => {
            db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => err ? rej(err) : res(rows.map(r => r.name)));
        });

        const docs = [];
        for (const table of tables) {
            const columns = await new Promise((res, rej) => {
                db.all(`PRAGMA table_info(${table})`, (err, cols) => err ? rej(err) : res(cols.map(c => c.name)));
            });
            const rows = await new Promise((res, rej) => {
                db.all(`SELECT * FROM ${table} LIMIT ${this.tableLimit}`, (err, rows) => err ? rej(err) : res(rows));
            });

            rows.forEach((row, i) => {
                const text = Object.values(row).map(v => v ?? "NULL").join(" | ");
                docs.push(new LC_Document({
                    pageContent: `Table: ${table}\nColumns: ${columns.join(", ")}\nRow: ${text}`,
                    metadata: { table, row: i + 1, source: path.basename(this.filePath) },
                }));
            });
        }
        db.close();
        return docs;
    }
}
