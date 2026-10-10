/**
 * Unified Deployment Pipeline Script
 * Builds the Web App (Vite/React) and synchronizes Capacitor Android with Firebase configuration.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('===========================================================');
console.log('ST. CECILIA\'S COLLEGE ALUMNI PORTAL - DEPLOYMENT PIPELINE');
console.log('===========================================================');

// 1. Verify and read shared Firebase Configuration
const firebaseConfigPath = path.resolve(rootDir, 'firebase-applet-config.json');
if (!fs.existsSync(firebaseConfigPath)) {
  console.error('❌ Error: firebase-applet-config.json not found in root directory.');
  process.exit(1);
}

const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
console.log(`✓ Firebase Project: ${firebaseConfig.projectId}`);
console.log(`✓ Firestore DB:     ${firebaseConfig.firestoreDatabaseId}`);

// 2. Synchronize configuration into Capacitor Android google-services.json
const capacitorGoogleServicesPath = path.resolve(rootDir, 'android', 'app', 'google-services.json');
if (fs.existsSync(capacitorGoogleServicesPath)) {
  const capGoogleServices = JSON.parse(fs.readFileSync(capacitorGoogleServicesPath, 'utf8'));
  capGoogleServices.project_info.project_id = firebaseConfig.projectId;
  capGoogleServices.project_info.project_number = firebaseConfig.messagingSenderId;
  if (capGoogleServices.client && capGoogleServices.client[0] && capGoogleServices.client[0].api_key) {
    capGoogleServices.client[0].api_key[0].current_key = firebaseConfig.apiKey;
  }
  fs.writeFileSync(capacitorGoogleServicesPath, JSON.stringify(capGoogleServices, null, 2));
  console.log('✓ Synchronized Capacitor android google-services.json with root Firebase configuration.');
}

// 3. Build the React Web App
console.log('\n--- Building React Web Portal ---');
try {
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
  console.log('✓ React Web Portal built successfully to /dist');

  // Synchronize web assets to Capacitor Android public directory if present
  const capAndroidPublicDir = path.resolve(rootDir, 'android', 'app', 'src', 'main', 'assets', 'public');
  if (fs.existsSync(capAndroidPublicDir)) {
    execSync(`cp -rf ${path.resolve(rootDir, 'dist')}/* ${capAndroidPublicDir}/`);
    console.log('✓ Synchronized web assets into Capacitor Android public assets.');
  }
} catch (err) {
  console.error('❌ React build failed:', err.message);
  process.exit(1);
}

console.log('\n===========================================================');
console.log('DEPLOYMENT BUNDLE READY FOR FIREBASE HOSTING');
console.log('Deploy with: firebase deploy --only hosting');
console.log('===========================================================');

