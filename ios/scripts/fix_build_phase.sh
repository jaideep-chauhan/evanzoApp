#!/bin/bash

# This script is run as an Xcode build phase to fix the RCTThirdPartyComponentsProvider issue

echo "[Build Phase] Checking and fixing RCTThirdPartyComponentsProvider..."

# Path to the generated file
PROVIDER_FILE="${PODS_ROOT}/../build/generated/ios/RCTThirdPartyComponentsProvider.mm"

# Check if file exists
if [ -f "$PROVIDER_FILE" ]; then
    echo "[Build Phase] Found RCTThirdPartyComponentsProvider.mm at $PROVIDER_FILE"
    
    # Run the Ruby script to fix it
    ruby "${SRCROOT}/scripts/fix_third_party_provider.rb"
    
    # Alternative: Run the Node.js script
    # node "${SRCROOT}/../scripts/fix-third-party-components.js"
else
    echo "[Build Phase] RCTThirdPartyComponentsProvider.mm not found yet"
fi

echo "[Build Phase] Fix script completed"