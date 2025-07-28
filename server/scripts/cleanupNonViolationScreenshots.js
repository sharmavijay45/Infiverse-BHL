const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const ScreenCapture = require('../models/ScreenCapture');

async function cleanupNonViolationScreenshots() {
  try {
    console.log('🧹 Starting cleanup of non-violation screenshots...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/workflow-management');
    console.log('✅ Connected to MongoDB');

    // Find all non-violation screenshots
    const nonViolationScreenshots = await ScreenCapture.find({
      $or: [
        { 'metadata.intelligent_capture': { $ne: true } },
        { 'metadata.intelligent_capture': { $exists: false } },
        { capture_trigger: 'scheduled' },
        { capture_trigger: 'activity_change' },
        { is_flagged: false }
      ]
    });

    console.log(`📊 Found ${nonViolationScreenshots.length} non-violation screenshots to remove`);

    let deletedFiles = 0;
    let deletedRecords = 0;
    let errors = 0;

    for (const screenshot of nonViolationScreenshots) {
      try {
        // Delete the physical file if it exists
        if (screenshot.file_path) {
          try {
            await fs.unlink(screenshot.file_path);
            deletedFiles++;
            console.log(`🗑️  Deleted file: ${screenshot.file_path}`);
          } catch (fileError) {
            if (fileError.code !== 'ENOENT') {
              console.warn(`⚠️  Could not delete file ${screenshot.file_path}:`, fileError.message);
            }
          }
        }

        // Delete the database record
        await ScreenCapture.deleteOne({ _id: screenshot._id });
        deletedRecords++;

      } catch (error) {
        console.error(`❌ Error processing screenshot ${screenshot._id}:`, error.message);
        errors++;
      }
    }

    // Get remaining violation screenshots count
    const remainingViolations = await ScreenCapture.countDocuments({
      'metadata.intelligent_capture': true,
      $or: [
        { capture_trigger: 'unauthorized_access' },
        { capture_trigger: 'unauthorized_site' }
      ],
      is_flagged: true
    });

    console.log('\n📋 Cleanup Summary:');
    console.log(`✅ Deleted ${deletedFiles} screenshot files`);
    console.log(`✅ Deleted ${deletedRecords} database records`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📸 Remaining violation screenshots: ${remainingViolations}`);
    
    // Calculate storage saved (estimate)
    const avgScreenshotSize = 500 * 1024; // 500KB average
    const storageSaved = deletedFiles * avgScreenshotSize;
    const storageSavedMB = (storageSaved / (1024 * 1024)).toFixed(2);
    
    console.log(`💾 Estimated storage saved: ${storageSavedMB} MB`);
    console.log('\n🎉 Storage optimization complete!');
    console.log('📋 Only intelligent violation screenshots are now stored.');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the cleanup
if (require.main === module) {
  cleanupNonViolationScreenshots()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = cleanupNonViolationScreenshots;
