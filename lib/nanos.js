const path = require('path');
const install = require('@fofx/install');
const { createLogger } = require('@fofx/logger');

async function fetchNanos(
  modulesDir,
  nanos,
  log = createLogger(),
  installModules = true
) {
  if (installModules) {
    log.info(`Installing ${nanos.length} nanos...`);
  }
  const nanosModules = path.join(modulesDir, 'nanos');
  const manifests = await install(nanosModules, nanos, installModules);
  return manifests.map(({ name: nano }) => {
    const modulePath = path.join(nanosModules, 'node_modules', nano);
    const { fofx: config } = require(modulePath + '/package.json');
    const app = require(modulePath);
    return { nano, config, app };
  });
}

function loadNanos(nanos, pluginsByType, nanosQueue, log = createLogger()) {
  for (const { nano, config } of nanos) {
    const inputPlugin = pluginsByType[config.input.type];
    if (!inputPlugin || !inputPlugin.input) {
      throw new Error(`Input type "${config.input.type}" not found.`);
    }
    inputPlugin.input(config.input, nanosQueue.getTrigger(nano));
    if (config.output) {
      const outputPlugin = pluginsByType[config.output.type];
      if (!outputPlugin || !outputPlugin.output) {
        throw new Error(`Output type "${config.output.type}" not found.`);
      }
      const outputHandler = outputPlugin.output(config.output);
      nanosQueue.registerOutput(nano, outputHandler);
    }
    log.debug(`Nano ${nano} loaded`);
  }
}

module.exports = { loadNanos, fetchNanos };
