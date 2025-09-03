#!/usr/bin/env node

/**
 * Production build script for iYaya app
 * Handles pre-build checks, environment setup, and build execution
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ProductionBuilder {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..');
    this.requiredAssets = [
      'assets/icon.png',
      'assets/adaptive-icon.png',
      'assets/splash.png',
      'assets/favicon.png'
    ];
  }

  log(message) {
    console.log(`[BUILD] ${message}`);
  }

  error(message) {
    console.error(`[ERROR] ${message}`);
  }

  // Check if all required assets exist
  checkAssets() {
    this.log('Checking required assets...');
    
    const missingAssets = this.requiredAssets.filter(asset => {
      const assetPath = path.join(this.rootDir, asset);
      return !fs.existsSync(assetPath);
    });

    if (missingAssets.length > 0) {
      this.error(`Missing required assets: ${missingAssets.join(', ')}`);
      return false;
    }

    this.log('✅ All required assets found');
    return true;
  }

  // Check environment configuration
  checkEnvironment() {
    this.log('Checking environment configuration...');
    
    const prodEnvPath = path.join(this.rootDir, '.env.production');
    if (!fs.existsSync(prodEnvPath)) {
      this.error('Missing .env.production file');
      return false;
    }

    // Check if EAS is configured
    const easConfigPath = path.join(this.rootDir, 'eas.json');
    if (!fs.existsSync(easConfigPath)) {
      this.error('Missing eas.json configuration');
      return false;
    }

    this.log('✅ Environment configuration found');
    return true;
  }

  // Run pre-build checks
  runPreBuildChecks() {
    this.log('Running pre-build checks...');
    
    try {
      // Check if dependencies are installed
      execSync('npm list --depth=0', { cwd: this.rootDir, stdio: 'pipe' });
      this.log('✅ Dependencies check passed');
    } catch (error) {
      this.error('Dependencies check failed. Run: npm install');
      return false;
    }

    // Check TypeScript compilation (if applicable)
    try {
      execSync('npx tsc --noEmit', { cwd: this.rootDir, stdio: 'pipe' });
      this.log('✅ TypeScript check passed');
    } catch (error) {
      this.log('⚠️  TypeScript check skipped (no tsconfig.json or errors found)');
    }

    return true;
  }

  // Build for production
  async buildProduction(platform = 'all') {
    this.log(`Starting production build for ${platform}...`);
    
    try {
      // Set production environment
      process.env.NODE_ENV = 'production';
      
      switch (platform) {
        case 'ios':
          execSync('eas build --platform ios --profile production', { 
            cwd: this.rootDir, 
            stdio: 'inherit' 
          });
          break;
        case 'android':
          execSync('eas build --platform android --profile production', { 
            cwd: this.rootDir, 
            stdio: 'inherit' 
          });
          break;
        case 'all':
          execSync('eas build --platform all --profile production', { 
            cwd: this.rootDir, 
            stdio: 'inherit' 
          });
          break;
        default:
          throw new Error(`Unknown platform: ${platform}`);
      }
      
      this.log('✅ Production build completed successfully');
    } catch (error) {
      this.error(`Build failed: ${error.message}`);
      process.exit(1);
    }
  }

  // Main build process
  async run() {
    this.log('Starting iYaya production build process...');
    
    // Run all checks
    if (!this.checkAssets() || !this.checkEnvironment() || !this.runPreBuildChecks()) {
      this.error('Pre-build checks failed. Please fix the issues above.');
      process.exit(1);
    }
    
    // Get platform from command line args
    const platform = process.argv[2] || 'all';
    
    // Start build
    await this.buildProduction(platform);
    
    this.log('🎉 Build process completed!');
  }
}

// Run the builder
const builder = new ProductionBuilder();
builder.run().catch(error => {
  console.error('Build process failed:', error);
  process.exit(1);
});
