const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const ScreenCapture = require('../models/ScreenCapture');
const EmployeeActivity = require('../models/EmployeeActivity');
const MonitoringAlert = require('../models/MonitoringAlert');
const { KeystrokeAnalytics } = require('./keystrokeAnalytics');

class ReportGenerator {
  constructor() {
    this.chartRenderer = new ChartJSNodeCanvas({ 
      width: 800, 
      height: 400,
      backgroundColour: 'white'
    });
    this.reportsDir = process.env.REPORTS_STORAGE_PATH || './uploads/reports';
    this.ensureReportsDirectory();
  }

  async ensureReportsDirectory() {
    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating reports directory:', error);
    }
  }

  /**
   * Generate comprehensive employee monitoring report
   */
  async generateEmployeeReport(employeeId, startDate, endDate, options = {}) {
    try {
      const employee = await this.getEmployeeInfo(employeeId);
      const reportData = await this.gatherReportData(employeeId, startDate, endDate);
      
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: {
          Title: `Employee Monitoring Report - ${employee.name}`,
          Author: 'CyberFlow Monitoring System',
          Subject: 'Employee Productivity and Activity Report',
          Keywords: 'monitoring, productivity, analytics, employee'
        }
      });

      // Generate report sections
      await this.addReportHeader(doc, employee, startDate, endDate);
      await this.addExecutiveSummary(doc, reportData);
      await this.addProductivityAnalysis(doc, reportData);
      await this.addKeystrokeAnalytics(doc, reportData);
      await this.addActivityBreakdown(doc, reportData);
      await this.addViolationsSection(doc, reportData);
      await this.addChartsAndGraphs(doc, reportData);
      await this.addRecommendations(doc, reportData);
      
      // Save report
      const filename = `employee_report_${employeeId}_${Date.now()}.pdf`;
      const filepath = path.join(this.reportsDir, filename);
      
      return new Promise((resolve, reject) => {
        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);
        doc.end();
        
        stream.on('finish', () => {
          resolve({
            filename,
            filepath,
            size: stream.bytesWritten,
            generatedAt: new Date()
          });
        });
        
        stream.on('error', reject);
      });

    } catch (error) {
      console.error('Error generating employee report:', error);
      throw error;
    }
  }

  /**
   * Gather all data needed for the report
   */
  async gatherReportData(employeeId, startDate, endDate) {
    const [
      screenshots,
      activities,
      alerts,
      keystrokeData,
      productivitySummary
    ] = await Promise.all([
      this.getScreenshotData(employeeId, startDate, endDate),
      this.getActivityData(employeeId, startDate, endDate),
      this.getAlertsData(employeeId, startDate, endDate),
      this.getKeystrokeData(employeeId, startDate, endDate),
      this.getProductivitySummary(employeeId, startDate, endDate)
    ]);

    return {
      screenshots,
      activities,
      alerts,
      keystrokeData,
      productivitySummary,
      period: { startDate, endDate }
    };
  }

  /**
   * Add report header with company branding
   */
  async addReportHeader(doc, employee, startDate, endDate) {
    // Header background
    doc.rect(0, 0, doc.page.width, 120)
       .fill('#1a1a2e');

    // Company logo area (placeholder)
    doc.rect(50, 20, 80, 80)
       .fill('#16213e');

    // Title
    doc.fillColor('white')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('EMPLOYEE MONITORING REPORT', 150, 30);

    // Subtitle
    doc.fontSize(14)
       .font('Helvetica')
       .text('CyberFlow Intelligent Monitoring System', 150, 60);

    // Employee info
    doc.fontSize(12)
       .text(`Employee: ${employee.name}`, 150, 85)
       .text(`Department: ${employee.department || 'N/A'}`, 300, 85)
       .text(`Report Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`, 150, 100);

    doc.moveDown(3);
    doc.fillColor('black');
  }

  /**
   * Add executive summary section
   */
  async addExecutiveSummary(doc, reportData) {
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor('#1a1a2e')
       .text('EXECUTIVE SUMMARY', 50, doc.y + 20);

    doc.moveDown();
    
    const summary = this.calculateExecutiveSummary(reportData);
    
    // Summary boxes
    const boxWidth = 120;
    const boxHeight = 80;
    const startX = 50;
    let currentX = startX;

    const summaryItems = [
      { label: 'Productivity Score', value: `${summary.productivityScore}%`, color: this.getScoreColor(summary.productivityScore) },
      { label: 'Active Hours', value: `${summary.activeHours}h`, color: '#4CAF50' },
      { label: 'Violations', value: summary.violations, color: summary.violations > 0 ? '#f44336' : '#4CAF50' },
      { label: 'Focus Score', value: `${summary.focusScore}%`, color: this.getScoreColor(summary.focusScore) }
    ];

    summaryItems.forEach((item, index) => {
      // Box background
      doc.rect(currentX, doc.y, boxWidth, boxHeight)
         .fill('#f5f5f5')
         .stroke('#ddd');

      // Value
      doc.fillColor(item.color)
         .fontSize(24)
         .font('Helvetica-Bold')
         .text(item.value, currentX + 10, doc.y + 15, { width: boxWidth - 20, align: 'center' });

      // Label
      doc.fillColor('#666')
         .fontSize(10)
         .font('Helvetica')
         .text(item.label, currentX + 10, doc.y + 50, { width: boxWidth - 20, align: 'center' });

      currentX += boxWidth + 20;
    });

    doc.moveDown(6);
    doc.fillColor('black');
  }

  /**
   * Add productivity analysis section
   */
  async addProductivityAnalysis(doc, reportData) {
    doc.addPage();
    
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor('#1a1a2e')
       .text('PRODUCTIVITY ANALYSIS', 50);

    doc.moveDown();

    // Productivity metrics
    const productivity = reportData.productivitySummary;
    
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('black')
       .text(`Average Typing Speed: ${Math.round(productivity.avgTypingSpeed || 0)} WPM`, 50)
       .text(`Typing Accuracy: ${Math.round(productivity.avgAccuracy || 0)}%`, 50)
       .text(`Total Keystrokes: ${productivity.totalKeystrokes || 0}`, 50)
       .text(`Active Typing Time: ${Math.round((productivity.totalActiveTime || 0) / 60)} minutes`, 50)
       .text(`Idle Time: ${Math.round((productivity.totalIdleTime || 0) / 60)} minutes`, 50);

    doc.moveDown(2);

    // Activity breakdown
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Activity Breakdown:', 50);

    doc.moveDown();

    const activityStats = this.calculateActivityStats(reportData.activities);
    Object.entries(activityStats).forEach(([activity, count]) => {
      doc.fontSize(10)
         .font('Helvetica')
         .text(`${activity}: ${count} sessions`, 70);
    });
  }

  /**
   * Add keystroke analytics section
   */
  async addKeystrokeAnalytics(doc, reportData) {
    doc.moveDown(2);
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#1a1a2e')
       .text('KEYSTROKE ANALYTICS', 50);

    doc.moveDown();

    if (reportData.keystrokeData.length > 0) {
      const keystrokeStats = this.analyzeKeystrokePatterns(reportData.keystrokeData);
      
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('black')
         .text(`Most Active Application: ${keystrokeStats.mostActiveApp}`, 50)
         .text(`Peak Performance Time: ${keystrokeStats.peakTime}`, 50)
         .text(`Programming Activity: ${keystrokeStats.programmingPercentage}%`, 50)
         .text(`Multitasking Detected: ${keystrokeStats.multitaskingCount} times`, 50);
    } else {
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#666')
         .text('No keystroke data available for this period.', 50);
    }
  }

  /**
   * Add activity breakdown section
   */
  async addActivityBreakdown(doc, reportData) {
    doc.moveDown(2);
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#1a1a2e')
       .text('ACTIVITY BREAKDOWN', 50);

    doc.moveDown();

    // Create activity timeline
    const timeline = this.createActivityTimeline(reportData.activities);
    
    timeline.forEach(entry => {
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('black')
         .text(`${entry.time}: ${entry.activity}`, 50);
    });
  }

  /**
   * Add violations section
   */
  async addViolationsSection(doc, reportData) {
    doc.addPage();
    
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor('#1a1a2e')
       .text('POLICY VIOLATIONS & ALERTS', 50);

    doc.moveDown();

    if (reportData.alerts.length > 0) {
      reportData.alerts.forEach(alert => {
        // Alert box
        const alertColor = this.getAlertColor(alert.severity);
        
        doc.rect(50, doc.y, 500, 60)
           .fill(alertColor + '20')
           .stroke(alertColor);

        doc.fillColor(alertColor)
           .fontSize(12)
           .font('Helvetica-Bold')
           .text(alert.title, 60, doc.y + 10);

        doc.fillColor('black')
           .fontSize(10)
           .font('Helvetica')
           .text(alert.description, 60, doc.y + 25, { width: 480 });

        doc.fontSize(8)
           .fillColor('#666')
           .text(`${new Date(alert.timestamp).toLocaleString()} | Severity: ${alert.severity}`, 60, doc.y + 45);

        doc.moveDown(4);
      });
    } else {
      doc.fontSize(12)
         .font('Helvetica')
         .fillColor('#4CAF50')
         .text('✓ No policy violations detected during this period.', 50);
    }
  }

  /**
   * Add charts and graphs
   */
  async addChartsAndGraphs(doc, reportData) {
    doc.addPage();
    
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor('#1a1a2e')
       .text('ANALYTICS & CHARTS', 50);

    doc.moveDown();

    try {
      // Generate productivity chart
      const productivityChart = await this.generateProductivityChart(reportData);
      if (productivityChart) {
        doc.image(productivityChart, 50, doc.y, { width: 500 });
        doc.moveDown(15);
      }

      // Generate activity distribution chart
      const activityChart = await this.generateActivityChart(reportData);
      if (activityChart) {
        doc.image(activityChart, 50, doc.y, { width: 500 });
      }
    } catch (error) {
      console.error('Error generating charts:', error);
      doc.fontSize(10)
         .fillColor('#666')
         .text('Charts could not be generated for this report.', 50);
    }
  }

  /**
   * Add recommendations section
   */
  async addRecommendations(doc, reportData) {
    doc.addPage();
    
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor('#1a1a2e')
       .text('RECOMMENDATIONS', 50);

    doc.moveDown();

    const recommendations = this.generateRecommendations(reportData);
    
    recommendations.forEach((recommendation, index) => {
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#1a1a2e')
         .text(`${index + 1}. ${recommendation.title}`, 50);

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('black')
         .text(recommendation.description, 70, doc.y, { width: 480 });

      doc.moveDown(1.5);
    });

    // Footer
    doc.moveDown(3);
    doc.fontSize(8)
       .fillColor('#666')
       .text(`Report generated on ${new Date().toLocaleString()} by CyberFlow Monitoring System`, 50, doc.page.height - 50);
  }

  /**
   * Generate productivity chart
   */
  async generateProductivityChart(reportData) {
    try {
      const chartConfig = {
        type: 'line',
        data: {
          labels: this.getTimeLabels(reportData.period),
          datasets: [{
            label: 'Productivity Score',
            data: this.getProductivityData(reportData),
            borderColor: '#4CAF50',
            backgroundColor: '#4CAF5020',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Productivity Trend Over Time'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100
            }
          }
        }
      };

      return await this.chartRenderer.renderToBuffer(chartConfig);
    } catch (error) {
      console.error('Error generating productivity chart:', error);
      return null;
    }
  }

  /**
   * Generate activity distribution chart
   */
  async generateActivityChart(reportData) {
    try {
      const activityStats = this.calculateActivityStats(reportData.activities);
      
      const chartConfig = {
        type: 'doughnut',
        data: {
          labels: Object.keys(activityStats),
          datasets: [{
            data: Object.values(activityStats),
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
              '#FF9F40'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Activity Distribution'
            }
          }
        }
      };

      return await this.chartRenderer.renderToBuffer(chartConfig);
    } catch (error) {
      console.error('Error generating activity chart:', error);
      return null;
    }
  }

  /**
   * Helper methods for data processing
   */
  async getEmployeeInfo(employeeId) {
    const User = require('../models/User');
    return await User.findById(employeeId).select('name email department role');
  }

  async getScreenshotData(employeeId, startDate, endDate) {
    return await ScreenCapture.find({
      employee: employeeId,
      timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).sort({ timestamp: -1 });
  }

  async getActivityData(employeeId, startDate, endDate) {
    return await EmployeeActivity.find({
      employee: employeeId,
      timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).sort({ timestamp: -1 });
  }

  async getAlertsData(employeeId, startDate, endDate) {
    return await MonitoringAlert.find({
      employee: employeeId,
      timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).sort({ timestamp: -1 });
  }

  async getKeystrokeData(employeeId, startDate, endDate) {
    return await KeystrokeAnalytics.find({
      employee: employeeId,
      timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).sort({ timestamp: -1 });
  }

  async getProductivitySummary(employeeId, startDate, endDate) {
    const keystrokeService = require('./keystrokeAnalytics').KeystrokeAnalyticsService;
    return await keystrokeService.prototype.getProductivitySummary(employeeId, startDate, endDate);
  }

  calculateExecutiveSummary(reportData) {
    const productivity = reportData.productivitySummary;
    return {
      productivityScore: Math.round(productivity.avgProductivityScore || 0),
      activeHours: Math.round((productivity.totalActiveTime || 0) / 3600),
      violations: reportData.alerts.length,
      focusScore: Math.round(productivity.avgFocusScore || 0)
    };
  }

  calculateActivityStats(activities) {
    const stats = {};
    activities.forEach(activity => {
      const type = activity.activity_type || 'Unknown';
      stats[type] = (stats[type] || 0) + 1;
    });
    return stats;
  }

  analyzeKeystrokePatterns(keystrokeData) {
    if (keystrokeData.length === 0) {
      return {
        mostActiveApp: 'N/A',
        peakTime: 'N/A',
        programmingPercentage: 0,
        multitaskingCount: 0
      };
    }

    const apps = {};
    let programmingCount = 0;
    let multitaskingCount = 0;

    keystrokeData.forEach(data => {
      if (data.application_name) {
        apps[data.application_name] = (apps[data.application_name] || 0) + 1;
      }
      
      if (data.content_analysis?.estimated_content_type === 'code') {
        programmingCount++;
      }
      
      if (data.pattern_analysis?.multitasking_detected) {
        multitaskingCount++;
      }
    });

    const mostActiveApp = Object.keys(apps).reduce((a, b) => apps[a] > apps[b] ? a : b, 'N/A');
    const programmingPercentage = Math.round((programmingCount / keystrokeData.length) * 100);

    return {
      mostActiveApp,
      peakTime: '10:00 AM - 11:00 AM', // This could be calculated from actual data
      programmingPercentage,
      multitaskingCount
    };
  }

  createActivityTimeline(activities) {
    return activities.slice(0, 20).map(activity => ({
      time: new Date(activity.timestamp).toLocaleTimeString(),
      activity: activity.activity_type || 'Unknown Activity'
    }));
  }

  generateRecommendations(reportData) {
    const recommendations = [];
    const summary = this.calculateExecutiveSummary(reportData);

    if (summary.productivityScore < 70) {
      recommendations.push({
        title: 'Improve Productivity',
        description: 'Consider implementing time management techniques and reducing distractions during work hours.'
      });
    }

    if (summary.violations > 5) {
      recommendations.push({
        title: 'Address Policy Violations',
        description: 'Review company policies with the employee and provide additional training on acceptable use.'
      });
    }

    if (summary.focusScore < 60) {
      recommendations.push({
        title: 'Enhance Focus',
        description: 'Reduce application switching and implement focused work sessions with regular breaks.'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        title: 'Maintain Current Performance',
        description: 'Employee is performing well. Continue current practices and consider them for mentoring others.'
      });
    }

    return recommendations;
  }

  getScoreColor(score) {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#f44336';
  }

  getAlertColor(severity) {
    switch (severity) {
      case 'high': return '#f44336';
      case 'medium': return '#FF9800';
      case 'low': return '#FFC107';
      default: return '#9E9E9E';
    }
  }

  getTimeLabels(period) {
    const labels = [];
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      labels.push(d.toLocaleDateString());
    }
    
    return labels;
  }

  getProductivityData(reportData) {
    // This would be calculated from actual daily productivity scores
    // For now, returning sample data
    return [75, 82, 68, 90, 85, 78, 88];
  }

  /**
   * Generate bulk report for multiple employees
   */
  async generateBulkReport(employeeIds, startDate, endDate) {
    const reports = [];
    
    for (const employeeId of employeeIds) {
      try {
        const report = await this.generateEmployeeReport(employeeId, startDate, endDate);
        reports.push(report);
      } catch (error) {
        console.error(`Error generating report for employee ${employeeId}:`, error);
      }
    }
    
    return reports;
  }

  /**
   * Export data to CSV format
   */
  async exportToCSV(employeeId, startDate, endDate, dataType = 'all') {
    try {
      const reportData = await this.gatherReportData(employeeId, startDate, endDate);
      let csvContent = '';
      
      switch (dataType) {
        case 'activities':
          csvContent = this.generateActivitiesCSV(reportData.activities);
          break;
        case 'keystrokes':
          csvContent = this.generateKeystrokesCSV(reportData.keystrokeData);
          break;
        case 'alerts':
          csvContent = this.generateAlertsCSV(reportData.alerts);
          break;
        default:
          csvContent = this.generateFullCSV(reportData);
      }
      
      const filename = `${dataType}_export_${employeeId}_${Date.now()}.csv`;
      const filepath = path.join(this.reportsDir, filename);
      
      await fs.writeFile(filepath, csvContent);
      
      return {
        filename,
        filepath,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw error;
    }
  }

  generateActivitiesCSV(activities) {
    const headers = 'Timestamp,Activity Type,Application,Duration,Productivity Score\n';
    const rows = activities.map(activity => 
      `${activity.timestamp},${activity.activity_type || ''},${activity.application_name || ''},${activity.duration || 0},${activity.productivity_score || 0}`
    ).join('\n');
    
    return headers + rows;
  }

  generateKeystrokesCSV(keystrokeData) {
    const headers = 'Timestamp,Application,Keystrokes,Typing Speed,Accuracy,Productivity Score\n';
    const rows = keystrokeData.map(data => 
      `${data.timestamp},${data.application_name || ''},${data.keystroke_data?.total_keystrokes || 0},${data.keystroke_data?.typing_speed_wpm || 0},${data.keystroke_data?.typing_accuracy || 0},${data.productivity_metrics?.productivity_score || 0}`
    ).join('\n');
    
    return headers + rows;
  }

  generateAlertsCSV(alerts) {
    const headers = 'Timestamp,Type,Severity,Title,Description\n';
    const rows = alerts.map(alert => 
      `${alert.timestamp},${alert.alert_type},${alert.severity},"${alert.title}","${alert.description}"`
    ).join('\n');
    
    return headers + rows;
  }

  generateFullCSV(reportData) {
    // Combine all data types into a comprehensive CSV
    let csv = 'Data Type,Timestamp,Details\n';
    
    reportData.activities.forEach(activity => {
      csv += `Activity,${activity.timestamp},"${activity.activity_type || 'Unknown'}"\n`;
    });
    
    reportData.alerts.forEach(alert => {
      csv += `Alert,${alert.timestamp},"${alert.title}"\n`;
    });
    
    return csv;
  }
}

module.exports = new ReportGenerator();
