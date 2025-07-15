const axios = require('axios');

class Logger {
  constructor(testServerUrl = 'http://localhost:3000') {
    this.testServerUrl = testServerUrl;
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  async log(stack, level, packageName, message) {
    const logData = {
      stack,
      level,
      package: packageName,
      message,
      timestamp: new Date().toISOString()
    };

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        await axios.post(`${this.testServerUrl}/api/logs`, logData, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        return;
      } catch (error) {
        console.error(`Log attempt ${attempt} failed:`, error.message);
        
        if (attempt === this.retryAttempts) {
          console.error('Failed to send log after all retry attempts:', logData);
        } else {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Convenience methods for different log levels
  error(stack, packageName, message) {
    return this.log(stack, 'error', packageName, message);
  }

  fatal(stack, packageName, message) {
    return this.log(stack, 'fatal', packageName, message);
  }

  warn(stack, packageName, message) {
    return this.log(stack, 'warn', packageName, message);
  }

  info(stack, packageName, message) {
    return this.log(stack, 'info', packageName, message);
  }

  debug(stack, packageName, message) {
    return this.log(stack, 'debug', packageName, message);
  }
}

module.exports = Logger;
