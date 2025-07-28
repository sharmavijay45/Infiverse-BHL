const express = require('express');
const mongoose = require('mongoose');
const ScreenCapture = require('../models/ScreenCapture');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/workflow-management');

async function testAPI() {
  try {
    const employeeId = '683011a017ba6ac0f84fb39b';
    const date = '2025-07-26';
    
    console.log('🧪 Testing Screenshot API directly...');
    console.log(`Employee ID: ${employeeId}`);
    console.log(`Date: ${date}`);
    
    // Parse the date and create start/end of day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    console.log(`📅 Searching between ${startOfDay} and ${endOfDay}`);
    
    // Always filter to only show violation screenshots
    const violationFilter = {
      $or: [
        { is_flagged: true },
        { capture_trigger: 'unauthorized_access' },
        { capture_trigger: 'unauthorized_site' },
        { 'metadata.intelligent_capture': true }
      ]
    };
    
    const screenshots = await ScreenCapture.find({
      employee: employeeId,
      timestamp: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      ...violationFilter
    })
    .sort({ timestamp: -1 })
    .limit(50);
    
    console.log(`📸 Found ${screenshots.length} violation screenshots`);
    
    screenshots.forEach((screenshot, index) => {
      console.log(`${index + 1}. ${screenshot.active_application?.title}`);
      console.log(`   URL: ${screenshot.active_application?.url}`);
      console.log(`   Trigger: ${screenshot.capture_trigger}`);
      console.log(`   Flagged: ${screenshot.is_flagged}`);
      console.log(`   Timestamp: ${screenshot.timestamp}`);
      console.log(`   AI Analysis: ${screenshot.metadata?.ai_analysis ? 'Present' : 'None'}`);
      console.log('---');
    });
    
    // Test the response format
    const response = {
      screenshots: screenshots || [],
      totalCount: screenshots?.length || 0,
      message: 'Only violation screenshots are shown'
    };
    
    console.log('📋 API Response:');
    console.log(`Total Count: ${response.totalCount}`);
    console.log(`Message: ${response.message}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testAPI();
