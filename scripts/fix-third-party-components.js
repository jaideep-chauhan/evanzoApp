#!/usr/bin/env node

/**
 * This script fixes the RCTThirdPartyComponentsProvider.mm file to handle nil values
 * properly when NSClassFromString returns nil for missing classes.
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../ios/build/generated/ios/RCTThirdPartyComponentsProvider.mm');

function fixThirdPartyComponentsProvider() {
  if (!fs.existsSync(filePath)) {
    console.log('RCTThirdPartyComponentsProvider.mm not found, skipping fix');
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if the file uses the dictionary literal syntax that causes crashes
  if (content.includes('return @{') && content.includes('NSClassFromString')) {
    console.log('Fixing RCTThirdPartyComponentsProvider.mm to handle nil values...');
    
    // Extract the dictionary entries
    const dictMatch = content.match(/return @\{([^}]+)\}/s);
    if (dictMatch) {
      const entries = dictMatch[1]
        .split('\n')
        .filter(line => line.includes('NSClassFromString'))
        .map(line => {
          const match = line.match(/@"([^"]+)":\s*NSClassFromString\(@"([^"]+)"\)/);
          if (match) {
            return {
              key: match[1],
              className: match[2],
              comment: line.split('//')[1]?.trim() || ''
            };
          }
          return null;
        })
        .filter(Boolean);
      
      // Generate the new implementation
      const newImplementation = `+ (NSDictionary<NSString *, Class<RCTComponentViewProtocol>> *)thirdPartyFabricComponents
{
  NSMutableDictionary *components = [NSMutableDictionary new];
  
  Class clazz;
  
${entries.map(entry => {
  const comment = entry.comment ? ` // ${entry.comment}` : '';
  return `  clazz = NSClassFromString(@"${entry.className}");${comment}
  if (clazz) components[@"${entry.key}"] = clazz;`;
}).join('\n  \n')}
  
  return components;
}`;
      
      // Replace the old implementation
      content = content.replace(
        /\+\s*\(NSDictionary[^}]+\}/s,
        newImplementation
      );
      
      fs.writeFileSync(filePath, content);
      console.log('Successfully fixed RCTThirdPartyComponentsProvider.mm');
    }
  } else {
    console.log('RCTThirdPartyComponentsProvider.mm already fixed or using safe implementation');
  }
}

// Run the fix
fixThirdPartyComponentsProvider();