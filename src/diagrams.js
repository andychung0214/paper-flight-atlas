(function registerDiagrams(global) {
  'use strict';

  const namespace = global.PaperFlightAtlas ?? (global.PaperFlightAtlas = {});
  namespace.diagrams = namespace.diagrams ?? {};

  const PLANE_PROFILES = Object.freeze({
    'classic-dart': Object.freeze({ nose: 0.82, wing: 0.58, tail: 0.24, hintTone: 'precise' }),
    'beginner-glider': Object.freeze({ nose: 0.58, wing: 0.86, tail: 0.34, hintTone: 'gentle' }),
    'sky-arrow': Object.freeze({ nose: 0.9, wing: 0.5, tail: 0.2, hintTone: 'precise' }),
    longtail: Object.freeze({ nose: 0.72, wing: 0.68, tail: 0.78, hintTone: 'gentle' }),
    'swift-spear': Object.freeze({ nose: 0.96, wing: 0.42, tail: 0.18, hintTone: 'precise' }),
    'loop-wing': Object.freeze({ nose: 0.66, wing: 0.8, tail: 0.46, hintTone: 'curve' }),
    'origami-falcon': Object.freeze({ nose: 0.92, wing: 0.74, tail: 0.4, hintTone: 'precise' }),
    'wabi-sabi-crane': Object.freeze({ nose: 0.62, wing: 0.9, tail: 0.7, hintTone: 'gentle' }),
  });

  const STEP_HINTS = Object.freeze({
    1: '長邊對齊，再壓出中心線',
    2: '左右角尖對準中心線',
    3: '兩側翼線保持同高',
    4: '沿機身中軸壓緊紙層',
    5: '兩側翼尖調成相同角度',
  });

  function parseDiagramKey(diagramKey) {
    var match = /^([a-z0-9-]+)-0([1-5])$/.exec(String(diagramKey));
    if (!match || !Object.hasOwn(PLANE_PROFILES, match[1])) return null;
    return { key: match[0], planeId: match[1], stepNumber: Number(match[2]), profile: PLANE_PROFILES[match[1]] };
  }

  function diagramParts(beforePaper, afterPaper, moving, crease, direction, alignment, hint) {
    return { beforePaper: beforePaper, afterPaper: afterPaper, moving: moving, crease: crease, direction: direction, alignment: alignment, hint: hint };
  }

  function buildCenterCrease() {
    return diagramParts(
      '<rect class="diagram-before" x="30" y="8" width="240" height="190" rx="2" />',
      '<rect class="diagram-after" x="30" y="8" width="240" height="190" rx="2" />',
      '<path class="diagram-moving" d="M30 8H150V198H30Z" />',
      '<path class="diagram-crease" d="M150 8V198" />',
      '<path class="diagram-direction" d="M82 70Q112 102 140 106" marker-end="url(#fold-arrow)" />',
      '<circle class="diagram-alignment" cx="150" cy="106" r="6" />',
      STEP_HINTS[1]
    );
  }

  function buildNoseFold(profile) {
    var noseY = 96 + Math.round((1 - profile.nose) * 30);
    return diagramParts(
      '<rect class="diagram-before" x="30" y="8" width="240" height="190" rx="2" />',
      '<path class="diagram-after" d="M30 8L150 ' + noseY + 'L270 8V198H30Z" />',
      '<path class="diagram-moving" d="M30 8L150 ' + noseY + 'H30ZM270 8L150 ' + noseY + 'H270Z" />',
      '<path class="diagram-crease" d="M30 8L150 ' + noseY + 'L270 8" />',
      '<path class="diagram-direction" d="M72 48Q104 70 136 ' + (noseY - 8) + 'M228 48Q196 70 164 ' + (noseY - 8) + '" marker-end="url(#fold-arrow)" />',
      '<circle class="diagram-alignment" cx="150" cy="' + noseY + '" r="6" />',
      STEP_HINTS[2]
    );
  }

  function buildWingFold(profile) {
    var wingY = 80 + Math.round((1 - profile.wing) * 50);
    return diagramParts(
      '<path class="diagram-before" d="M150 8L270 198H30Z" />',
      '<path class="diagram-after" d="M150 8L286 ' + (wingY + 72) + 'L190 198H110L14 ' + (wingY + 72) + 'Z" />',
      '<path class="diagram-moving" d="M150 8L270 198L188 ' + wingY + 'ZM150 8L30 198L112 ' + wingY + 'Z" />',
      '<path class="diagram-crease" d="M112 ' + wingY + 'L30 198M188 ' + wingY + 'L270 198" />',
      '<path class="diagram-direction" d="M92 106Q58 120 32 146M208 106Q242 120 268 146" marker-end="url(#fold-arrow)" />',
      '<circle class="diagram-alignment" cx="112" cy="' + wingY + '" r="5" /><circle class="diagram-alignment" cx="188" cy="' + wingY + '" r="5" />',
      STEP_HINTS[3]
    );
  }

  function buildBodyReinforcement(profile) {
    var halfBody = 24 + Math.round((1 - profile.nose) * 18);
    return diagramParts(
      '<path class="diagram-before" d="M150 8L276 182L' + (150 + halfBody) + ' 198H' + (150 - halfBody) + 'L24 182Z" />',
      '<path class="diagram-after" d="M150 8L276 182L' + (150 + halfBody) + ' 198H' + (150 - halfBody) + 'L24 182Z" />',
      '<path class="diagram-moving" d="M' + (150 - halfBody) + ' 56H' + (150 + halfBody) + 'V198H' + (150 - halfBody) + 'Z" />',
      '<path class="diagram-crease" d="M150 8V198" />',
      '<path class="diagram-direction" d="M108 82H140M192 82H160" marker-end="url(#fold-arrow)" />',
      '<circle class="diagram-alignment" cx="150" cy="82" r="6" />',
      STEP_HINTS[4]
    );
  }

  function buildTipFinish(profile) {
    var tipRise = 12 + Math.round(profile.tail * 22);
    return diagramParts(
      '<path class="diagram-before" d="M150 8L286 168L190 198H110L14 168Z" />',
      '<path class="diagram-after" d="M150 8L286 ' + (168 - tipRise) + 'L190 198H110L14 ' + (168 - tipRise) + 'Z" />',
      '<path class="diagram-moving" d="M14 168L72 150L82 182L14 168ZM286 168L228 150L218 182L286 168Z" />',
      '<path class="diagram-crease" d="M72 150L82 182M228 150L218 182" />',
      '<path class="diagram-direction" d="M50 164V130M250 164V130" marker-end="url(#fold-arrow)" />',
      '<circle class="diagram-alignment" cx="72" cy="150" r="5" /><circle class="diagram-alignment" cx="228" cy="150" r="5" />',
      STEP_HINTS[5]
    );
  }

  const ACTION_BUILDERS = Object.freeze({
    1: buildCenterCrease,
    2: buildNoseFold,
    3: buildWingFold,
    4: buildBodyReinforcement,
    5: buildTipFinish,
  });

  function escapeText(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');
  }

  function renderPanelContent(parts, state) {
    var paper = state === 'before' ? parts.beforePaper : parts.afterPaper;
    var actionLayers = state === 'before'
      ? parts.moving + parts.crease + parts.direction + parts.alignment
      : parts.crease.replaceAll('diagram-crease', 'diagram-result-crease') + parts.alignment;
    return paper + actionLayers;
  }

  function renderDiagramShell(diagramKey, label, parts) {
    var safeLabel = escapeText(label);
    var safeHint = escapeText(parts.hint);
    return [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 320" role="img" focusable="false" aria-label="', safeLabel,
      '" data-diagram-key="', diagramKey, '">',
      '<title>', safeLabel, '</title><desc>', safeHint, '。左圖為折前，右圖為折後。</desc>',
      '<defs><marker id="fold-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0 0L10 5L0 10Z" /></marker></defs>',
      '<text class="diagram-panel-label" x="24" y="28">折前</text>',
      '<text class="diagram-panel-label" x="384" y="28">折後</text>',
      '<g transform="translate(24 42)">', renderPanelContent(parts, 'before'), '</g>',
      '<path class="diagram-process" d="M342 142H370" marker-end="url(#fold-arrow)" />',
      '<g transform="translate(384 42)">', renderPanelContent(parts, 'after'), '</g>',
      '<text class="diagram-hint" x="360" y="302" text-anchor="middle">', safeHint, '</text>',
      '</svg>',
    ].join('');
  }

  function renderFallbackDiagram(label) {
    var safeLabel = escapeText(label);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 320" role="img" focusable="false" aria-label="' + safeLabel + '" data-diagram-key="fallback"><title>' + safeLabel + '</title><desc>圖解準備中。</desc><rect class="diagram-fallback" x="120" y="60" width="480" height="180" rx="4" /><text class="diagram-hint" x="360" y="158" text-anchor="middle">圖解準備中</text></svg>';
  }

  function renderFoldDiagram(diagramKey, label) {
    var parsed = parseDiagramKey(diagramKey);
    if (!parsed) return renderFallbackDiagram(label);
    var action = ACTION_BUILDERS[parsed.stepNumber](parsed.profile);
    return renderDiagramShell(parsed.key, label, action);
  }

  namespace.diagrams.renderFoldDiagram = renderFoldDiagram;
}(window));
