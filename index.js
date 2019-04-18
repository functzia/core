const EventEmitter = require('events');
const { createLogger } = require('@fofx/logger');
const { local, distributed } = require('@fofx/queue');

const { loadNanos, fetchNanos } = require('./lib/nanos');
const getQueue = require('./lib/queue');
const getPluginsByType = require('./lib/plugins');
const startWorker = require('./worker');

module.exports = async function startMaster({
  log = createLogger(),
  fofxConfig,
  modulesDir,
  port,
  install = true,
}) {
  const { plugins, nanos: nanosConfig } = fofxConfig;
  const broker = port ? port : new EventEmitter();
  const env = port ? distributed : local;
  const { invokeNano } = env.startQueueBroker(broker);
  const nq = getQueue(invokeNano);
  const pluginsByType = await getPluginsByType(
    modulesDir,
    plugins,
    log.scoped('plugins'),
    install
  );
  const nanos = await (port
    ? fetchNanos(modulesDir, nanosConfig, log.scoped('nanos'), install)
    : startWorker({ log, fofxConfig, modulesDir, broker, install }));
  loadNanos(nanos, pluginsByType, nq, log);
};
