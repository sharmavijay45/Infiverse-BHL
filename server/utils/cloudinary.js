const cloudinary = require("cloudinary").v2;
const crypto = require('crypto');

// Connect to MongoDB
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload task documents to Cloudinary (existing function)
 */
async function uploadToCloudinary(buffer, fileName) {
  try {
    // Determine resource_type based on file extension
    const extension = fileName.match(/\.([a-zA-Z0-9]+)$/i)?.[1]?.toLowerCase();
    const resourceType = extension === "pdf" ? "raw" : "auto"; // Use "raw" for PDFs, "auto" for others

    // Upload buffer to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: `tasks/${Date.now()}-${fileName}`,
          resource_type: resourceType,
          folder: "task-documents",
          use_filename: true,
          unique_filename: false,
          format: extension, // Explicitly set the format (e.g., 'pdf', 'html')
          access_mode: "public",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    // Return the secure URL
    return result.secure_url;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw new Error("Failed to upload file to Cloudinary");
  }
}

/**
 * Upload violation screenshot to Cloudinary with enhanced security and organization
 */
async function uploadViolationScreenshot(buffer, employeeId, metadata = {}) {
  try {
    const timestamp = Date.now();
    const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Generate secure filename
    const hash = crypto.createHash('md5').update(buffer).digest('hex').substring(0, 8);
    const fileName = `violation_${timestamp}_${hash}`;

    // Upload to Cloudinary with organized folder structure
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: `employee-monitoring/violations/${employeeId}/${dateStr}/${fileName}`,
          resource_type: "image",
          folder: "employee-monitoring/violations",
          format: "jpg",
          quality: "auto:good", // Automatic quality optimization
          fetch_format: "auto", // Automatic format optimization
          type: "private", // Private access for security
          tags: [
            "violation-screenshot",
            `employee-${employeeId}`,
            `date-${dateStr}`,
            metadata.violationType || "unauthorized-access"
          ],
          context: {
            employee_id: employeeId,
            capture_date: dateStr,
            violation_type: metadata.violationType || "unauthorized-access",
            application: metadata.application || "unknown",
            url: metadata.url || "unknown",
            ai_confidence: metadata.aiConfidence || 0
          },
          transformation: [
            {
              quality: "auto:good",
              fetch_format: "auto"
            }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    console.log(`📤 Violation screenshot uploaded to Cloudinary: ${result.public_id}`);

    return {
      cloudinary_url: result.secure_url,
      cloudinary_public_id: result.public_id,
      cloudinary_version: result.version,
      file_size: result.bytes,
      format: result.format,
      width: result.width,
      height: result.height
    };

  } catch (error) {
    console.error("Error uploading violation screenshot to Cloudinary:", error);
    throw new Error("Failed to upload violation screenshot to Cloudinary");
  }
}

/**
 * Upload regular screenshot to Cloudinary
 */
async function uploadRegularScreenshot(buffer, employeeId, metadata = {}) {
  try {
    const timestamp = Date.now();
    const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Generate secure filename
    const hash = crypto.createHash('md5').update(buffer).digest('hex').substring(0, 8);
    const fileName = `screen_${timestamp}_${hash}`;

    // Upload to Cloudinary with organized folder structure
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: `employee-monitoring/regular/${employeeId}/${dateStr}/${fileName}`,
          resource_type: "image",
          folder: "employee-monitoring/regular",
          format: "jpg",
          quality: "auto:eco", // Lower quality for regular screenshots
          fetch_format: "auto",
          type: "private",
          tags: [
            "regular-screenshot",
            `employee-${employeeId}`,
            `date-${dateStr}`
          ],
          context: {
            employee_id: employeeId,
            capture_date: dateStr,
            screenshot_type: "regular",
            application: metadata.application || "unknown"
          }
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    console.log(`📤 Regular screenshot uploaded to Cloudinary: ${result.public_id}`);

    return {
      cloudinary_url: result.secure_url,
      cloudinary_public_id: result.public_id,
      cloudinary_version: result.version,
      file_size: result.bytes,
      format: result.format,
      width: result.width,
      height: result.height
    };

  } catch (error) {
    console.error("Error uploading regular screenshot to Cloudinary:", error);
    throw new Error("Failed to upload regular screenshot to Cloudinary");
  }
}

/**
 * Retrieve violation screenshots for an employee
 */
async function getViolationScreenshots(employeeId, options = {}) {
  try {
    const { date, limit = 50, offset = 0 } = options;

    let searchExpression = `folder:employee-monitoring/violations/${employeeId}/*`;

    if (date) {
      searchExpression += ` AND context.capture_date=${date}`;
    }

    const result = await cloudinary.search
      .expression(searchExpression)
      .sort_by([['created_at', 'desc']])
      .max_results(limit)
      .with_field('context')
      .with_field('tags')
      .execute();

    console.log(`📥 Retrieved ${result.resources.length} violation screenshots for employee ${employeeId}`);

    return result.resources.map(resource => ({
      cloudinary_url: resource.secure_url,
      cloudinary_public_id: resource.public_id,
      created_at: resource.created_at,
      file_size: resource.bytes,
      width: resource.width,
      height: resource.height,
      format: resource.format,
      context: resource.context || {},
      tags: resource.tags || []
    }));

  } catch (error) {
    console.error("Error retrieving violation screenshots from Cloudinary:", error);
    throw new Error("Failed to retrieve violation screenshots from Cloudinary");
  }
}

/**
 * Delete violation screenshot from Cloudinary
 */
async function deleteViolationScreenshot(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image"
    });

    console.log(`🗑️ Deleted violation screenshot from Cloudinary: ${publicId}`);
    return result;

  } catch (error) {
    console.error("Error deleting violation screenshot from Cloudinary:", error);
    throw new Error("Failed to delete violation screenshot from Cloudinary");
  }
}

