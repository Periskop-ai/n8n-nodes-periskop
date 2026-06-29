const { src, dest } = require('gulp');

// Copies node SVG/PNG icons AND the codex *.node.json metadata files into dist/
// alongside the compiled JS, matching the directory layout n8n expects
// (icon: 'file:periskop.svg', and <Node>.node.json next to <Node>.node.js so the
// node's categories and documentation links are picked up).
function buildIcons() {
	return src('nodes/**/*.{png,svg,json}').pipe(dest('dist/nodes'));
}

exports['build:icons'] = buildIcons;
exports.default = buildIcons;
