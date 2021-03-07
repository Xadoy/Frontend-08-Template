const images = require("images");

module.exports = function render(viewport, element) {
  if (element.style) {
    const { width, height, left, top } = element.style;
    const img = images(width, height);

    if (element.style["background-color"]) {
      const color = element.style["background-color"];
      color.match(/rgb\((\d+),(\d+),(\d+)\)/);
      const r = Number(RegExp.$1);
      const g = Number(RegExp.$2);
      const b = Number(RegExp.$3);
      img.fill(r, g, b);
      viewport.draw(img, left || 0, top || 0);
    }
  }

  if (element.children) {
    for (const child of element.children) {
      render(viewport, child);
    }
  }
};
