#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar'); // You'll need to install this: npm install chokidar

class LiveArchitectureVisualizer {
    constructor() {
        this.projectPath = process.cwd();
        this.isWatching = false;
        this.lastUpdate = new Date();
        this.architecture = {
            components: new Map(),
            pages: new Map(),
            api: new Map(),
            models: new Map(),
            utils: new Map(),
            dependencies: new Map()
        };

        // Color codes for terminal output
        this.colors = {
            reset: '\x1b[0m',
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            magenta: '\x1b[35m',
            cyan: '\x1b[36m',
            white: '\x1b[37m',
            gray: '\x1b[90m',
            bright: '\x1b[1m'
        };

        this.icons = {
            add: '➕',
            update: '🔄',
            delete: '❌',
            component: '⚛️',
            page: '📄',
            api: '🔌',
            model: '📊',
            util: '🛠️',
            watching: '👀',
            live: '🔴'
        };
    }

    c(text, color) {
        return `${this.colors[color]}${text}${this.colors.reset}`;
    }

    clearScreen() {
        console.clear();
    }

    displayHeader() {
        const now = new Date().toLocaleTimeString();
        console.log(this.c(`
 ██▓     ██▓ ██▒   █▓▓█████     ▄▄▄       ██▀███   ▄████▄   ██░ ██ 
▓██▒    ▓██▒▓██░   █▒▓█   ▀    ▒████▄    ▓██ ▒ ██▒▒██▀ ▀█  ▓██░ ██▒
▒██░    ▒██▒ ▓██  █▒░▒███      ▒██  ▀█▄  ▓██ ░▄█ ▒▒▓█    ▄ ▒██▀▀██░
▒██░    ░██░  ▒██ █░░▒▓█  ▄    ░██▄▄▄▄██ ▒██▀▀█▄  ▒▓▓▄ ▄██▒░▓█ ░██ 
░██████▒░██░   ▒▀█░  ░▒████▒    ▓█   ▓██▒░██▓ ▒██▒▒ ▓███▀ ░░▓█▒░██▓
░ ▒░▓  ░░▓     ░ ▐░  ░░ ▒░ ░    ▒▒   ▓▒█░░ ▒▓ ░▒▓░░ ░▒ ▒  ░ ▒ ░░▒░▒
░ ░ ▒  ░ ▒ ░   ░ ░░   ░ ░  ░     ▒   ▒▒ ░  ░▒ ░ ▒░  ░  ▒    ▒ ░▒░ ░
  ░ ░    ▒ ░     ░░     ░        ░   ▒     ░░   ░ ░         ░  ░░ ░
    ░  ░ ░        ░     ░  ░         ░  ░   ░     ░ ░       ░  ░  ░
               ░                           ░                        
        `, 'cyan'));
        
        console.log(this.c(`                    🔴 REAL-TIME PROJECT ARCHITECTURE MONITOR`, 'red'));
        console.log(this.c(`                    ${this.icons.watching} Watching: ${this.projectPath}`, 'yellow'));
        console.log(this.c(`                    ⏰ Last Update: ${now}`, 'gray'));
        console.log('\n' + this.c('═'.repeat(100), 'gray') + '\n');
    }

