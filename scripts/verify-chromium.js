// This script verifies whether Chromium is properly installed
// It's used during the build process to catch issues early

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function verifyChromium() {
  try {
    console.log('🔍 Verifying Chromium installation...');
    console.log('Environment information:');
    console.log(`- Node.js version: ${process.version}`);
    console.log(`- Platform: ${process.platform}`);
    console.log(`- Architecture: ${process.arch}`);

    // Check if we're running on Vercel
    const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_VERSION;
    console.log(`- Running on Vercel: ${isVercel ? 'Yes' : 'No'}`);

    // Check Puppeteer cache directory
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    const cacheDirs = [
      path.join(process.cwd(), '.cache', 'puppeteer'),
      path.join(homeDir, '.cache', 'puppeteer'),
      '/vercel/.cache/puppeteer',
      '/tmp/puppeteer-chrome',
    ];

    console.log('Checking Puppeteer cache directories:');
    for (const cacheDir of cacheDirs) {
      try {
        if (fs.existsSync(cacheDir)) {
          console.log(`✅ Cache directory found: ${cacheDir}`);
          const files = fs.readdirSync(cacheDir);
          console.log(`   Contains: ${files.join(', ')}`);

          // Check specific browser directories
          const chromeDirs = files.filter(
            f => f.startsWith('chrome') || f.startsWith('chrome-headless')
          );
          if (chromeDirs.length > 0) {
            for (const chromeDir of chromeDirs) {
              const fullPath = path.join(cacheDir, chromeDir);
              const subFiles = fs.readdirSync(fullPath);
              console.log(`   ${chromeDir} contains: ${subFiles.join(', ')}`);
            }
          }
        } else {
          console.log(`❌ Cache directory not found: ${cacheDir}`);
        }
      } catch (err) {
        console.log(`❌ Error checking cache directory ${cacheDir}: ${err.message}`);
      }
    }

    // Try to import @sparticuz/chromium
    console.log('\nChecking @sparticuz/chromium package:');
    try {
      const chromium = require('@sparticuz/chromium');
      console.log('✅ @sparticuz/chromium package loaded successfully');

      // Check if the package provides necessary exports
      if (typeof chromium.executablePath === 'function') {
        console.log('✅ chromium.executablePath is a function');

        try {
          // Get the executable path
          const execPath = await chromium.executablePath();
          console.log(`Chromium executable path: ${execPath}`);

          // Check if the file exists
          if (fs.existsSync(execPath)) {
            console.log(`✅ Chromium executable verified at: ${execPath}`);
          } else {
            console.error(`❌ Chromium executable not found at: ${execPath}`);
            console.error('This will cause PDF generation to fail in production.');
          }
        } catch (execPathError) {
          console.error(`❌ Error getting executablePath: ${execPathError.message}`);
        }
      } else {
        console.error('❌ chromium.executablePath is not a function');
      }
    } catch (importError) {
      console.error(`❌ Error importing @sparticuz/chromium: ${importError.message}`);

      // Let's try puppeteer as a fallback
      try {
        console.log('\nTrying puppeteer as fallback:');
        const puppeteer = require('puppeteer');
        console.log('✅ puppeteer package loaded successfully');

        if (puppeteer.executablePath) {
          const puppeteerPath = puppeteer.executablePath();
          console.log(`Puppeteer executable path: ${puppeteerPath}`);

          if (fs.existsSync(puppeteerPath)) {
            console.log(`✅ Puppeteer executable verified at: ${puppeteerPath}`);
          } else {
            console.error(`❌ Puppeteer executable not found at: ${puppeteerPath}`);
          }
        }
      } catch (puppeteerError) {
        console.error(`❌ Error with puppeteer fallback: ${puppeteerError.message}`);
      }
    }

    console.log('\nChromium verification completed.');
  } catch (error) {
    console.error('❌ Error during verification:');
    console.error(error);
    console.error('This might cause PDF generation to fail in production.');
    // Not failing the build
    console.log('Continuing build process, but be aware of potential issues.');
  }
}

verifyChromium();
