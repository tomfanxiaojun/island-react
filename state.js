export var components = {};

export function registerComponent(id, c) {
  components[id] = c;
}

export function unregisterComponent(id) {
  delete(components[id]);
}