    parseFileContent(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const fileInfo = {
                path: filePath,
                size: content.length,
                lines: content.split('\n').length,
                imports: [],
                exports: [],
                components: [],
                hooks: [],
                functions: [],
                lastModified: fs.statSync(filePath).mtime
            };

            // Parse imports
            const importRegex = /import\s+(?:(?:\{[^}]*\}|\w+|\*\s+as\s+\w+)(?:\s*,\s*(?:\{[^}]*\}|\w+))*)?\s+from\s+['"`]([^'"`]+)['"`]/g;
            let importMatch;
            while ((importMatch = importRegex.exec(content)) !== null) {
                fileInfo.imports.push(importMatch[1]);
            }

            // Parse exports
            const exportRegex = /export\s+(?:default\s+)?(?:function|const|class|interface)\s+(\w+)/g;
            let exportMatch;
            while ((exportMatch = exportRegex.exec(content)) !== null) {
                fileInfo.exports.push(exportMatch[1]);
            }

            // Parse React components (functional)
            const componentRegex = /(?:const|function)\s+([A-Z][a-zA-Z0-9]*)\s*[=:]?\s*(?:\([^)]*\))?\s*(?::\s*React\.FC)?[^{]*=>\s*{|(?:function\s+([A-Z][a-zA-Z0-9]*)\s*\([^)]*\)\s*{)/g;
            let componentMatch;
            while ((componentMatch = componentRegex.exec(content)) !== null) {
                fileInfo.components.push(componentMatch[1] || componentMatch[2]);
            }

            // Parse hooks usage
            const hooksRegex = /use([A-Z][a-zA-Z0-9]*)/g;
            let hooksMatch;
            while ((hooksMatch = hooksRegex.exec(content)) !== null) {
                if (!fileInfo.hooks.includes(`use${hooksMatch[1]}`)) {
                    fileInfo.hooks.push(`use${hooksMatch[1]}`);
                }
            }

            // Parse API routes
            if (filePath.includes('/api/')) {
                const methodRegex = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)/g;
                let methodMatch;
                while ((methodMatch = methodRegex.exec(content)) !== null) {
                    fileInfo.functions.push(methodMatch[1]);
                }
            }

            return fileInfo;
        } catch (error) {
            return null;
        }
    }

    analyzeFile(filePath, eventType = 'update') {
        const fileInfo = this.parseFileContent(filePath);
        if (!fileInfo) return;

        const relativePath = path.relative(this.projectPath, filePath);
        const category = this.categorizeFile(relativePath);
        
        // Store in appropriate category
        this.architecture[category].set(relativePath, {
            ...fileInfo,
            category,
            eventType,
            timestamp: new Date()
        });

        // Real-time update display
        this.displayRealTimeUpdate(relativePath, eventType, category);
    }

    categorizeFile(filePath) {
        if (filePath.includes('components/') && filePath.endsWith('.tsx')) return 'components';
        if (filePath.includes('app/') && (filePath.endsWith('.tsx') || filePath.endsWith('page.tsx'))) return 'pages';
        if (filePath.includes('/api/') && filePath.endsWith('.ts')) return 'api';
        if (filePath.includes('models/') && filePath.endsWith('.ts')) return 'models';
        if (filePath.includes('utils/') && filePath.endsWith('.ts')) return 'utils';
        return 'utils';
    }

    displayRealTimeUpdate(filePath, eventType, category) {
        const icon = eventType === 'add' ? this.icons.add : 
                    eventType === 'unlink' ? this.icons.delete : this.icons.update;
        const color = eventType === 'add' ? 'green' : 
                     eventType === 'unlink' ? 'red' : 'yellow';
        
        const categoryIcon = {
            components: this.icons.component,
            pages: this.icons.page,
            api: this.icons.api,
            models: this.icons.model,
            utils: this.icons.util
        }[category];

        const timestamp = new Date().toLocaleTimeString();
        console.log(`${this.c(timestamp, 'gray')} ${icon} ${categoryIcon} ${this.c(filePath, color)} (${eventType})`);
    }

    generateLiveDiagram() {
        this.clearScreen();
        this.displayHeader();

        // Real-time statistics
        const stats = {
            components: this.architecture.components.size,
            pages: this.architecture.pages.size,
            api: this.architecture.api.size,
            models: this.architecture.models.size,
            utils: this.architecture.utils.size,
            total: Array.from(this.architecture.components.values()).reduce((sum, file) => sum + file.lines, 0) +
                   Array.from(this.architecture.pages.values()).reduce((sum, file) => sum + file.lines, 0) +
                   Array.from(this.architecture.api.values()).reduce((sum, file) => sum + file.lines, 0) +
                   Array.from(this.architecture.models.values()).reduce((sum, file) => sum + file.lines, 0) +
                   Array.from(this.architecture.utils.values()).reduce((sum, file) => sum + file.lines, 0)
        };

        // Live Architecture Overview
        console.log(this.c('🏗️  LIVE ARCHITECTURE OVERVIEW', 'bright'));
        console.log('');

        const overview = `
    ${this.c('┌─────────────────────────────────────────────────────────────────────────────────────────┐', 'cyan')}
    ${this.c('│', 'cyan')} ${this.c('📊 REAL-TIME STATISTICS', 'white')}                                                      ${this.c('│', 'cyan')}
    ${this.c('├─────────────────────────────────────────────────────────────────────────────────────────┤', 'cyan')}
    ${this.c('│', 'cyan')} ${this.c('Components:', 'yellow')} ${this.c(stats.components.toString().padEnd(5), 'green')} │ ${this.c('Pages:', 'yellow')} ${this.c(stats.pages.toString().padEnd(5), 'green')} │ ${this.c('API Routes:', 'yellow')} ${this.c(stats.api.toString().padEnd(5), 'green')} ${this.c('│', 'cyan')}
    ${this.c('│', 'cyan')} ${this.c('Models:', 'yellow')} ${this.c(stats.models.toString().padEnd(8), 'green')} │ ${this.c('Utils:', 'yellow')} ${this.c(stats.utils.toString().padEnd(5), 'green')} │ ${this.c('Total Lines:', 'yellow')} ${this.c(stats.total.toString().padEnd(5), 'green')} ${this.c('│', 'cyan')}
    ${this.c('└─────────────────────────────────────────────────────────────────────────────────────────┘', 'cyan')}
        `;

        console.log(overview);

        // Live Component Tree
        this.displayLiveComponentTree();

        // Live Data Flow
        this.displayLiveDataFlow();

        // Recent Changes
        this.displayRecentChanges();

        // System Health
        this.displaySystemHealth();
    }

    displayLiveComponentTree() {
        console.log(this.c('\n🌳  LIVE COMPONENT TREE', 'bright'));
        console.log('');

        // Components
        if (this.architecture.components.size > 0) {
            console.log(`${this.icons.component} ${this.c('COMPONENTS', 'blue')} (${this.architecture.components.size})`);
            Array.from(this.architecture.components.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .slice(0, 10) // Show only first 10 to avoid cluttering
                .forEach(([filePath, fileInfo]) => {
                    const fileName = path.basename(filePath, '.tsx');
                    const status = this.getFileStatus(fileInfo);
                    console.log(`  ├─ ${status} ${fileName} ${this.c(`(${fileInfo.lines} lines)`, 'gray')}`);
                });
            if (this.architecture.components.size > 10) {
                console.log(`  └─ ${this.c(`... and ${this.architecture.components.size - 10} more`, 'gray')}`);
            }
            console.log('');
        }

        // API Routes
        if (this.architecture.api.size > 0) {
            console.log(`${this.icons.api} ${this.c('API ROUTES', 'green')} (${this.architecture.api.size})`);
            Array.from(this.architecture.api.entries()).forEach(([filePath, fileInfo]) => {
                const routeName = path.basename(filePath, '.ts');
                const methods = fileInfo.functions.join(', ') || 'GET';
                console.log(`  ├─ ${routeName} ${this.c(`[${methods}]`, 'yellow')}`);
            });
            console.log('');
        }
    }

    displayLiveDataFlow() {
        console.log(this.c('🔄  LIVE DATA FLOW ANALYSIS', 'bright'));
        console.log('');

        const dataFlow = `
    ${this.c('USER', 'cyan')} → ${this.c('COMPONENTS', 'blue')} → ${this.c('API ROUTES', 'green')} → ${this.c('APPWRITE', 'red')} → ${this.c('DATABASE', 'magenta')}
       │           │              │              │                │
       ▼           ▼              ▼              ▼                ▼
    Input      State Mgmt     HTTP Calls     SDK Calls       Data Store
    Events     Validation     Error Handle   Auth Check      Persistence
    UI Update  Loading        JSON Parse     File Upload     Relationships
        `;

        console.log(dataFlow);
    }

    displayRecentChanges() {
        console.log(this.c('📝  RECENT CHANGES (Last 5)', 'bright'));
        console.log('');

        const allFiles = [
            ...Array.from(this.architecture.components.values()),
            ...Array.from(this.architecture.pages.values()),
            ...Array.from(this.architecture.api.values()),
            ...Array.from(this.architecture.models.values()),
            ...Array.from(this.architecture.utils.values())
        ];

        const recentChanges = allFiles
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5);

        recentChanges.forEach((file, index) => {
            const fileName = path.basename(file.path);
            const timeAgo = this.getTimeAgo(file.timestamp);
            const eventIcon = file.eventType === 'add' ? this.icons.add : 
                            file.eventType === 'unlink' ? this.icons.delete : this.icons.update;
            console.log(`  ${index + 1}. ${eventIcon} ${fileName} ${this.c(`(${timeAgo})`, 'gray')}`);
        });
        console.log('');
    }

    displaySystemHealth() {
        console.log(this.c('💚  SYSTEM HEALTH', 'bright'));
        console.log('');

        const totalFiles = this.architecture.components.size + 
                          this.architecture.pages.size + 
                          this.architecture.api.size + 
                          this.architecture.models.size + 
                          this.architecture.utils.size;

        const health = totalFiles > 0 ? 'HEALTHY' : 'NO FILES DETECTED';
        const healthColor = totalFiles > 0 ? 'green' : 'red';

        console.log(`  ${this.c('Status:', 'white')} ${this.c(health, healthColor)}`);
        console.log(`  ${this.c('Files Tracked:', 'white')} ${this.c(totalFiles, 'green')}`);
        console.log(`  ${this.c('Watching:', 'white')} ${this.c(this.isWatching ? 'ACTIVE' : 'INACTIVE', this.isWatching ? 'green' : 'red')}`);
        console.log('');
    }

    getFileStatus(fileInfo) {
        const age = Date.now() - fileInfo.timestamp;
        if (age < 5000) return this.c('🔥', 'red'); // Very recent
        if (age < 30000) return this.c('🆕', 'yellow'); // Recent
        return this.c('📄', 'gray'); // Normal
    }

    getTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        return `${Math.floor(seconds / 3600)}h ago`;
    }

    async startWatching() {
        console.log(this.c('🚀 Starting Live Architecture Monitor...', 'yellow'));
        
        // Check if chokidar is available
        try {
            const chokidar = require('chokidar');
        } catch (error) {
            console.log(this.c('\n❌ Missing dependency: chokidar', 'red'));
            console.log(this.c('📦 Please install it by running:', 'yellow'));
            console.log(this.c('   npm install chokidar', 'cyan'));
            console.log(this.c('\n🔄 Then run this command again!', 'green'));
            return;
        }

        const chokidar = require('chokidar');

        // Initial scan
        this.initialScan();
        
        // Start watching
        const watcher = chokidar.watch(['src/**/*.{ts,tsx,js,jsx}'], {
            ignored: /node_modules|\.git/,
            persistent: true,
            ignoreInitial: true
        });

        this.isWatching = true;

        watcher
            .on('add', (filePath) => {
                this.analyzeFile(filePath, 'add');
                this.generateLiveDiagram();
            })
            .on('change', (filePath) => {
                this.analyzeFile(filePath, 'change');
                this.generateLiveDiagram();
            })
            .on('unlink', (filePath) => {
                const relativePath = path.relative(this.projectPath, filePath);
                const category = this.categorizeFile(relativePath);
                this.architecture[category].delete(relativePath);
                this.displayRealTimeUpdate(relativePath, 'unlink', category);
                this.generateLiveDiagram();
            });

        // Initial display
        this.generateLiveDiagram();

        console.log(this.c('\n👀 Watching for changes... (Press Ctrl+C to stop)', 'cyan'));

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log(this.c('\n\n🛑 Stopping Live Architecture Monitor...', 'yellow'));
            watcher.close();
            console.log(this.c('👋 Goodbye!', 'green'));
            process.exit(0);
        });

        // Periodic refresh (every 30 seconds)
        setInterval(() => {
            if (this.isWatching) {
                this.generateLiveDiagram();
            }
        }, 30000);
    }

    initialScan() {
        console.log(this.c('🔍 Performing initial project scan...', 'yellow'));
        
        const scanDir = (dir) => {
            try {
                const items = fs.readdirSync(dir);
                items.forEach(item => {
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);
                    
                    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                        scanDir(fullPath);
                    } else if (stat.isFile() && /\.(ts|tsx|js|jsx)$/.test(item)) {
                        this.analyzeFile(fullPath, 'scan');
                    }
                });
            } catch (error) {
                // Ignore errors for directories we can't read
            }
        };

        if (fs.existsSync(path.join(this.projectPath, 'src'))) {
            scanDir(path.join(this.projectPath, 'src'));
        }

        console.log(this.c('✅ Initial scan complete!', 'green'));
    }

    static async createLiveMonitor() {
        const monitor = new LiveArchitectureVisualizer();
        await monitor.startWatching();
        return monitor;
    }
}

// CLI Interface
const args = process.argv.slice(2);
const command = args[0];

if (command === '--help' || command === '-h') {
    console.log(`
🔴 Live Architecture Monitor

Usage:
  node live-architecture.js [options]

Options:
  --help, -h     Show this help message
  --version, -v  Show version
  
Commands:
  (no command)   Start live monitoring
  
Examples:
  node live-architecture.js              Start live monitoring
  node live-architecture.js --help       Show help

Features:
  🔴 Real-time file watching
  📊 Live statistics
  🌳 Dynamic component tree
  🔄 Live data flow analysis
  📝 Recent changes tracking
  💚 System health monitoring
    `);
} else if (command === '--version' || command === '-v') {
    console.log('Live Architecture Monitor v1.0.0');
} else {
    // Start live monitoring
    console.log(`
🔴 LIVE ARCHITECTURE MONITOR
Real-time project visualization - Just like Tailwind JIT!

Installing required dependencies if needed...
    `);
    
    LiveArchitectureVisualizer.createLiveMonitor().catch(console.error);
}

module.exports = LiveArchitectureVisualizer;
