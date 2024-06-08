const { MongoClient } = require('mongodb');

const url = "mongodb+srv://i4rqm:i4rqm@cluster0.4rwfo5k.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const dbName = 'myDatabase'; 

async function connectToDatabase() {
    const client = new MongoClient(url);
    await client.connect();
    return client.db(dbName);
}

async function incrementVisitorCount() {
    const db = await connectToDatabase();
    const result = await db.collection('visitors').findOneAndUpdate(
        { id: 1 },
        { $inc: { count: 1 } },
        { returnDocument: 'after', upsert: true }
    );
    if (result.value && result.value.count) {
        return result.value.count;
    } else {
        const newVisitor = await db.collection('visitors').findOne({ id: 1 });
        return newVisitor ? newVisitor.count : 0;
    }
}

async function getVisitorCount() {
    const db = await connectToDatabase();
    const visitor = await db.collection('visitors').findOne({ id: 1 });
    return visitor ? visitor.count : 0;
}

async function getMessages(repliedOnly = false) {
    const db = await connectToDatabase();
    const query = repliedOnly ? { reply: { $exists: true } } : {};
    const messages = await db.collection('messages').find(query).toArray();
    return messages;
}

async function addMessage(content) {
    const db = await connectToDatabase();
    const id = Math.floor(Math.random() * 9000000000) + 1000000000;
    await db.collection('messages').insertOne({ id, content });
}

async function getMessageById(id) {
    const db = await connectToDatabase();
    const message = await db.collection('messages').findOne({ id: parseInt(id) });
    return message;
}

async function updateMessageReply(id, reply) {
    const db = await connectToDatabase();
    await db.collection('messages').updateOne({ id: parseInt(id) }, { $set: { reply } });
}

async function deleteMessage(id) {
    const db = await connectToDatabase();
    await db.collection('messages').deleteOne({ id: parseInt(id) });
}

module.exports = {
    incrementVisitorCount,
    getVisitorCount,
    getMessages,
    addMessage,
    getMessageById,
    updateMessageReply,
    deleteMessage
};
