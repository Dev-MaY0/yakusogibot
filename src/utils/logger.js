const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const errorLogPath = path.join(logDir, 'error.log');

module.exports = {
  info: (msg) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${msg}`);
  },
  warn: (msg) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`);
  },
  error: (msg, error) => {
    const errorMsg = `[ERROR] ${new Date().toISOString()} - ${msg}\n${error?.stack || error}\n`;
    console.error(errorMsg);
    fs.appendFileSync(errorLogPath, errorMsg, 'utf8');
  }
};
