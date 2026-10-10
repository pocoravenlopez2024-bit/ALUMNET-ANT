#!/usr/bin/env bash
# ==============================================================================
# Cecilian Alumnet - Dedicated Capacitor Android Release Build Pipeline
# Generates native Android package via Capacitor & Gradle
# ==============================================================================

set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ANDROID_DIR="$ROOT_DIR/android"

echo -e "\n${BOLD}${CYAN}====================================================================${NC}"
echo -e "${BOLD}${CYAN}  CECILIAN ALUMNET - CAPACITOR ANDROID BUILD PIPELINE              ${NC}"
echo -e "${BOLD}${CYAN}====================================================================${NC}\n"

# Step 1: Ensure google-services.json is verified
GSERVICES="$ANDROID_DIR/app/google-services.json"
if [ ! -f "$GSERVICES" ]; then
    echo -e "${RED}❌ Error: google-services.json not found at $GSERVICES${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Verified google-services.json at:${NC} android/app/google-services.json"

# Step 2: Build Web Assets & Sync Capacitor
echo -e "\n${CYAN}Building Web Assets & Syncing Capacitor...${NC}"
cd "$ROOT_DIR"
npm run build
npx cap sync android

# Step 3: Build Android APK via Gradle
cd "$ANDROID_DIR"
if [ -f "./gradlew" ]; then
    echo -e "\n${CYAN}Building Android Package via Gradle...${NC}"
    chmod +x ./gradlew
    ./gradlew assembleDebug
    echo -e "\n${BOLD}${GREEN}✓ Android Package built successfully in android/app/build/outputs/apk/${NC}"
else
    echo -e "${YELLOW}ℹ️ Gradle wrapper not executable in this container. Run npx cap open android on your local workstation.${NC}"
fi

echo -e "\n${BOLD}${GREEN}====================================================================${NC}"
echo -e "${BOLD}${GREEN}  CAPACITOR ANDROID ASSETS SYNCHRONIZED SUCCESSFULLY!                ${NC}"
echo -e "${BOLD}${GREEN}====================================================================${NC}\n"

