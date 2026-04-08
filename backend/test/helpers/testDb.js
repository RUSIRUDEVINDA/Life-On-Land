import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod;


/** Call in beforeAll() */
export const connect = async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log('TEST DB CONNECTED TO:', mongoose.connection.host, mongoose.connection.name);
};

/** Call in afterEach() to wipe data between tests */
export const clearDatabase = async () => {  
    if (!mongod) {
        console.error("🚨 DANGER: MongoMemoryServer is not running. Wiping aborted.");
        return;
    }
    
    // An actual local database usually uses 27017. MongoMemoryServer uses a dynamic port.
    // Ensure the Mongoose connection port EXACTLY matches the dynamically allocated port of our Memory Server.
    const activePort = mongoose.connection.port;
    if (!activePort || !mongod.getUri().includes(`:${activePort}`)) {
        console.error(`🚨 DANGER: Active connection port (${activePort}) does not match test DB. Wiping aborted to protect actual database!`);
        return;
    }

    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
};

/** Call in afterAll() to shut everything down */
export const closeDatabase = async () => {
    if (mongod && mongoose.connection.port && mongod.getUri().includes(`:${mongoose.connection.port}`)) {
        await mongoose.connection.dropDatabase();
    }
    await mongoose.connection.close();
    if (mongod) await mongod.stop();
};
