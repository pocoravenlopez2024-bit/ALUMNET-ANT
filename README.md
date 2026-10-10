# St. Cecilia's College Alumni Network

Official Alumni Portal and Institutional Advancement System for St. Cecilia's College - Cebu, Inc.

## Default & Test Accounts

For testing, auditing, and development credentials across all institutional roles (`superadmin`, `admin`, `registrar`, `staff`, `moderator`, `employer`, and `alumni`), please refer to:

👉 **[`DEFAULT_ACCOUNTS.md`](./DEFAULT_ACCOUNTS.md)**

*Note: In accordance with cybersecurity guidelines, credentials and quick-login shortcuts are not rendered on the public login page.*

## Development & Running the App

### Prerequisites
- Node.js 18+ or 20+
- npm or bun

### 1. Run Development Server
```bash
# Install dependencies
npm install

# Start the full-stack dev server (port 3000)
npm run dev
```
Open your browser at `http://localhost:3000`.

### 2. Build and Run Production
```bash
# Build client and server bundles
npm run build

# Start the production server
npm start
```

---

## Building the Android Mobile App (APK)

This project is fully powered by **Capacitor 8**. The native Android source files are pre-configured in `./android`.

### Option A: Automatic Build via GitHub Actions (Zero Local Setup)
A workflow has been configured at `.github/workflows/build-apk.yml`.
1. Push your repository to GitHub.
2. Go to the **Actions** tab on your GitHub repository.
3. Once the **Build Android APK** workflow completes, download the generated `cecilian-alumnet-debug-apk` directly from GitHub Artifacts.

### Option B: Local CLI Build with Gradle
Ensure you have **Java JDK 17+** and **Android SDK** installed:
```bash
# 1. Build web distribution & sync with Capacitor
npm run cap:build

# 2. Compile APK using Gradle wrapper
cd android
./gradlew assembleDebug
# (Windows: gradlew.bat assembleDebug)
```
Your compiled APK will be at:
`android/app/build/outputs/apk/debug/app-debug.apk`

### Option C: Android Studio GUI (Recommended for visual debugging)
1. Run:
```bash
npm run cap:build
npx cap open android
```
*(or manually open the `android/` directory in Android Studio)*.
2. Wait for Gradle to finish indexing.
3. In Android Studio's top menu, select:
   **Build > Build Bundle(s) / APK(s) > Build APK(s)**
4. Once built, click **locate** in the popup to get your `.apk` file.

---

## Key Modules

- **Alumni Member Portal**: Personalized dashboard, digital alumni identification card, verified member directory, direct messaging, and reunions/events.
- **Registrar Workspace**: Student registry matching, graduation records verification, bulk CSV import, and conflict resolution.
- **Employer Network**: Corporate accreditation, job board listings, candidate application tracking, and talent acquisition.
- **Institutional Governance**: Multi-role access control (RBAC), emergency controls, audit log trails, and policy enforcement.
