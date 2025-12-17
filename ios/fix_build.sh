#!/bin/bash

echo "Fixing iOS Build Issues for EVNZO..."

# Clean everything
echo "Step 1: Cleaning build artifacts..."
rm -rf ~/Library/Developer/Xcode/DerivedData/EVNZO-*
rm -rf build

# Build directly via xcodebuild
echo "Step 2: Building for iPhone 16 Pro Max..."
xcodebuild -workspace EVNZO.xcworkspace \
  -scheme EVNZO \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 16 Pro Max' \
  clean build

echo "Build complete!"