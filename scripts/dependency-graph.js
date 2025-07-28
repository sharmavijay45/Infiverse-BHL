#!/usr/bin/env node

/**
 * Dependency Graph Generator for CyberFlow Application
 * Generates visual dependency graphs and analysis reports
 */

const fs = require('fs');
const path = require('path');

class DependencyAnalyzer {
  constructor() {
    this.clientPackage = null;
    this.serverPackage = null;
    this.analysis = {
      client: { dependencies: {}, devDependencies: {}, total: 0 },
      server: { dependencies: {}, devDependencies: {}, total: 0 },
      shared: [],
      redundant: [],
      security: []
    };
  }

  loadPackageFiles() {
    try {
      // Load client package.json
      const clientPath = path.join(__dirname, '../client/package.json');
      this.clientPackage = JSON.parse(fs.readFileSync(clientPath, 'utf8'));
      
      // Load server package.json
      const serverPath = path.join(__dirname, '../server/package.json');
      this.serverPackage = JSON.parse(fs.readFileSync(serverPath, 'utf8'));
      
      console.log('✅ Package files loaded successfully');
    } catch (error) {
      console.error('❌ Error loading package files:', error.message);
      process.exit(1);
    }
  }

  analyzeDependencies() {
    // Analyze client dependencies
    this.analysis.client.dependencies = this.clientPackage.dependencies || {};
    this.analysis.client.devDependencies = this.clientPackage.devDependencies || {};
    this.analysis.client.total = Object.keys(this.analysis.client.dependencies).length + 
                                  Object.keys(this.analysis.client.devDependencies).length;

    // Analyze server dependencies
    this.analysis.server.dependencies = this.serverPackage.dependencies || {};
    this.analysis.server.devDependencies = this.serverPackage.devDependencies || {};
    this.analysis.server.total = Object.keys(this.analysis.server.dependencies).length + 
                                  Object.keys(this.analysis.server.devDependencies).length;

    // Find shared dependencies
    const clientDeps = Object.keys(this.analysis.client.dependencies);
    const serverDeps = Object.keys(this.analysis.server.dependencies);
    this.analysis.shared = clientDeps.filter(dep => serverDeps.includes(dep));

    // Find potential redundancies
    this.findRedundancies();

    console.log('✅ Dependency analysis completed');
  }

  findRedundancies() {
    const clientDeps = this.analysis.client.dependencies;
    
    // Check for radix-ui redundancy
    const radixComponents = Object.keys(clientDeps).filter(dep => dep.startsWith('@radix-ui/'));
    if (radixComponents.length > 0 && clientDeps['radix-ui']) {
      this.analysis.redundant.push({
        type: 'redundant-package',
        package: 'radix-ui',
        reason: 'Individual @radix-ui components already included',
        recommendation: 'Remove radix-ui package'
      });
    }

    // Check for shadcn-ui redundancy
    if (clientDeps['shadcn-ui'] && radixComponents.length > 0) {
      this.analysis.redundant.push({
        type: 'potential-redundancy',
        package: 'shadcn-ui',
        reason: 'May be redundant with individual component usage',
        recommendation: 'Verify if needed with current setup'
      });
    }

    // Check for server-side redundancies
    const serverDeps = this.analysis.server.dependencies;
    if (serverDeps['nodemon']) {
      this.analysis.redundant.push({
        type: 'misplaced-dependency',
        package: 'nodemon',
        reason: 'Development tool in production dependencies',
        recommendation: 'Move to devDependencies'
      });
    }
  }

  generateMermaidGraph() {
    let mermaid = `graph TD
    subgraph "CyberFlow Application"
        subgraph "Frontend (React 19.1.0)"
            A[React App] --> B[UI Framework]
            A --> C[State Management]
            A --> D[Data & Communication]
            A --> E[Visualization]
            
            B --> B1[@radix-ui components]
            B --> B2[TailwindCSS 4.1.4]
            B --> B3[Lucide Icons]
            
            C --> C1[React Router DOM]
            C --> C2[Next Themes]
            
            D --> D1[Axios HTTP]
            D --> D2[Socket.io Client]
            D --> D3[AI SDK]
            
            E --> E1[Recharts]
            E --> E2[D3.js]
        end
        
        subgraph "Backend (Node.js)"
            F[Express Server] --> G[Core Framework]
            F --> H[Authentication]
            F --> I[External Services]
            F --> J[Utilities]
            
            G --> G1[Express 5.1.0]
            G --> G2[MongoDB Mongoose]
            G --> G3[Socket.io Server]
            
            H --> H1[JWT]
            H --> H2[Express Validator]
            H --> H3[CORS]
            
            I --> I1[Google AI Gemini]
            I --> I2[Cloudinary]
            I --> I3[Nodemailer]
            I --> I4[Web Push]
            
            J --> J1[Date-fns]
            J --> J2[Multer]
            J --> J3[PDFKit]
        end
    end
    
    D2 -.-> G3
    D1 -.-> F
    `;

    return mermaid;
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        clientDependencies: this.analysis.client.total,
        serverDependencies: this.analysis.server.total,
        sharedDependencies: this.analysis.shared.length,
        redundantPackages: this.analysis.redundant.length
      },
      details: this.analysis,
      recommendations: this.generateRecommendations(),
      mermaidGraph: this.generateMermaidGraph()
    };

    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    // Redundancy recommendations
    this.analysis.redundant.forEach(item => {
      recommendations.push({
        priority: 'medium',
        category: 'optimization',
        action: item.recommendation,
        reason: item.reason,
        package: item.package
      });
    });

    // Size optimization recommendations
    const largeDeps = ['d3', 'recharts', '@google/generative-ai'];
    largeDeps.forEach(dep => {
      if (this.analysis.client.dependencies[dep] || this.analysis.server.dependencies[dep]) {
        recommendations.push({
          priority: 'low',
          category: 'performance',
          action: `Consider lazy loading or tree shaking for ${dep}`,
          reason: 'Large bundle size impact',
          package: dep
        });
      }
    });

    // Security recommendations
    recommendations.push({
      priority: 'high',
      category: 'security',
      action: 'Run npm audit regularly',
      reason: 'Maintain security posture',
      package: 'all'
    });

    return recommendations;
  }

  saveReport(report) {
    const outputPath = path.join(__dirname, '../dependency-report.json');
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`✅ Dependency report saved to: ${outputPath}`);
  }

  run() {
    console.log('🔍 Starting dependency analysis...');
    this.loadPackageFiles();
    this.analyzeDependencies();
    
    const report = this.generateReport();
    this.saveReport(report);
    
    console.log('\n📊 Analysis Summary:');
    console.log(`   Client Dependencies: ${report.summary.clientDependencies}`);
    console.log(`   Server Dependencies: ${report.summary.serverDependencies}`);
    console.log(`   Shared Dependencies: ${report.summary.sharedDependencies}`);
    console.log(`   Optimization Opportunities: ${report.summary.redundantPackages}`);
    
    if (report.details.redundant.length > 0) {
      console.log('\n⚠️  Optimization Opportunities:');
      report.details.redundant.forEach(item => {
        console.log(`   • ${item.package}: ${item.reason}`);
      });
    }
    
    console.log('\n✅ Dependency analysis completed successfully!');
  }
}

// Run the analyzer
if (require.main === module) {
  const analyzer = new DependencyAnalyzer();
  analyzer.run();
}

module.exports = DependencyAnalyzer;
