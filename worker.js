const { local, distributed } = require('@fofx/queue');
const { createLogger } = require('@fofx/logger');
const { fetchNanos } = require('./lib/nanos');
const stateFactory = require('./lib/state');

module.exports = async function startWorker({
  log = createLogger(),
  fofxConfig,
  modulesDir,
  broker,
  install = true,
}) {
  const { nanos: nanosConfig } = fofxConfig;
  const env = typeof broker === 'string' ? distributed : local;
  const client = env.startQueueWorker(broker);
  const nanos = await fetchNanos(
    modulesDir,
    nanosConfig,
    log.scoped('nanos'),
    install
  );
  const apps = nanos.reduce(
    (map, { nano, app, config }) =>
      Object.assign(map, { [nano]: { app, useState: config.useState } }),
    {}
  );
  const getNanoState = stateFactory(client);
  client.register(async function invokeNano({ nano, args }) {
    const { app, useState } = apps[nano];
    try {
      const ctx = { log: log.scoped(nano) };
      if (useState) {
        ctx.state = getNanoState(nano);
      }
      const value = await app.call(ctx, ...args);
      return value;
    } catch (error) {
      log.error(error);
      throw error;
    }
  });
  return nanos;
};
