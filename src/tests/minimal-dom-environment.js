// eslint-disable-next-line @typescript-eslint/no-require-imports
const NodeEnvironment = require('jest-environment-node').TestEnvironment;

class MinimalDomEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup();

    const documentElement = {
      dataset: {},
      style: {},
      attributes: {},
      setAttribute(name, value) {
        this.attributes[name] = value;
        if (name === 'data-theme') {
          this.dataset.theme = value;
        }
      },
      getAttribute(name) {
        return this.attributes[name];
      },
      removeAttribute(name) {
        delete this.attributes[name];
        if (name === 'data-theme') {
          delete this.dataset.theme;
        }
      },
    };

    const document = {
      documentElement,
    };

    const storage = {};
    const localStorage = {
      getItem(key) {
        return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null;
      },
      setItem(key, value) {
        storage[key] = String(value);
      },
      removeItem(key) {
        delete storage[key];
      },
      clear() {
        Object.keys(storage).forEach((key) => delete storage[key]);
      },
    };

    const defaultMediaQuery = () => ({
      matches: false,
      media: '',
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent() {
        return false;
      },
    });

    this.global.document = document;
    this.global.window = {
      document,
      localStorage,
      matchMedia: defaultMediaQuery,
    };
    this.global.localStorage = localStorage;
    this.global.navigator = { userAgent: 'node' };
  }
}

module.exports = MinimalDomEnvironment;
