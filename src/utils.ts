/* eslint-disable no-extend-native */

// 方便取值
Map.prototype.vals = function vals() {
  return [...this.values()];
};

Set.prototype.vals = function vals() {
  return [...this.values()];
};

Set.prototype.addMultiple = function addMultiple(...args) {
  for (const arg of args) {
    this.add(arg);
  }
};

Array.prototype.uniq = function uniq() {
  return new Set(this).vals();
};
