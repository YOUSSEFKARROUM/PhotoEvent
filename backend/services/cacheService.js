// Simple in-memory cache service
const cache = {};

const set = (key, value) => {
  cache[key] = value;
};

const get = (key) => {
  return cache[key];
};

const remove = (key) => {
  delete cache[key];
};

const clear = () => {
  for (const key in cache) {
    delete cache[key];
  }
};

module.exports = {
  set,
  get,
  remove,
  clear
};
