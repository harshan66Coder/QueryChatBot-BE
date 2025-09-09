import sqlite3 from "sqlite3";
import { Document } from "langchain/document";

export class SQLiteCustomLoader {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async load() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.filePath, sqlite3.OPEN_READONLY, (err) => {
        if (err) return reject(err);
      });

      const docs = [];

      db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';", (err, tables) => {
        if (err) {
          db.close();
          return reject(err);
        }

        let remaining = tables.length;
        if (remaining === 0) {
          db.close();
          return resolve([]);
        }

        tables.forEach((table) => {
          db.all(`PRAGMA table_info(${table.name});`, (err1, cols) => {
            if (err1) return reject(err1);

            const colNames = cols.map(c => c.name).join(", ");
            db.all(`SELECT * FROM ${table.name} LIMIT 2000;`, (err2, rows) => {
              if (err2) return reject(err2);

              const content = [
                `Table: ${table.name}`,
                `Columns: ${colNames}`,
                ...rows.map(r => Object.values(r).join(" | "))
              ].join("\n");

              docs.push(new Document({
                pageContent: content,
                metadata: { source: this.filePath, table: table.name }
              }));

              remaining--;
              if (remaining === 0) {
                db.close();
                resolve(docs);
              }
            });
          });
        });
      });
    });
  }
}
