(function registerDiagrams(global) {
  'use strict';

  const namespace = global.PaperFlightAtlas ?? (global.PaperFlightAtlas = {});
  namespace.diagrams = namespace.diagrams ?? {};

  const PLANE_PROFILES = Object.freeze({
    'classic-dart': Object.freeze({ nose: 0.82, wing: 0.58, tail: 0.24 }),
    'beginner-glider': Object.freeze({ nose: 0.58, wing: 0.86, tail: 0.34 }),
    'sky-arrow': Object.freeze({ nose: 0.9, wing: 0.5, tail: 0.2 }),
    longtail: Object.freeze({ nose: 0.72, wing: 0.68, tail: 0.78 }),
    'swift-spear': Object.freeze({ nose: 0.96, wing: 0.42, tail: 0.18 }),
    'loop-wing': Object.freeze({ nose: 0.66, wing: 0.8, tail: 0.46 }),
    'origami-falcon': Object.freeze({ nose: 0.92, wing: 0.74, tail: 0.4 }),
    'wabi-sabi-crane': Object.freeze({ nose: 0.62, wing: 0.9, tail: 0.7 }),
  });

  const STEP_HINTS = Object.freeze({
    1: '左長邊貼齊右長邊，壓痕後再展開',
    2: '左右上角的斜邊貼齊中心線',
    3: '左右斜邊再次貼齊中心線',
    4: '沿中心線合起，左右輪廓完全重合',
    5: '上層機翼向下摺，翻面後等角度重複',
  });

  function parseDiagramKey(diagramKey) {
    var match = /^([a-z0-9-]+)-0([1-5])$/.exec(String(diagramKey));
    if (!match || !Object.hasOwn(PLANE_PROFILES, match[1])) return null;
    return { key: match[0], planeId: match[1], stepNumber: Number(match[2]), profile: PLANE_PROFILES[match[1]] };
  }

  function paperState(shape, path, details) {
    return { shape: shape, path: path, details: details || '' };
  }

  function buildStates(profile) {
    var shoulderY = 82 + Math.round((1 - profile.nose) * 34);
    var narrowY = 110 + Math.round((1 - profile.wing) * 24);
    var narrowX = 82 + Math.round(profile.wing * 16);
    var wingTipY = 138 + Math.round((1 - profile.wing) * 30);
    var wingTailX = 202 + Math.round(profile.tail * 18);

    return [
      paperState('sheet-240x190', 'M30 8H270V198H30Z'),
      paperState(
        'sheet-240x190-center',
        'M30 8H270V198H30Z',
        '<path class="diagram-existing-crease" d="M150 8V198" />'
      ),
      paperState(
        'nose-' + shoulderY,
        'M150 8L270 ' + shoulderY + 'V198H30V' + shoulderY + 'Z',
        '<path class="diagram-existing-crease" d="M30 ' + shoulderY + 'L150 8L270 ' + shoulderY + '" /><path class="diagram-existing-crease" d="M150 8V198" />'
      ),
      paperState(
        'narrow-body-' + narrowX + '-' + narrowY,
        'M150 8L' + (300 - narrowX) + ' ' + narrowY + 'L270 198H30L' + narrowX + ' ' + narrowY + 'Z',
        '<path class="diagram-existing-crease" d="M' + narrowX + ' ' + narrowY + 'L150 8L' + (300 - narrowX) + ' ' + narrowY + 'M150 8V198" />'
      ),
      paperState(
        'folded-body-' + narrowX + '-' + narrowY,
        'M150 8L' + (300 - narrowX) + ' ' + narrowY + 'L270 198H150Z',
        '<path class="diagram-existing-crease" d="M150 8V198" />'
      ),
      paperState(
        'finished-wing-' + wingTailX + '-' + wingTipY,
        'M150 8L270 ' + wingTipY + 'L' + wingTailX + ' 198H150Z',
        '<path class="diagram-existing-crease" d="M150 8V198M174 82L' + wingTailX + ' 198" />'
      ),
    ];
  }

  function diagramParts(beforeState, afterState, moving, crease, direction, alignment, hint) {
    return {
      beforeState: beforeState,
      afterState: afterState,
      moving: moving,
      crease: crease,
      direction: direction,
      alignment: alignment,
      hint: hint,
    };
  }

  function buildCenterCrease(profile) {
    var states = buildStates(profile);
    return diagramParts(
      states[0],
      states[1],
      '<path class="diagram-moving" d="M30 8H150V198H30Z" />',
      '<path class="diagram-crease" d="M150 8V198" />',
      '<path class="diagram-direction" d="M70 62Q150 18 258 66" marker-end="url(#fold-arrow)" />',
      '<circle class="diagram-alignment" data-target="right-long-edge" cx="270" cy="66" r="7" />',
      STEP_HINTS[1]
    );
  }

  function buildNoseFold(profile) {
    var states = buildStates(profile);
    var shoulderY = 82 + Math.round((1 - profile.nose) * 34);
    return diagramParts(
      states[1],
      states[2],
      '<path class="diagram-moving" d="M30 8H150L30 ' + shoulderY + 'ZM270 8H150L270 ' + shoulderY + 'Z" />',
      '<path class="diagram-crease" d="M30 ' + shoulderY + 'L150 8L270 ' + shoulderY + '" />',
      '<path class="diagram-direction" d="M72 46Q108 66 140 ' + (shoulderY - 8) + 'M228 46Q192 66 160 ' + (shoulderY - 8) + '" marker-end="url(#fold-arrow)" />',
      '<circle class="diagram-alignment" data-target="center-line" cx="150" cy="' + shoulderY + '" r="7" />',
      STEP_HINTS[2]
    );
  }

  function buildWingFold(profile) {
    var states = buildStates(profile);
    var narrowY = 110 + Math.round((1 - profile.wing) * 24);
    var narrowX = 82 + Math.round(profile.wing * 16);
    return diagramParts(
      states[2],
      states[3],
      '<path class="diagram-moving" d="M30 90L' + narrowX + ' ' + narrowY + 'L30 188ZM270 90L' + (300 - narrowX) + ' ' + narrowY + 'L270 188Z" />',
      '<path class="diagram-crease" d="M' + narrowX + ' ' + narrowY + 'L30 188M' + (300 - narrowX) + ' ' + narrowY + 'L270 188" />',
      '<path class="diagram-direction" d="M68 134Q104 126 140 130M232 134Q196 126 160 130" marker-end="url(#fold-arrow)" />',
      '<circle class="diagram-alignment" data-target="center-line" cx="150" cy="130" r="7" />',
      STEP_HINTS[3]
    );
  }

  function buildBodyFold(profile) {
    var states = buildStates(profile);
    return diagramParts(
      states[3],
      states[4],
      '<path class="diagram-moving" d="M150 8L14 150L110 198H150Z" />',
      '<path class="diagram-crease" d="M150 8V198" />',
      '<path class="diagram-direction" d="M72 94Q150 48 238 104" marker-end="url(#fold-arrow)" />',
      '<circle class="diagram-alignment" data-target="right-body-edge" cx="238" cy="104" r="7" />',
      STEP_HINTS[4]
    );
  }

  function buildTipFinish(profile) {
    var states = buildStates(profile);
    var narrowY = 110 + Math.round((1 - profile.wing) * 24);
    var narrowX = 82 + Math.round(profile.wing * 16);
    var wingTipY = 138 + Math.round((1 - profile.wing) * 30);
    var wingTailX = 202 + Math.round(profile.tail * 18);
    return diagramParts(
      states[4],
      states[5],
      '<path class="diagram-moving" d="M150 8L' + (300 - narrowX) + ' ' + narrowY + 'L270 198L' + wingTailX + ' 198Z" />',
      '<path class="diagram-crease" d="M174 82L' + wingTailX + ' 198" />',
      '<path class="diagram-direction" d="M220 92Q246 124 250 ' + (wingTipY - 4) + '" marker-end="url(#fold-arrow)" />',
      '<circle class="diagram-alignment" data-target="matching-wing-angle" cx="250" cy="' + wingTipY + '" r="7" />',
      STEP_HINTS[5]
    );
  }

  const ACTION_BUILDERS = Object.freeze({
    1: buildCenterCrease,
    2: buildNoseFold,
    3: buildWingFold,
    4: buildBodyFold,
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

  function safeInstanceId(value) {
    var safe = String(value || 'single').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
    return safe || 'single';
  }

  function renderState(state, className) {
    return '<path class="' + className + '" data-shape="' + state.shape + '" d="' + state.path + '" />' + state.details;
  }

  function renderPanelContent(parts, state) {
    if (state === 'before') {
      return renderState(parts.beforeState, 'diagram-before')
        + parts.moving + parts.crease + parts.direction + parts.alignment;
    }

    return renderState(parts.afterState, 'diagram-after')
      + parts.crease.replaceAll('diagram-crease', 'diagram-result-crease')
      + parts.alignment;
  }

  function renderDiagramShell(parsed, label, parts, instanceId) {
    var safeLabel = escapeText(label);
    var safeHint = escapeText(parts.hint);
    var markerId = 'fold-arrow-' + parsed.key + '-' + safeInstanceId(instanceId);
    var beforeContent = renderPanelContent(parts, 'before').replaceAll('url(#fold-arrow)', 'url(#' + markerId + ')');
    var afterContent = renderPanelContent(parts, 'after');
    return [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 320" role="img" focusable="false" aria-label="', safeLabel,
      '" data-diagram-key="', parsed.key,
      '" data-before-state="', parsed.planeId, '-state-', parsed.stepNumber - 1,
      '" data-after-state="', parsed.planeId, '-state-', parsed.stepNumber,
      '" data-before-shape="', parts.beforeState.shape,
      '" data-after-shape="', parts.afterState.shape, '">',
      '<title>', safeLabel, '</title><desc>', safeHint, '。左圖為折前，右圖為折後。</desc>',
      '<defs><marker id="', markerId, '" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0 0L10 5L0 10Z" /></marker></defs>',
      '<text class="diagram-panel-label" x="24" y="28">折前</text>',
      '<text class="diagram-panel-label" x="384" y="28">折後</text>',
      '<g transform="translate(24 42)">', beforeContent, '</g>',
      '<path class="diagram-process" d="M342 142H370" marker-end="url(#', markerId, ')" />',
      '<g transform="translate(384 42)">', afterContent, '</g>',
      '<text class="diagram-hint" x="360" y="302" text-anchor="middle">', safeHint, '</text>',
      '</svg>',
    ].join('');
  }

  function renderFallbackDiagram(label) {
    var safeLabel = escapeText(label);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 320" role="img" focusable="false" aria-label="' + safeLabel + '" data-diagram-key="fallback"><title>' + safeLabel + '</title><desc>圖解準備中。</desc><rect class="diagram-fallback" x="120" y="60" width="480" height="180" rx="4" /><text class="diagram-hint" x="360" y="158" text-anchor="middle">圖解準備中</text></svg>';
  }

  function renderFoldDiagram(diagramKey, label, instanceId) {
    var parsed = parseDiagramKey(diagramKey);
    if (!parsed) return renderFallbackDiagram(label);
    var action = ACTION_BUILDERS[parsed.stepNumber](parsed.profile);
    return renderDiagramShell(parsed, label, action, instanceId);
  }

  namespace.diagrams.renderFoldDiagram = renderFoldDiagram;
}(window));
