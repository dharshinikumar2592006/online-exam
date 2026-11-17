const mongoose = require('mongoose');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let spawnedMongoProcess = null;

/**
 * Start a local mongod child process if not already running
 */
const startLocalMongod = async (dbPath) => {
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    console.log(`[MongoDB] Starting local mongod process at dbPath: ${dbPath}...`);
    try {
      const proc = spawn('mongod', ['--dbpath', dbPath, '--port', '27017', '--quiet'], {
        detached: false,
        stdio: 'ignore'
      });

      proc.on('error', (err) => {
        console.warn(`[MongoDB] Failed to spawn mongod process: ${err.message}`);
        reject(err);
      });

      // Give it 1.5 seconds to bind to port 27017
      setTimeout(() => {
        spawnedMongoProcess = proc;
        resolve(proc);
      }, 1500);
    } catch (e) {
      reject(e);
    }
  });
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/online_exam';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`[MongoDB] Connected to database: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.warn(`[MongoDB] Initial connection to ${uri} failed (${err.message}). Attempting to auto-start local mongod...`);

    const localDbPath = path.join(__dirname, '..', 'data', 'db');
    try {
      await startLocalMongod(localDbPath);
      // Retry connection
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000
      });
      console.log(`[MongoDB] Successfully connected after starting mongod: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (startErr) {
      console.error('[MongoDB] Unable to connect or auto-start MongoDB.');
      console.error('[MongoDB] Please ensure MongoDB service is running (mongod --port 27017).');
      throw err;
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (spawnedMongoProcess) {
    try {
      spawnedMongoProcess.kill();
    } catch (e) {
      // ignore
    }
  }
};

module.exports = { connectDB, disconnectDB };
