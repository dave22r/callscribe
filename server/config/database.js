import { MongoClient } from 'mongodb';
import { dbInstance } from './localdb.js';

let db = null;
let client = null;

export const connectDB = async () => {
    try {
        if (process.env.MONGODB_URI) {
            console.log('🌐 Connecting to MongoDB Atlas...');
            client = new MongoClient(process.env.MONGODB_URI);
            await client.connect();
            db = client.db();
            console.log('✅ Connected to MongoDB Atlas');
            return db;
        } else {
            console.log('📂 Using Local File Database');
            await dbInstance.connect();
            db = dbInstance;
            console.log('✅ Connected to Local DB (db.json)');
            return db;
        }
    } catch (error) {
        console.error('❌ DB connection error:', error.message);
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
    if (client) {
        await client.close();
    }
};
