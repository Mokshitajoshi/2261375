const Logger = require('./logger');

const logger = new Logger();

module.exports = {
  Logger,
  logger,
  log: (stack, level, packageName, message) => logger.log(stack, level, packageName, message)
};
