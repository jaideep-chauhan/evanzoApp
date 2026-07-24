const path = require('path');

// @react-native-community/datetimepicker (8.6.0) uses an AGP `namespace` with
// no `package=` in its AndroidManifest. @react-native-community/cli 15.0.1
// fails to auto-detect that and returns `android: null` for it, so autolinking
// silently drops it — the RNCDatePicker TurboModule never gets compiled in and
// the date picker crashes ("RNCDatePicker could not be found" /
// "Cannot read property 'validateAndroidProps' of undefined").
//
// Declare its Android autolink config explicitly so it's registered in
// PackageList.java + the New-Architecture codegen (RNDateTimePickerCGen). iOS
// autolinks fine on its own, so we only override android here.
const dtpRoot = path.resolve(
  __dirname,
  'node_modules/@react-native-community/datetimepicker',
);

module.exports = {
  dependencies: {
    '@react-native-community/datetimepicker': {
      root: dtpRoot,
      platforms: {
        android: {
          sourceDir: path.join(dtpRoot, 'android'),
          packageImportPath:
            'import com.reactcommunity.rndatetimepicker.RNDateTimePickerPackage;',
          packageInstance: 'new RNDateTimePickerPackage()',
          libraryName: 'RNDateTimePickerCGen',
          // The Fabric component is interfaceOnly, so codegen emits no concrete
          // ComponentDescriptor — keep this empty or the C++ autolinking fails
          // with "unknown type name 'RNDateTimePickerComponentDescriptor'".
          componentDescriptors: [],
          cmakeListsPath: path.join(
            dtpRoot,
            'android/build/generated/source/codegen/jni/CMakeLists.txt',
          ),
        },
      },
    },
  },
};
