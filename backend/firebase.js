import admin from 'firebase-admin';
import fs from 'fs';

// Load service account JSON manually
const serviceAccount = JSON.parse(
  readFileSync('/etc/secrets/serviceAccountKey.json', 'utf8')
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

export { db };
