// scripts/audit-mongo-indexes.js
const { MongoClient } = require('mongodb');

async function checkIndexes() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/slotly?replicaSet=rs0&directConnection=true';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db('slotly');
    const collections = await db.listCollections().toArray();
    console.log(`Collections found: ${collections.length}`);

    const indexReport = {};
    for (const colInfo of collections) {
      const col = db.collection(colInfo.name);
      const indexes = await col.indexes();
      indexReport[colInfo.name] = indexes.map(idx => ({
        name: idx.name,
        key: idx.key,
        unique: !!idx.unique,
        partialFilterExpression: idx.partialFilterExpression
      }));
    }
    console.log(JSON.stringify(indexReport, null, 2));
  } catch (err) {
    console.error('Mongo index check failed:', err);
  } finally {
    await client.close();
  }
}

checkIndexes();
