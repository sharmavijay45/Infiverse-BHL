const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class GroqAIService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    this.model = process.env.GROQ_MODEL || 'llama-3.2-90b-vision-preview'; // Use env variable or fallback
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  /**
   * Analyze screenshot content using Groq AI
   */
  async analyzeScreenshot(screenshotPath, context = {}) {
    if (!this.apiKey) {
      console.warn('Groq API key not configured, skipping AI analysis');
      return null;
    }

    // Check if model supports vision
    const isVisionModel = this.model.includes('vision') || this.model.includes('llava');

    if (!isVisionModel) {
      console.warn(`Model ${this.model} does not support vision. Using fallback analysis.`);
      return this.createFallbackAnalysis(context);
    }

    try {
      // Convert image to base64
      const imageBase64 = await this.imageToBase64(screenshotPath);

      // Prepare analysis prompt
      const prompt = this.buildAnalysisPrompt(context);

      // Call Groq API with retry logic
      const response = await this.callGroqAPIWithRetry({
        model: this.model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      });

      // Parse and structure the response
      return this.parseAnalysisResponse(response.data, context);

    } catch (error) {
      console.error('Groq AI analysis error:', error);
      return this.createFallbackAnalysis(context);
    }
  }

  /**
   * Build analysis prompt based on context
   */
  buildAnalysisPrompt(context) {
    const { currentTask, applicationData, employeeId } = context;
    
    let prompt = `Analyze this screenshot of an employee's computer screen and provide insights in JSON format.

Please analyze:
1. What type of content is being viewed (e.g., "social media", "video streaming", "work documents", "coding", "shopping")
2. Describe the specific activity (e.g., "watching YouTube cooking videos", "browsing Facebook feed", "reading technical documentation")
3. Assess the content's appropriateness for a workplace environment
4. Rate the content's risk level (low/medium/high) for productivity and security`;

    if (currentTask) {
      prompt += `\n5. Compare this activity to the employee's current assigned task: "${currentTask.title}" - ${currentTask.description}
6. Rate task relevance (0-100%) and explain the connection or lack thereof`;
    }

    if (applicationData?.url) {
      prompt += `\n\nThe employee is currently on: ${applicationData.url}`;
    }
    
    if (applicationData?.name) {
      prompt += `\nApplication: ${applicationData.name}`;
    }

    prompt += `\n\nRespond in this exact JSON format:
{
  "contentType": "brief category of content",
  "activityDescription": "detailed description of what the user is doing",
  "workplaceAppropriateness": "appropriate/questionable/inappropriate",
  "contentRisk": {
    "level": "low/medium/high",
    "reasons": ["reason1", "reason2"]
  },
  "taskRelevance": {
    "score": 0-100,
    "explanation": "explanation of relevance or lack thereof"
  },
  "recommendations": ["action1", "action2"],
  "confidence": 0-100
}`;

    return prompt;
  }

  /**
   * Parse AI response and structure data
   */
  parseAnalysisResponse(response, context) {
    try {
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in AI response');
      }

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      
      // Add metadata
      analysis.timestamp = new Date();
      analysis.model = this.model;
      analysis.context = {
        employeeId: context.employeeId,
        hasCurrentTask: !!context.currentTask,
        applicationUrl: context.applicationData?.url,
        applicationName: context.applicationData?.name
      };

      // Validate and sanitize
      return this.validateAnalysis(analysis);

    } catch (error) {
      console.error('Error parsing AI response:', error);
      return this.createFallbackAnalysis(context);
    }
  }

  /**
   * Validate and sanitize AI analysis
   */
  validateAnalysis(analysis) {
    const validated = {
      contentType: analysis.contentType || 'Unknown Content',
      activityDescription: analysis.activityDescription || 'Unable to determine activity',
      workplaceAppropriateness: ['appropriate', 'questionable', 'inappropriate'].includes(analysis.workplaceAppropriateness) 
        ? analysis.workplaceAppropriateness : 'questionable',
      contentRisk: {
        level: ['low', 'medium', 'high'].includes(analysis.contentRisk?.level) 
          ? analysis.contentRisk.level : 'medium',
        reasons: Array.isArray(analysis.contentRisk?.reasons) 
          ? analysis.contentRisk.reasons.slice(0, 5) : ['Unable to assess risk']
      },
      taskRelevance: {
        score: Math.max(0, Math.min(100, analysis.taskRelevance?.score || 0)),
        explanation: analysis.taskRelevance?.explanation || 'No task relevance analysis available'
      },
      recommendations: Array.isArray(analysis.recommendations) 
        ? analysis.recommendations.slice(0, 3) : ['Review employee activity'],
      confidence: Math.max(0, Math.min(100, analysis.confidence || 50)),
      timestamp: analysis.timestamp,
      model: analysis.model,
      context: analysis.context
    };

    return validated;
  }

  /**
   * Create fallback analysis when AI fails
   */
  createFallbackAnalysis(context) {
    const { applicationData, currentTask } = context;
    
    return {
      contentType: 'Unknown Content',
      activityDescription: `Accessing ${applicationData?.name || applicationData?.url || 'unknown application'}`,
      workplaceAppropriateness: 'questionable',
      contentRisk: {
        level: 'medium',
        reasons: ['Unable to analyze content automatically']
      },
      taskRelevance: {
        score: currentTask ? 25 : 0,
        explanation: currentTask 
          ? 'Unable to determine relevance to assigned task automatically'
          : 'No current task assigned for comparison'
      },
      recommendations: [
        'Manual review recommended',
        'Consider adding to whitelist if appropriate'
      ],
      confidence: 10,
      timestamp: new Date(),
      model: 'fallback',
      context: {
        employeeId: context.employeeId,
        hasCurrentTask: !!currentTask,
        applicationUrl: applicationData?.url,
        applicationName: applicationData?.name,
        fallbackReason: 'AI analysis failed'
      }
    };
  }

  /**
   * Call Groq API with retry logic
   */
  async callGroqAPIWithRetry(payload, retryCount = 0) {
    try {
      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      return response;

    } catch (error) {
      if (retryCount < this.maxRetries) {
        console.log(`Groq API call failed, retrying... (${retryCount + 1}/${this.maxRetries})`);
        await this.delay(this.retryDelay * (retryCount + 1));
        return this.callGroqAPIWithRetry(payload, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Convert image file to base64
   */
  async imageToBase64(imagePath) {
    try {
      const imageBuffer = await fs.readFile(imagePath);
      return imageBuffer.toString('base64');
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new Error('Failed to process image for AI analysis');
    }
  }

  /**
   * Analyze multiple screenshots for pattern detection
   */
  async analyzeScreenshotPattern(screenshots, context = {}) {
    if (!screenshots || screenshots.length === 0) return null;

    try {
      // Analyze the most recent screenshot with context from previous ones
      const latestScreenshot = screenshots[screenshots.length - 1];
      const previousActivities = screenshots.slice(0, -1).map(s => s.activityDescription).join(', ');
      
      const enhancedContext = {
        ...context,
        previousActivities,
        sessionDuration: screenshots.length,
        patternAnalysis: true
      };

      const analysis = await this.analyzeScreenshot(latestScreenshot.file_path, enhancedContext);
      
      if (analysis) {
        // Add pattern-specific insights
        analysis.patternInsights = {
          sessionLength: screenshots.length,
          consistentActivity: this.detectConsistentActivity(screenshots),
          escalationLevel: this.calculateEscalationLevel(screenshots),
          timeSpent: this.calculateTimeSpent(screenshots)
        };
      }

      return analysis;

    } catch (error) {
      console.error('Error analyzing screenshot pattern:', error);
      return null;
    }
  }

  /**
   * Detect consistent activity patterns
   */
  detectConsistentActivity(screenshots) {
    if (screenshots.length < 2) return false;
    
    const activities = screenshots.map(s => s.activityDescription || '').filter(a => a);
    const uniqueActivities = new Set(activities);
    
    return uniqueActivities.size <= 2; // Consistent if only 1-2 different activities
  }

  /**
   * Calculate escalation level based on screenshot sequence
   */
  calculateEscalationLevel(screenshots) {
    const riskLevels = screenshots.map(s => {
      if (s.contentRisk?.level === 'high') return 3;
      if (s.contentRisk?.level === 'medium') return 2;
      return 1;
    });

    const avgRisk = riskLevels.reduce((sum, risk) => sum + risk, 0) / riskLevels.length;
    
    if (avgRisk >= 2.5) return 'high';
    if (avgRisk >= 1.5) return 'medium';
    return 'low';
  }

  /**
   * Calculate estimated time spent on activity
   */
  calculateTimeSpent(screenshots) {
    if (screenshots.length < 2) return 0;
    
    const firstTimestamp = new Date(screenshots[0].timestamp);
    const lastTimestamp = new Date(screenshots[screenshots.length - 1].timestamp);
    
    return Math.round((lastTimestamp - firstTimestamp) / 1000 / 60); // Minutes
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test AI service connectivity
   */
  async testConnection() {
    if (!this.apiKey) {
      return { success: false, error: 'API key not configured' };
    }

    try {
      // Use the configured model or a fallback text model for testing
      const testModel = this.model.includes('vision') ? 'llama3-8b-8192' : this.model;

      const response = await axios.post(this.apiUrl, {
        model: testModel,
        messages: [
          {
            role: "user",
            content: "Hello, this is a test message. Please respond with 'AI service is working'."
          }
        ],
        max_tokens: 50
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      return { 
        success: true, 
        message: 'Groq AI service is connected and working',
        model: this.model
      };

    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        details: error.response?.data
      };
    }
  }
}

module.exports = new GroqAIService();
