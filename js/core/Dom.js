const $ = (id) => document.getElementById(id);

class Store {
  static read(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }

  static write(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {}
  }
}
