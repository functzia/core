class NanoState {
  constructor(client, key) {
    this._client = client;
    this._key = key;
  }

  async get() {
    return this._client.get(this._key, null);
  }

  async set(state) {
    return this._client.set(this._key, state);
  }
}

module.exports = function stateFactory(client) {
  const nanoStates = {};
  return nano => {
    if (!nanoStates[nano]) {
      nanoStates[nano] = new NanoState(client, nano);
    }
    return nanoStates[nano];
  };
};
