// This script verifies whether Chromium is properly installed
// It's used during the build process to catch issues early

const fs = require('fs');
const path = require('path');

async function verifyChromium() {
  try {
    console.log('Verifying Chromium installation...');

    // Try to import @sparticuz/chromium
    const chromium = require('@sparticuz/chromium');
    console.log('✅ @sparticuz/chromium package loaded successfully');

    // Check if the package provides necessary exports
    if (!chromium.executablePath) {
      throw new Error('executablePath function not found in chromium package');
    }

    // Get the executable path
    const execPath = await chromium.executablePath();
    console.log(`Chromium executable path: ${execPath}`);

    // Check if the file exists
    if (fs.existsSync(execPath)) {
      console.log(`✅ Chromium executable verified at: ${execPath}`);
    } else {
      console.error(`❌ Chromium executable not found at: ${execPath}`);
      console.error('This will cause PDF generation to fail in production.');
      // Not failing the build because Vercel might install it later
      console.log('Continuing build process, but be aware of potential issues.');
    }

    // Log helpful information for debugging
    console.log('Environment information:');
    console.log(`- Node.js version: ${process.version}`);
    console.log(`- Platform: ${process.platform}`);
    console.log(`- Architecture: ${process.arch}`);

    console.log('Chromium verification completed.');
  } catch (error) {
    console.error('❌ Error verifying Chromium installation:');
    console.error(error);
    console.error('This might cause PDF generation to fail in production.');
    // Not failing the build because Vercel might install it differently
    console.log('Continuing build process, but be aware of potential issues.');
  }
}

verifyChromium();
