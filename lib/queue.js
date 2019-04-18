module.exports = function getNanosQueue(invokeNano) {
  const outputs = {};
  return {
    getTrigger(nano) {
      return (...args) =>
        invokeNano({ nano, args })
          .then(value => {
            if (outputs[nano]) {
              outputs[nano](value);
            }
            return { ok: true, value };
          })
          .catch(error => ({ ok: false, error }));
    },
    registerOutput(nano, handler) {
      outputs[nano] = handler;
    },
  };
};
