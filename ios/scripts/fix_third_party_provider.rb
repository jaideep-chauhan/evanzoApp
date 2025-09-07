#!/usr/bin/env ruby

# This script fixes the RCTThirdPartyComponentsProvider.mm file to handle nil values
# properly when NSClassFromString returns nil for missing classes.

def fix_third_party_components_provider
  provider_path = File.join(__dir__, '..', 'build', 'generated', 'ios', 'RCTThirdPartyComponentsProvider.mm')
  
  # Check if file exists
  unless File.exist?(provider_path)
    puts "[Fix] RCTThirdPartyComponentsProvider.mm not found at expected path, will be generated later"
    return
  end
  
  content = File.read(provider_path)
  
  # Check if the file uses dictionary literal syntax that causes crashes
  if content.include?('return @{') && content.include?('NSClassFromString')
    puts "[Fix] Fixing RCTThirdPartyComponentsProvider.mm to handle nil values..."
    
    # Extract the dictionary entries
    dict_match = content.match(/return @\{([^}]+)\}/m)
    if dict_match
      entries = dict_match[1].split("\n")
        .select { |line| line.include?('NSClassFromString') }
        .map do |line|
          if match = line.match(/@"([^"]+)":\s*NSClassFromString\(@"([^"]+)"\)/)
            comment = line.split('//')[1]&.strip || ''
            {
              key: match[1],
              class_name: match[2],
              comment: comment
            }
          end
        end
        .compact
      
      # Generate the new implementation
      new_implementation = <<-OBJC
+ (NSDictionary<NSString *, Class<RCTComponentViewProtocol>> *)thirdPartyFabricComponents
{
  NSMutableDictionary *components = [NSMutableDictionary new];
  
  Class clazz;
  
OBJC
      
      entries.each do |entry|
        comment_str = entry[:comment].empty? ? '' : " // #{entry[:comment]}"
        new_implementation += "  clazz = NSClassFromString(@\"#{entry[:class_name]}\");#{comment_str}\n"
        new_implementation += "  if (clazz) components[@\"#{entry[:key]}\"] = clazz;\n  \n"
      end
      
      new_implementation += <<-OBJC
  return components;
}
OBJC
      
      # Replace the old implementation
      content.gsub!(/\+\s*\(NSDictionary[^}]+\}/m, new_implementation.chomp)
      
      # Write the fixed content back
      File.write(provider_path, content)
      puts "[Fix] Successfully fixed RCTThirdPartyComponentsProvider.mm"
    else
      puts "[Fix] Could not parse dictionary entries, skipping fix"
    end
  else
    puts "[Fix] RCTThirdPartyComponentsProvider.mm already fixed or using safe implementation"
  end
end

# Run the fix if this script is executed directly
if __FILE__ == $0
  fix_third_party_components_provider()
end