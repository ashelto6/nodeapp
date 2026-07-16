import mongoose from 'mongoose';

function connectDB() {
    const {
        MONGO_HOST,
        MONGO_PORT,
        MONGO_DB,
        MONGO_APP_USERNAME,
        MONGO_APP_PASSWORD,
    } = process.env;

    // Least-privilege connection (issue #67): the app authenticates as a
    // readWrite-only user scoped to MONGO_DB, not the Mongo root superuser,
    // so authSource is the app DB itself rather than admin.
    if (!MONGO_APP_USERNAME || !MONGO_APP_PASSWORD) {
        throw new Error(
            'MONGO_APP_USERNAME and MONGO_APP_PASSWORD must be set (see .env.example)',
        );
    }

    const uri = `mongodb://${MONGO_APP_USERNAME}:${MONGO_APP_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}?authSource=${MONGO_DB}`;
    return mongoose.connect(uri);
}

export { connectDB };
