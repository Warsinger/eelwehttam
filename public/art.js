// Decorative wireframe illustration; the app itself lives at math-viz.pages.dev.
const surface = document.getElementById('surface');
const project = (x, y) => [280 + (x - y) * 34, 151 + (x + y) * 13 - Math.sin(x) * Math.cos(y) * 48];
for (let axis = 0; axis < 2; axis++) {
  for (let fixed = -3; fixed <= 3; fixed += 0.3) {
    const points = [];
    for (let t = -3; t <= 3.01; t += 0.08) points.push(project(axis ? t : fixed, axis ? fixed : t).join(','));
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    line.setAttribute('points', points.join(' '));
    surface.append(line);
  }
}
document.getElementById('year').textContent = new Date().getFullYear();