/**
 * Generate optimized URL for violation screenshot display
 */
function generateOptimizedScreenshotUrl(publicId, options = {}) {
  const {
    width = 800,
    height = 600,
    quality = "auto:good",
    format = "auto"
  } = options;

  return cloudinary.url(publicId, {
    width,
    height,
    crop: "limit",
    quality,
    fetch_format: format,
    secure: true,
    sign_url: true, // Add signature for security
    type: "private" // For private images
  });
}

/**
 * Bulk cleanup old violation screenshots
 */
async function cleanupOldViolationScreenshots(retentionDays = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffTimestamp = Math.floor(cutoffDate.getTime() / 1000);

    // Search for old violation screenshots
    const result = await cloudinary.search
      .expression(`folder:employee-monitoring/violations/* AND created_at<${cutoffTimestamp}`)
      .sort_by([['created_at', 'asc']])
      .max_results(500) // Process in batches
      .execute();

    if (result.resources.length === 0) {
      console.log("🧹 No old violation screenshots to cleanup");
      return { deleted: 0 };
    }

    // Delete in batches
    const publicIds = result.resources.map(resource => resource.public_id);
    const deleteResult = await cloudinary.api.delete_resources(publicIds, {
      resource_type: "image"
    });

    const deletedCount = Object.keys(deleteResult.deleted).length;
    console.log(`🧹 Cleaned up ${deletedCount} old violation screenshots from Cloudinary`);

    return { deleted: deletedCount, details: deleteResult };

  } catch (error) {
    console.error("Error cleaning up old violation screenshots:", error);
    throw new Error("Failed to cleanup old violation screenshots");
  }
}

/**
 * Get storage statistics for employee monitoring
 */
async function getStorageStatistics() {
  try {
    // Get violation screenshots stats
    const violationStats = await cloudinary.search
      .expression('folder:employee-monitoring/violations/*')
      .aggregate('format')
      .execute();

    // Get regular screenshots stats
    const regularStats = await cloudinary.search
      .expression('folder:employee-monitoring/regular/*')
      .aggregate('format')
      .execute();

    return {
      violation_screenshots: {
        total_count: violationStats.total_count || 0,
        formats: violationStats.aggregations || []
      },
      regular_screenshots: {
        total_count: regularStats.total_count || 0,
        formats: regularStats.aggregations || []
      }
    };

  } catch (error) {
    console.error("Error getting storage statistics:", error);
    return {
      violation_screenshots: { total_count: 0, formats: [] },
      regular_screenshots: { total_count: 0, formats: [] }
    };
  }
}

module.exports = {
  uploadToCloudinary,
  uploadViolationScreenshot,
  uploadRegularScreenshot,
  getViolationScreenshots,
  deleteViolationScreenshot,
  generateOptimizedScreenshotUrl,
  cleanupOldViolationScreenshots,
  getStorageStatistics
};
