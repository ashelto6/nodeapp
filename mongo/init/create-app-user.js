// Runs once, automatically, only when the mongo container initializes a
// *fresh* /data/db volume (see docker-entrypoint-initdb.d in the official
// mongo image docs). It never re-runs against an existing volume, so it
// intentionally does NOT cover an already-provisioned database -- see the
// prod migration note in DEPLOY.md (issue #67).
//
// Executes with the root user's auth context, so it can create another
// user. Scopes that new user to readWrite on MONGO_DB only (not
// dbAdmin/root), so the app can no longer be compromised into full
// instance-wide Mongo admin.
db = db.getSiblingDB(process.env.MONGO_DB);

db.createUser({
    user: process.env.MONGO_APP_USERNAME,
    pwd: process.env.MONGO_APP_PASSWORD,
    roles: [{ role: 'readWrite', db: process.env.MONGO_DB }],
});
