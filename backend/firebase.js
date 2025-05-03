import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';

const path = existsSync('/etc/secrets/serviceAccountKey.json')
  ? '/etc/secrets/serviceAccountKey.json'
  : new URL('./serviceAccountKey.json', import.meta.url).pathname;

const serviceAccount = JSON.parse(readFileSync(path, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
