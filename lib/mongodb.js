import { MongoClient } from 'mongodb';

const MONGODB_URL = process.env.MONGODB_URL;
const DATABASE_NAME = process.env.DATABASE_NAME;

if (!MONGODB_URL) {
  throw new Error('Please define the MONGODB_URL environment variable inside .env.local');
}

if (!DATABASE_NAME) {
  throw new Error('Please define the DATABASE_NAME environment variable inside .env.local');
}

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URL, {});

  await client.connect();

  const db = client.db(DATABASE_NAME);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}
