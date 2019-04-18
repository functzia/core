const path = require('path');
const install = require('@fofx/install');
const { createLogger } = require('@fofx/logger');
const { map, keyBy } = require('lodash');

const normalizeSpec = pluginsSpecs =>
  pluginsSpecs.map(spec => (typeof spec === 'string' ? { name: spec } : spec));

const requirePluginFactory = (pluginsDir, plugin) =>
  require(path.join(pluginsDir, 'node_modules', plugin));

function importPlugin(pluginsModules, pluginSpec, name, log) {
  const pluginFactory = requirePluginFactory(pluginsModules, name);
  const config = pluginSpec.params || {};
  return pluginFactory(config, log.scoped(name));
}

async function getPluginsByType(
  modulesDir,
  pluginsSpecs,
  log = createLogger(),
  installModules = true
) {
  pluginsSpecs = normalizeSpec(pluginsSpecs);
  const specNames = map(pluginsSpecs, 'name');
  if (installModules) {
    log.info(`Installing ${specNames.length} plugins...`);
  }
  const pluginsModules = path.join(modulesDir, 'plugins');
  const manifests = await install(pluginsModules, specNames, installModules);
  const plugins = manifests.map(({ name }, idx) =>
    importPlugin(pluginsModules, pluginsSpecs[idx], name, log)
  );
  const pluginsByType = keyBy(plugins, 'type');
  return pluginsByType;
}

module.exports = getPluginsByType;
