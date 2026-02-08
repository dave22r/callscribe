import { MongoClient } from 'mongodb';

let db = null;
let client = null;

export const connectDB = async () => {
    try {
        const uri = process.env.VITE_MONGODB_URI;

        if (!uri) {
            console.warn('⚠️  MongoDB URI not provided. Running without database.');
            return null;
        }

        client = new MongoClient(uri);
        await client.connect();
        db = client.db('callscribe');

        console.log('✅ Connected to MongoDB');
        return db;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        console.warn('⚠️  Running without database connection');
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
        console.log('MongoDB connection closed');
    }
};
