const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'node_modules', 'expo-modules-core', 'src', 'registerWebModule.ts');

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');
  if (content.includes("throw new Error('Module implementation must be a class')")) {
    console.log('[patch-expo] Patching registerWebModule.ts...');
    content = content.replace(
      "const moduleName = moduleImplementation.name;",
      "const moduleName = (arguments[1] || moduleImplementation.name || moduleImplementation.displayName || 'ExpoWebModule');"
    );
    content = content.replace(
      "if (!moduleName) {\n    throw new Error('Module implementation must be a class');\n  }",
      "// patched for web minification\n  if (!moduleName) { moduleName = 'ExpoWebModule'; }"
    );
    content = content.replace(
      "if (!moduleName) {",
      "if (false) {"
    );
    content = content.replace(
      "globalThis.expo.modules[moduleName] = new moduleImplementation();",
      "try { globalThis.expo.modules[moduleName] = new (moduleImplementation as any)(); } catch { try { globalThis.expo.modules[moduleName] = (moduleImplementation as any)(); } catch { globalThis.expo.modules[moduleName] = moduleImplementation; } }"
    );
    fs.writeFileSync(targetFile, content);
    console.log('[patch-expo] Successfully patched registerWebModule.ts');
  } else {
    console.log('[patch-expo] registerWebModule.ts already patched or different version');
  }
} else {
  console.log('[patch-expo] targetFile not found:', targetFile);
}
