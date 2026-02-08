import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const cleanup = async () => {
    if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI not found in .env');
        process.exit(1);
    }

    console.log('🌐 Connecting to MongoDB...');
    const client = new MongoClient(process.env.MONGODB_URI);

    try {
        await client.connect();
        const db = client.db();
        console.log('✅ Connected');

        const collection = db.collection('calls');

        // Names to remove
        const namesToRemove = ['Unknown', 'Live Caller', 'New Caller', 'Unknown Patient'];

        // Count before
        const countBefore = await collection.countDocuments({ callerName: { $in: namesToRemove } });
        console.log(`🧐 Found ${countBefore} calls to remove.`);

        if (countBefore > 0) {
            const result = await collection.deleteMany({ callerName: { $in: namesToRemove } });
            console.log(`🗑️  Deleted ${result.deletedCount} calls.`);
        } else {
            console.log('✨ No calls to clean up.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        console.log('👋 Connection closed');
        process.exit(0);
    }
};

cleanup();
