// backend/firebase.js
import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';

// Determine path: Render secret or local file
const keyPath = existsSync('/etc/secrets/serviceAccountKey.json')
  ? '/etc/secrets/serviceAccountKey.json'
  : new URL('./serviceAccountKey.json', import.meta.url).pathname;

// Read and parse the service account JSON
const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));

// Initialize the Admin SDK only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Get Firestore instance
const db = admin.firestore();

// Export both admin and db
export { admin, db };