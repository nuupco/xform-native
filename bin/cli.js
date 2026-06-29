#!/usr/bin/env node
const registry = require('../registry.json');
const command = process.argv[2];

if (command === 'list') {
  console.log('Available widgets:');
  Object.keys(registry.widgets).forEach(name => console.log(`  ${name}`));
} else if (command === 'add') {
  const widget = process.argv[3];
  if (!widget || !registry.widgets[widget]) {
    console.log('Usage: npx @nuup/xform-native add <WidgetName>');
    console.log('Run "npx @nuup/xform-native list" to see available widgets.');
  } else {
    const w = registry.widgets[widget];
    console.log(`To use ${widget}, copy the source:`);
    console.log(`  cp node_modules/@nuup/xform-native/${w.file} ./src/components/${widget}.tsx`);
    if (w.optionalDeps.length > 0) {
      console.log(`\nOptional peer dependencies required:`);
      w.optionalDeps.forEach(dep => console.log(`  ${dep}`));
    }
  }
} else {
  console.log('@nuup/xform-native CLI');
  console.log('  list          List available widgets');
  console.log('  add <name>    Show instructions to copy a widget');
}
