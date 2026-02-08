import { dbInstance } from './localdb.js';

let db = null;

export const connectDB = async () => {
    try {
        await dbInstance.connect();
        db = dbInstance;
        console.log('✅ Connected to Local DB (db.json)');
        return db;
    } catch (error) {
        console.error('❌ Local DB connection error:', error.message);
        return null;
    }
};

export const getDB = () => {
    if (!db) {
        console.warn('⚠️  Database not connected. Some features may not work.');
    }
    return db;
};

export const closeDB = async () => {
    // No-op for local file DB
};
