#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: 'x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

// Common package imports that might be missing
const commonPackageImports = [
  {
    file: 'src/app/layout.tsx',
    imports: [
      "import 'react-toastify/dist/ReactToastify.css';",
      "import 'rsuite-table/dist/css/rsuite-table.css';"
    ]
  },
  {
    file: 'src/app/globals.css',
    imports: [
      "@import './css/table.css';"
    ],
    position: 'top' // Import should be at the top before @tailwind
  },
  {
    file: 'src/components/CustomDateRangePicker.tsx',
    imports: [
      "import 'flatpickr/dist/themes/light.css';"
    ]
  },
  {
    file: 'src/components/WhatsAppShareButton.tsx',
    imports: [
      "import './WhatsAppShareButton.css';"
    ]
  }
];

// Function to check if import exists in file
function hasImport(filePath, importStatement) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes(importStatement);
  } catch (error) {
    return false;
  }
}

// Function to add missing imports
function addMissingImport(filePath, importStatement, position = 'after') {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (position === 'top') {
      // Add at the very beginning of the file
      const newContent = importStatement + '\n' + content;
      fs.writeFileSync(filePath, newContent, 'utf8');
      return true;
    }
    
    // Find the position after the last import statement
    const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"][^'"]+['"];?/g;
    const imports = [];
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[0]);
    }
    
    if (imports.length > 0) {
      // Find the last import line
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const endOfLastImport = content.indexOf(';', lastImportIndex) + 1;
      
      // Insert the new import after the last one
      const newContent = 
        content.slice(0, endOfLastImport) + 
        '\n' + 
        importStatement + 
        content.slice(endOfLastImport);
      
      fs.writeFileSync(filePath, newContent, 'utf8');
      return true;
    } else {
      // No imports found, add at the beginning
      const newContent = importStatement + '\n' + content;
      fs.writeFileSync(filePath, newContent, 'utf8');
      return true;
    }
  } catch (error) {
    log(`❌ Error updating ${filePath}: ${error.message}`, colors.red);
    return false;
  }
}

// Function to check for missing dependencies
function checkDependencies() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const requiredPackages = [
      'react',
      'react-dom',
      'next',
      'react-toastify',
      'rsuite-table',
      'react-flatpickr',
      'flatpickr',
      'react-icons/fa',
      'react-icons/fi',
      'react-icons/pi',
      'react-icons/io',
      'react-icons/io5',
      'lucide-react',
      '@headlessui/react',
      '@tanstack/react-table',
      '@tanstack/react-virtual',
      'tailwindcss',
      'autoprefixer',
      'postcss'
    ];
    
    const missingPackages = requiredPackages.filter(pkg => !dependencies[pkg]);
    
    if (missingPackages.length > 0) {
      log('📦 Missing dependencies:', colors.yellow);
      missingPackages.forEach(pkg => {
        log(`   - ${pkg}`, colors.red);
      });
      log('\n💡 Run: npm install ' + missingPackages.join(' '), colors.blue);
    } else {
      log('✅ All required dependencies are installed', colors.green);
    }
    
    return missingPackages.length === 0;
  } catch (error) {
    log(`❌ Error checking dependencies: ${error.message}`, colors.red);
    return false;
  }
}

// Function to check if Tailwind CSS is properly configured
function checkTailwindConfig() {
  const tailwindConfigPath = path.join(__dirname, '..', 'tailwind.config.ts');
  
  try {
    const tailwindConfig = fs.readFileSync(tailwindConfigPath, 'utf8');
    
    const hasCorrectContent = tailwindConfig.includes('content:') && 
      tailwindConfig.includes('./src/**/*.{js,ts,jsx,tsx,mdx}');
    
    if (hasCorrectContent) {
      log('✅ Tailwind CSS configuration looks correct', colors.green);
      return true;
    } else {
      log('⚠️  Tailwind CSS configuration may need attention', colors.yellow);
      log('   Ensure content paths include src/**/*.{js,ts,jsx,tsx,mdx}', colors.blue);
      return false;
    }
  } catch (error) {
    log(`❌ Error checking Tailwind config: ${error.message}`, colors.red);
    return false;
  }
}

// Function to check if PostCSS is properly configured
function checkPostCSSConfig() {
  const postcssConfigPath = path.join(__dirname, '..', 'postcss.config.js');
  
  try {
    const postcssConfig = fs.readFileSync(postcssConfigPath, 'utf8');
    
    const hasTailwindPlugin = postcssConfig.includes('tailwindcss') && 
      postcssConfig.includes('autoprefixer');
    
    if (hasTailwindPlugin) {
      log('✅ PostCSS configuration looks correct', colors.green);
      return true;
    } else {
      log('⚠️  PostCSS configuration may need attention', colors.yellow);
      log('   Ensure tailwindcss and autoprefixer plugins are included', colors.blue);
      return false;
    }
  } catch (error) {
    log(`❌ Error checking PostCSS config: ${error.message}`, colors.red);
    return false;
  }
}

// Main function
function main() {
  log('🔍 Checking for missing CSS imports and dependencies...', colors.cyan);
  
  let allGood = true;
  
  // Check dependencies
  if (!checkDependencies()) {
    allGood = false;
  }
  
  // Check Tailwind config
  if (!checkTailwindConfig()) {
    allGood = false;
  }
  
  // Check PostCSS config
  if (!checkPostCSSConfig()) {
    allGood = false;
  }
  
  // Check for missing CSS imports
  log('\n📝 Checking CSS imports...', colors.cyan);
  
  let totalRestored = 0;
  let filesModified = 0;
  
  commonPackageImports.forEach(({ file, imports, position = 'after' }) => {
    const filePath = path.join(__dirname, '..', file);
    
    if (!fs.existsSync(filePath)) {
      log(`⚠️  File not found: ${filePath}`, colors.yellow);
      return;
    }
    
    imports.forEach(importStatement => {
      if (!hasImport(filePath, importStatement)) {
        log(`📝 Adding to ${file}: ${importStatement}`, colors.blue);
        if (addMissingImport(filePath, importStatement, position)) {
          totalRestored++;
          filesModified++;
        }
      } else {
        log(`✅ Already exists in ${file}: ${importStatement}`, colors.green);
      }
    });
  });
  
  log('\n📊 Summary:', colors.cyan);
  log(`   Files checked: ${commonPackageImports.length}`, colors.blue);
  log(`   Files modified: ${filesModified}`, colors.yellow);
  log(`   Imports restored: ${totalRestored}`, colors.green);
  log(`   Dependencies: ${checkDependencies() ? '✅ OK' : '❌ Missing'}`, colors[checkDependencies() ? 'green' : 'red']);
  log(`   Tailwind Config: ${checkTailwindConfig() ? '✅ OK' : '⚠️ Check needed'}`, colors[checkTailwindConfig() ? 'green' : 'yellow']);
  log(`   PostCSS Config: ${checkPostCSSConfig() ? '✅ OK' : '⚠️ Check needed'}`, colors[checkPostCSSConfig() ? 'green' : 'yellow']);
  
  if (allGood && totalRestored === 0) {
    log('\n🎉 All CSS imports and dependencies are properly configured!', colors.green);
    log('💡 Your app styling should be working correctly', colors.blue);
  } else if (totalRestored > 0) {
    log('\n🎉 Successfully restored missing CSS imports!', colors.green);
    log('💡 Your app styling should now be working correctly', colors.blue);
  } else {
    log('\n⚠️  Some issues were found. Please address them above.', colors.yellow);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { addMissingImport, hasImport, commonPackageImports, checkDependencies, checkTailwindConfig, checkPostCSSConfig };
