Asteroid.utils.multiStorage.get = function (key) {
  return AsyncStorage.getItem(key)
};

Asteroid.utils.multiStorage.set = function (key, value) {
  return AsyncStorage.setItem(key, value)
};

Asteroid.utils.multiStorage.del = function (key) {
  return AsyncStorage.removeItem(key)
};
