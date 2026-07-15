import mongoose from 'mongoose';

function connectDB() {
    const {
        MONGO_HOST,
        MONGO_PORT,
        MONGO_DB,
        MONGO_INITDB_ROOT_USERNAME,
        MONGO_INITDB_ROOT_PASSWORD,
    } = process.env;
    const uri = `mongodb://${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;
    return mongoose.connect(uri);
}

export { connectDB };
