#!/bin/bash

echo "Building iOS app for iPhone 16 Pro Max..."

# Navigate to iOS directory
cd ios

# Clean everything
echo "Step 1: Cleaning build artifacts..."
rm -rf ~/Library/Developer/Xcode/DerivedData/EVNZO-*
rm -rf build

echo "Step 2: Installing pods..."
pod install

echo "Step 3: Opening in Xcode..."
open EVNZO.xcworkspace

echo ""
echo "========================================="
echo "Build setup complete!"
echo "========================================="
echo ""
echo "In Xcode that just opened:"
echo "1. Wait for indexing to complete"
echo "2. Select 'EVNZO' scheme at the top"
echo "3. Select 'iPhone 16 Pro Max' simulator"
echo "4. Press Cmd+Shift+K to clean"
echo "5. Press Cmd+B to build"
echo "6. Press Cmd+R to run"
echo ""
echo "The app should build and launch successfully!"