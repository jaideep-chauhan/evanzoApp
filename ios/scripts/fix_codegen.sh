#!/bin/bash

# Comprehensive script to fix React Native codegen issues

echo "[Codegen Fix] Starting codegen fixes..."

# Fix 1: RCTThirdPartyComponentsProvider nil crash
FIX_THIRD_PARTY() {
    local FILE_PATH="$1"
    
    if [ -f "$FILE_PATH" ]; then
        echo "[Codegen Fix] Processing $FILE_PATH"
        
        # Check if file contains the problematic pattern
        if grep -q "return @{" "$FILE_PATH" && grep -q "NSClassFromString" "$FILE_PATH"; then
            echo "[Codegen Fix] Applying nil-safe fix to RCTThirdPartyComponentsProvider.mm"
            
            # Create a temporary file with the fix
            cat > /tmp/fix_third_party.rb << 'EOF'
#!/usr/bin/env ruby
content = File.read(ARGV[0])
if content.include?('return @{') && content.include?('NSClassFromString')
  dict_match = content.match(/return @\{([^}]+)\}/m)
  if dict_match
    entries = dict_match[1].split("\n")
      .select { |line| line.include?('NSClassFromString') }
      .map do |line|
        if match = line.match(/@"([^"]+)":\s*NSClassFromString\(@"([^"]+)"\)/)
          comment = line.split('//')[1]&.strip || ''
          { key: match[1], class_name: match[2], comment: comment }
        end
      end
      .compact
    
    new_impl = "+ (NSDictionary<NSString *, Class<RCTComponentViewProtocol>> *)thirdPartyFabricComponents\n{\n"
    new_impl += "  NSMutableDictionary *components = [NSMutableDictionary new];\n  \n"
    new_impl += "  Class clazz;\n  \n"
    
    entries.each do |entry|
      comment_str = entry[:comment].empty? ? '' : " // #{entry[:comment]}"
      new_impl += "  clazz = NSClassFromString(@\"#{entry[:class_name]}\");#{comment_str}\n"
      new_impl += "  if (clazz) components[@\"#{entry[:key]}\"] = clazz;\n  \n"
    end
    
    new_impl += "  return components;\n}"
    
    content.gsub!(/\+\s*\(NSDictionary[^}]+\}/m, new_impl)
    File.write(ARGV[0], content)
    puts "[Fixed] RCTThirdPartyComponentsProvider.mm"
  end
end
EOF
            
            ruby /tmp/fix_third_party.rb "$FILE_PATH"
            rm -f /tmp/fix_third_party.rb
        else
            echo "[Codegen Fix] File already fixed or using safe implementation"
        fi
    fi
}

# Check multiple possible locations for the file
POSSIBLE_PATHS=(
    "${PODS_ROOT}/../build/generated/ios/RCTThirdPartyComponentsProvider.mm"
    "${SRCROOT}/build/generated/ios/RCTThirdPartyComponentsProvider.mm"
    "${SRCROOT}/../ios/build/generated/ios/RCTThirdPartyComponentsProvider.mm"
    "${CONFIGURATION_BUILD_DIR}/generated/RCTThirdPartyComponentsProvider.mm"
)

for PATH in "${POSSIBLE_PATHS[@]}"; do
    FIX_THIRD_PARTY "$PATH"
done

echo "[Codegen Fix] Completed all fixes"