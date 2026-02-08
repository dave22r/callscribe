import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../data/db.json');

class LocalDB {
    constructor() {
        this.data = { calls: [] };
    }

    async connect() {
        try {
            await fs.access(DB_PATH);
            const content = await fs.readFile(DB_PATH, 'utf-8');
            this.data = JSON.parse(content);
        } catch (error) {
            // If file doesn't exist, create it with default data
            await this.save();
        }
    }

    async save() {
        await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
        await fs.writeFile(DB_PATH, JSON.stringify(this.data, null, 2));
    }

    collection(name) {
        return {
            find: (query = {}) => ({
                sort: (sortOpts) => ({
                    limit: (limitNum) => ({
                        toArray: async () => {
                            let results = this.data[name] || [];
                            // Simple filtering
                            results = results.filter(item => {
                                for (let key in query) {
                                    if (item[key] !== query[key]) return false;
                                }
                                return true;
                            });
                            // Simple sorting
                            if (sortOpts && sortOpts.timestamp === -1) {
                                results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                            }
                            // Simple limiting
                            if (limitNum) {
                                results = results.slice(0, limitNum);
                            }
                            return results;
                        }
                    })
                }),
                toArray: async () => {
                    return this.data[name] || [];
                }
            }),
            findOne: async (query) => {
                const results = this.data[name] || [];
                return results.find(item => {
                    for (let key in query) {
                        if (item[key] !== query[key]) return false;
                    }
                    return true;
                });
            },
            insertOne: async (doc) => {
                if (!this.data[name]) this.data[name] = [];
                this.data[name].push(doc);
                await this.save();
                return { insertedId: doc.id || doc.callSid, ...doc }; // Mock return
            },
            updateOne: async (filter, update) => {
                if (!this.data[name]) return { matchedCount: 0 };
                // Find index to update in place
                const index = this.data[name].findIndex(i => {
                    for (let key in filter) {
                        if (i[key] !== filter[key]) return false;
                    }
                    return true;
                });

                if (index !== -1) {
                    const item = this.data[name][index];

                    if (update.$set) {
                        Object.assign(item, update.$set);
                    }

                    if (update.$push) {
                        for (let key in update.$push) {
                            if (!Array.isArray(item[key])) {
                                item[key] = [];
                            }
                            item[key].push(update.$push[key]);
                        }
                    }

                    this.data[name][index] = item;
                    await this.save();
                    return { matchedCount: 1 };
                }
                return { matchedCount: 0 };
            }
        };
    }
}

export const dbInstance = new LocalDB();
