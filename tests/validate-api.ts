#!/usr/bin/env node

/**
 * Rohlik API Validator
 *
 * This script validates that the Rohlik API endpoints are working correctly.
 * It tests all endpoints used by the MCP server and provides detailed logging.
 *
 * Usage:
 *   npm run validate-api
 *
 * Or with custom config:
 *   ROHLIK_USERNAME=user@example.com ROHLIK_PASSWORD=pass ROHLIK_BASE_URL=https://www.rohlik.cz npm run validate-api
 */

import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  endpoint: string;
  method: string;
  success: boolean;
  status?: number;
  httpStatus?: number;
  error?: string;
  responseData?: any;
  duration: number;
}

interface ValidationConfig {
  username: string;
  password: string;
  baseUrl: string;
}

class RohlikAPIValidator {
  private config: ValidationConfig;
  private sessionCookies: string = '';
  private userId?: number;
  private addressId?: number;
  private results: TestResult[] = [];

  constructor(config: ValidationConfig) {
    this.config = config;
  }

  private log(message: string, data?: any) {
    console.log(`[${new Date().toISOString()}] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  private async makeRequest(
    endpoint: string,
    options: any = {}
  ): Promise<{ response: any; httpStatus: number; duration: number }> {
    const startTime = Date.now();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      ...(this.sessionCookies && { Cookie: this.sessionCookies }),
      ...(options.headers || {})
    };

    this.log(`→ ${options.method || 'GET'} ${endpoint}`, {
      headers,
      body: options.body
    });

    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      ...options,
      headers
    });

    const duration = Date.now() - startTime;

    // Store cookies
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      this.sessionCookies = setCookieHeader;
      this.log(`  Cookies received: ${setCookieHeader.substring(0, 100)}...`);
    }

    const httpStatus = response.status;
    this.log(`← HTTP ${httpStatus} (${duration}ms)`);

    let responseData;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      responseData = await response.json();
      this.log(`  Response:`, responseData);
    } else {
      const text = await response.text();
      this.log(`  Response (non-JSON): ${text.substring(0, 200)}...`);
      responseData = { rawText: text };
    }

    return { response: responseData, httpStatus, duration };
  }

  private async testEndpoint(
    name: string,
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<TestResult> {
    this.log(`\n${'='.repeat(80)}`);
    this.log(`Testing: ${name}`);
    this.log(`${'='.repeat(80)}`);

    try {
      const { response, httpStatus, duration } = await this.makeRequest(endpoint, {
        method,
        ...(body && { body: JSON.stringify(body) })
      });

      const success = httpStatus >= 200 && httpStatus < 300;

      const result: TestResult = {
        endpoint,
        method,
        success,
        httpStatus,
        status: response.status,
        duration,
        responseData: response
      };

      if (success) {
        this.log(`✓ ${name} succeeded`);
      } else {
        this.log(`✗ ${name} failed`);
        result.error = `HTTP ${httpStatus}`;
      }

      this.results.push(result);
      return result;
    } catch (error) {
      this.log(`✗ ${name} threw error:`, error);

      const result: TestResult = {
        endpoint,
        method,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: 0
      };

      this.results.push(result);
      return result;
    }
  }

  async validate(): Promise<boolean> {
    this.log('\n' + '🔍 ROHLIK API VALIDATOR'.padStart(50, '=').padEnd(80, '='));
    this.log(`Base URL: ${this.config.baseUrl}`);
    this.log(`Username: ${this.config.username}`);
    this.log(`Password: ${'*'.repeat(this.config.password.length)}`);

    // Test 1: Login
    const loginResult = await this.testEndpoint(
      'Login',
      '/services/frontend-service/login',
      'POST',
      {
        email: this.config.username,
        password: this.config.password,
        name: ''
      }
    );

    if (!loginResult.success) {
      this.log('\n❌ LOGIN FAILED - Cannot continue with other tests');
      this.printSummary();
      return false;
    }

    // Extract user data from login
    this.userId = loginResult.responseData?.data?.user?.id;
    this.addressId = loginResult.responseData?.data?.address?.id;

    if (!this.userId) {
      this.log('\n⚠️  WARNING: No user ID found in login response');
    } else {
      this.log(`\n✓ Logged in successfully. User ID: ${this.userId}, Address ID: ${this.addressId}`);
    }

    // Test 2: Search products
    await this.testEndpoint(
      'Search Products',
      '/services/frontend-service/search-metadata?' + new URLSearchParams({
        search: 'mléko',
        offset: '0',
        limit: '5',
        companyId: '1',
        filterData: JSON.stringify({ filters: [] }),
        canCorrect: 'true'
      })
    );

    // Test 3: Get cart
    await this.testEndpoint(
      'Get Cart',
      '/services/frontend-service/v2/cart'
    );

    // Test 4: Account data endpoints
    await this.testEndpoint(
      'Get Delivery Info',
      '/services/frontend-service/first-delivery?reasonableDeliveryTime=true'
    );

    await this.testEndpoint(
      'Get Upcoming Orders',
      '/api/v3/orders/upcoming'
    );

    await this.testEndpoint(
      'Get Announcements',
      '/services/frontend-service/announcements/top'
    );

    await this.testEndpoint(
      'Get Reusable Bags',
      '/api/v1/reusable-bags/user-info'
    );

    await this.testEndpoint(
      'Get Premium Profile',
      '/services/frontend-service/premium/profile'
    );

    await this.testEndpoint(
      'Get Order History',
      '/api/v3/orders/delivered?offset=0&limit=5'
    );

    // Test 5: Delivery slots (requires userId and addressId)
    if (this.userId && this.addressId) {
      await this.testEndpoint(
        'Get Delivery Slots',
        `/services/frontend-service/timeslots-api/0?userId=${this.userId}&addressId=${this.addressId}&reasonableDeliveryTime=true`
      );
    } else {
      this.log('\n⚠️  Skipping delivery slots test (no user/address ID)');
    }

    // Test 6: Logout
    await this.testEndpoint(
      'Logout',
      '/services/frontend-service/logout',
      'POST'
    );

    // Print summary
    this.printSummary();

    return this.results.every(r => r.success);
  }

  private printSummary() {
    this.log('\n' + '📊 VALIDATION SUMMARY'.padStart(50, '=').padEnd(80, '='));

    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const total = this.results.length;

    this.log(`\nTotal tests: ${total}`);
    this.log(`✓ Successful: ${successful}`);
    this.log(`✗ Failed: ${failed}`);
    this.log(`Success rate: ${((successful / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      this.log('\n❌ FAILED TESTS:');
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          this.log(`  • ${r.endpoint}`);
          this.log(`    Method: ${r.method}`);
          this.log(`    HTTP Status: ${r.httpStatus || 'N/A'}`);
          this.log(`    Response Status: ${r.status || 'N/A'}`);
          this.log(`    Error: ${r.error || 'Unknown'}`);
          if (r.responseData) {
            this.log(`    Response:`, r.responseData);
          }
        });
    }

    // Write detailed results to file
    const resultsFile = path.join(process.cwd(), 'test-tools', 'validation-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(this.results, null, 2));
    this.log(`\n📄 Detailed results written to: ${resultsFile}`);

    // Generate HTML report
    const htmlFile = path.join(process.cwd(), 'test-tools', 'validation-report.html');
    const html = this.generateHTMLReport();
    fs.writeFileSync(htmlFile, html);
    this.log(`📄 HTML report written to: ${htmlFile}`);
  }

  private generateHTMLReport(): string {
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const total = this.results.length;
    const successRate = ((successful / total) * 100).toFixed(1);

    const timestamp = new Date().toISOString();
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rohlik API Validation Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }

        .header .timestamp {
            opacity: 0.9;
            font-size: 0.9em;
        }

        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 40px;
            background: #fafafa;
        }

        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .summary-card .value {
            font-size: 2.5em;
            font-weight: bold;
            margin: 10px 0;
        }

        .summary-card .label {
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .summary-card.success .value { color: #10b981; }
        .summary-card.failed .value { color: #ef4444; }
        .summary-card.rate .value { color: #3b82f6; }
        .summary-card.duration .value { font-size: 2em; }

        .results {
            padding: 40px;
        }

        .results h2 {
            font-size: 1.8em;
            margin-bottom: 20px;
            color: #333;
        }

        .test-result {
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
            transition: all 0.2s;
        }

        .test-result:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transform: translateY(-2px);
        }

        .test-result.success {
            border-left: 4px solid #10b981;
        }

        .test-result.failed {
            border-left: 4px solid #ef4444;
            background: #fef2f2;
        }

        .test-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
        }

        .test-method {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: bold;
            margin-right: 10px;
        }

        .test-method.GET { background: #dbeafe; color: #1e40af; }
        .test-method.POST { background: #dcfce7; color: #166534; }
        .test-method.DELETE { background: #fee2e2; color: #991b1b; }

        .test-endpoint {
            flex: 1;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            word-break: break-all;
        }

        .test-status {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .status-badge {
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 0.85em;
            font-weight: 600;
        }

        .status-badge.success {
            background: #d1fae5;
            color: #065f46;
        }

        .status-badge.failed {
            background: #fee2e2;
            color: #991b1b;
        }

        .duration {
            color: #6b7280;
            font-size: 0.85em;
        }

        .test-details {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
        }

        .detail-row {
            display: flex;
            padding: 5px 0;
            font-size: 0.9em;
        }

        .detail-label {
            font-weight: 600;
            color: #6b7280;
            min-width: 120px;
        }

        .detail-value {
            font-family: 'Courier New', monospace;
            color: #333;
        }

        .error-message {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 4px;
            padding: 10px;
            margin-top: 10px;
            color: #991b1b;
            font-family: 'Courier New', monospace;
            font-size: 0.85em;
        }

        .response-data {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            padding: 15px;
            margin-top: 10px;
            max-height: 300px;
            overflow: auto;
        }

        .response-data pre {
            font-family: 'Courier New', monospace;
            font-size: 0.8em;
            white-space: pre-wrap;
            word-wrap: break-word;
        }

        .footer {
            background: #f9fafb;
            padding: 20px 40px;
            text-align: center;
            color: #6b7280;
            font-size: 0.9em;
        }

        .config-info {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 8px;
            padding: 20px;
            margin: 0 40px 20px 40px;
        }

        .config-info h3 {
            color: #0369a1;
            margin-bottom: 10px;
        }

        .config-row {
            display: flex;
            padding: 5px 0;
            font-size: 0.9em;
        }

        .config-label {
            font-weight: 600;
            color: #0369a1;
            min-width: 120px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Rohlik API Validation Report</h1>
            <div class="timestamp">Generated: ${timestamp}</div>
        </div>

        <div class="config-info">
            <h3>Configuration</h3>
            <div class="config-row">
                <div class="config-label">Base URL:</div>
                <div>${this.config.baseUrl}</div>
            </div>
            <div class="config-row">
                <div class="config-label">Username:</div>
                <div>${this.config.username}</div>
            </div>
        </div>

        <div class="summary">
            <div class="summary-card success">
                <div class="label">Successful</div>
                <div class="value">✓ ${successful}</div>
            </div>
            <div class="summary-card failed">
                <div class="label">Failed</div>
                <div class="value">✗ ${failed}</div>
            </div>
            <div class="summary-card rate">
                <div class="label">Success Rate</div>
                <div class="value">${successRate}%</div>
            </div>
            <div class="summary-card duration">
                <div class="label">Total Duration</div>
                <div class="value">${totalDuration}ms</div>
            </div>
        </div>

        <div class="results">
            <h2>Test Results</h2>
            ${this.results.map((result, index) => this.renderTestResult(result, index + 1)).join('\n')}
        </div>

        <div class="footer">
            <p>Rohlik MCP Server - API Validation Tool</p>
            <p>Generated by npm run validate-api</p>
        </div>
    </div>
</body>
</html>`;
  }

  private renderTestResult(result: TestResult, index: number): string {
    const statusClass = result.success ? 'success' : 'failed';
    const statusIcon = result.success ? '✓' : '✗';

    return `
            <div class="test-result ${statusClass}">
                <div class="test-header">
                    <div style="display: flex; align-items: center; flex: 1;">
                        <span class="test-method ${result.method}">${result.method}</span>
                        <span class="test-endpoint">${this.truncateEndpoint(result.endpoint)}</span>
                    </div>
                    <div class="test-status">
                        <span class="status-badge ${statusClass}">${statusIcon} ${result.success ? 'PASSED' : 'FAILED'}</span>
                        <span class="duration">${result.duration}ms</span>
                    </div>
                </div>

                <div class="test-details">
                    <div class="detail-row">
                        <div class="detail-label">HTTP Status:</div>
                        <div class="detail-value">${result.httpStatus || 'N/A'}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Response Status:</div>
                        <div class="detail-value">${result.status || 'N/A'}</div>
                    </div>

                    ${result.error ? `<div class="error-message">
                        <strong>Error:</strong> ${this.escapeHtml(result.error)}
                    </div>` : ''}

                    ${result.responseData && !result.success ? `
                    <details>
                        <summary style="cursor: pointer; padding: 10px 0; font-weight: 600; color: #666;">
                            Show Response Data
                        </summary>
                        <div class="response-data">
                            <pre>${this.escapeHtml(JSON.stringify(result.responseData, null, 2))}</pre>
                        </div>
                    </details>
                    ` : ''}
                </div>
            </div>`;
  }

  private truncateEndpoint(endpoint: string, maxLength: number = 80): string {
    if (endpoint.length <= maxLength) return endpoint;
    return endpoint.substring(0, maxLength - 3) + '...';
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

// Load config from environment or Claude Desktop config
function loadConfig(): ValidationConfig {
  // Try environment variables first
  if (process.env.ROHLIK_USERNAME && process.env.ROHLIK_PASSWORD) {
    return {
      username: process.env.ROHLIK_USERNAME,
      password: process.env.ROHLIK_PASSWORD,
      baseUrl: process.env.ROHLIK_BASE_URL || 'https://www.rohlik.cz'
    };
  }

  // Try to load from Claude Desktop config
  const configPath = process.argv[2] ||
    path.join(process.env.HOME || '', 'Library/Application Support/Claude/claude_desktop_config.json');

  try {
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const rohlikConfig = configData.mcpServers?.['rohlik-local'] || configData.mcpServers?.rohlik;

    if (rohlikConfig && rohlikConfig.env) {
      return {
        username: rohlikConfig.env.ROHLIK_USERNAME,
        password: rohlikConfig.env.ROHLIK_PASSWORD,
        baseUrl: rohlikConfig.env.ROHLIK_BASE_URL || 'https://www.rohlik.cz'
      };
    }
  } catch (error) {
    // Config file not found or invalid, continue to error
  }

  console.error('ERROR: Could not load Rohlik credentials.');
  console.error('');
  console.error('Please provide credentials in one of these ways:');
  console.error('  1. Environment variables:');
  console.error('     ROHLIK_USERNAME=user@example.com ROHLIK_PASSWORD=pass npm run validate-api');
  console.error('');
  console.error('  2. Path to Claude Desktop config:');
  console.error('     npm run validate-api ~/Library/Application\\ Support/Claude/claude_desktop_config.json');
  console.error('');
  process.exit(1);
}

// Main
async function main() {
  const config = loadConfig();
  const validator = new RohlikAPIValidator(config);
  const success = await validator.validate();
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
