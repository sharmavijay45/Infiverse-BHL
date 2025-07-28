/**
 * Migration Script: Move Local Screenshots to Cloudinary
 * 
 * This script migrates existing local violation screenshots to Cloudinary
 * and updates the database records accordingly.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const ScreenCapture = require('../models/ScreenCapture');
const { uploadViolationScreenshot, uploadRegularScreenshot } = require('../utils/cloudinary');

class ScreenshotMigrationService {
  constructor() {
    this.migratedCount = 0;
    this.errorCount = 0;
    this.skippedCount = 0;
    this.batchSize = 10; // Process in batches to avoid overwhelming Cloudinary
  }

  async connectToDatabase() {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      process.exit(1);
    }
  }

  async migrateScreenshots(options = {}) {
    const {
      dryRun = false,
      violationsOnly = true,
      maxRecords = 1000,
      deleteLocalAfterUpload = false
    } = options;

    console.log('🚀 Starting screenshot migration to Cloudinary...');
    console.log(`📊 Options: dryRun=${dryRun}, violationsOnly=${violationsOnly}, maxRecords=${maxRecords}`);

    try {
      // Build query for screenshots to migrate
      let query = {
        'metadata.cloudinary_url': { $exists: false }, // Not already migrated
        file_path: { $exists: true, $ne: null } // Has local file path
      };

      if (violationsOnly) {
        query['metadata.intelligent_capture'] = true;
        query.is_flagged = true;
      }

      // Get screenshots that need migration
      const screenshots = await ScreenCapture.find(query)
        .sort({ timestamp: -1 })
        .limit(maxRecords);

      console.log(`📸 Found ${screenshots.length} screenshots to migrate`);

      if (screenshots.length === 0) {
        console.log('✅ No screenshots need migration');
        return;
      }

      // Process in batches
      for (let i = 0; i < screenshots.length; i += this.batchSize) {
        const batch = screenshots.slice(i, i + this.batchSize);
        console.log(`\n📦 Processing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(screenshots.length / this.batchSize)}`);

        await this.processBatch(batch, { dryRun, deleteLocalAfterUpload });

        // Add delay between batches to respect rate limits
        if (i + this.batchSize < screenshots.length) {
          console.log('⏳ Waiting 2 seconds before next batch...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // Print summary
      console.log('\n📊 Migration Summary:');
      console.log(`✅ Successfully migrated: ${this.migratedCount}`);
      console.log(`❌ Errors: ${this.errorCount}`);
      console.log(`⏭️ Skipped: ${this.skippedCount}`);

    } catch (error) {
      console.error('❌ Migration failed:', error);
    }
  }

  async processBatch(screenshots, options) {
    const { dryRun, deleteLocalAfterUpload } = options;

    for (const screenshot of screenshots) {
      try {
        console.log(`📸 Processing screenshot ${screenshot._id}...`);

        // Check if local file exists
        const localPath = screenshot.file_path;
        try {
          await fs.access(localPath);
        } catch (error) {
          console.log(`⏭️ Skipping ${screenshot._id}: Local file not found`);
          this.skippedCount++;
          continue;
        }

        if (dryRun) {
          console.log(`🔍 DRY RUN: Would migrate ${screenshot._id} from ${localPath}`);
          continue;
        }

        // Read local file
        const fileBuffer = await fs.readFile(localPath);
        
        // Determine if it's a violation or regular screenshot
        const isViolation = screenshot.metadata?.intelligent_capture && screenshot.is_flagged;
        
        // Upload to Cloudinary
        let cloudinaryResult;
        if (isViolation) {
          cloudinaryResult = await uploadViolationScreenshot(fileBuffer, screenshot.employee, {
            violationType: screenshot.flag_reason || 'unauthorized-access',
            application: screenshot.active_application?.name || 'unknown',
            url: screenshot.active_application?.url || 'unknown'
          });
        } else {
          cloudinaryResult = await uploadRegularScreenshot(fileBuffer, screenshot.employee, {
            application: screenshot.active_application?.name || 'unknown'
          });
        }

        // Update database record
        await ScreenCapture.findByIdAndUpdate(screenshot._id, {
          $set: {
            'metadata.cloudinary_url': cloudinaryResult.cloudinary_url,
            'metadata.cloudinary_public_id': cloudinaryResult.cloudinary_public_id,
            'metadata.cloudinary_version': cloudinaryResult.cloudinary_version,
            'metadata.storage_type': 'cloudinary',
            'metadata.migrated_at': new Date(),
            'metadata.original_local_path': localPath
          }
        });

        // Delete local file if requested
        if (deleteLocalAfterUpload) {
          try {
            await fs.unlink(localPath);
            console.log(`🗑️ Deleted local file: ${localPath}`);
          } catch (error) {
            console.log(`⚠️ Could not delete local file ${localPath}:`, error.message);
          }
        }

        console.log(`✅ Migrated ${screenshot._id} to Cloudinary`);
        this.migratedCount++;

      } catch (error) {
        console.error(`❌ Error migrating ${screenshot._id}:`, error.message);
        this.errorCount++;
      }
    }
  }

  async cleanupEmptyDirectories() {
    console.log('\n🧹 Cleaning up empty directories...');
    
    const baseDir = process.env.SCREENSHOT_STORAGE_PATH || './uploads/employee_data';
    
    try {
      await this.removeEmptyDirectories(baseDir);
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }

  async removeEmptyDirectories(dirPath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      // Recursively clean subdirectories
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const subDirPath = path.join(dirPath, entry.name);
          await this.removeEmptyDirectories(subDirPath);
        }
      }

      // Check if directory is now empty
      const remainingEntries = await fs.readdir(dirPath);
      if (remainingEntries.length === 0) {
        await fs.rmdir(dirPath);
        console.log(`🗑️ Removed empty directory: ${dirPath}`);
      }
    } catch (error) {
      // Directory might not exist or might not be empty, which is fine
    }
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    violationsOnly: !args.includes('--all'),
    maxRecords: parseInt(args.find(arg => arg.startsWith('--max='))?.split('=')[1]) || 1000,
    deleteLocalAfterUpload: args.includes('--delete-local'),
    cleanup: args.includes('--cleanup')
  };

  const migrationService = new ScreenshotMigrationService();
  
  try {
    await migrationService.connectToDatabase();
    await migrationService.migrateScreenshots(options);
    
    if (options.cleanup) {
      await migrationService.cleanupEmptyDirectories();
    }
    
  } finally {
    await migrationService.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  console.log('🔄 Screenshot Migration to Cloudinary');
  console.log('Usage: node migrateScreenshotsToCloudinary.js [options]');
  console.log('Options:');
  console.log('  --dry-run          Show what would be migrated without actually doing it');
  console.log('  --all              Migrate all screenshots (default: violations only)');
  console.log('  --max=N            Maximum number of records to process (default: 1000)');
  console.log('  --delete-local     Delete local files after successful upload');
  console.log('  --cleanup          Remove empty directories after migration');
  console.log('');
  
  main().catch(console.error);
}

module.exports = ScreenshotMigrationService;
