(function registerDiagrams(global) {
  'use strict';

  const namespace = global.PaperFlightAtlas ?? (global.PaperFlightAtlas = {});
  namespace.diagrams = namespace.diagrams ?? {};

  const PLANE_PROFILES = Object.freeze({
    'classic-dart': Object.freeze({ wing: 0.58, tail: 0.24 }),
    'beginner-glider': Object.freeze({ wing: 0.86, tail: 0.34 }),
    'sky-arrow': Object.freeze({ wing: 0.5, tail: 0.2 }),
    longtail: Object.freeze({ wing: 0.68, tail: 0.78 }),
    'swift-spear': Object.freeze({ wing: 0.42, tail: 0.18 }),
    'loop-wing': Object.freeze({ wing: 0.8, tail: 0.46 }),
    'origami-falcon': Object.freeze({ wing: 0.74, tail: 0.4 }),
    'wabi-sabi-crane': Object.freeze({ wing: 0.9, tail: 0.7 }),
  });

  const STEP_HINTS = Object.freeze({
    1: '左長邊貼齊右長邊，壓痕後再展開',
    2: '左右上角的斜邊貼齊中心線',
    3: '左右斜邊再次貼齊中心線',
    4: '沿中心線合起，左右輪廓完全重合',
    5: '上層機翼向下摺，翻面後等角度重複',
  });

  function point(x, y) {
    return { x: x, y: y };
  }

  function formatNumber(value) {
    var rounded = Math.round(value * 1000) / 1000;
    return Number.isInteger(rounded) ? String(rounded) : String(rounded);
  }

  function pointText(value) {
    return formatNumber(value.x) + ',' + formatNumber(value.y);
  }

  function pathPoint(value) {
    return formatNumber(value.x) + ' ' + formatNumber(value.y);
  }

  function reflectPoint(source, lineStart, lineEnd) {
    var dx = lineEnd.x - lineStart.x;
    var dy = lineEnd.y - lineStart.y;
    var lengthSquared = dx * dx + dy * dy;
    var projection = ((source.x - lineStart.x) * dx + (source.y - lineStart.y) * dy) / lengthSquared;
    var projectedX = lineStart.x + projection * dx;
    var projectedY = lineStart.y + projection * dy;
    return point(2 * projectedX - source.x, 2 * projectedY - source.y);
  }

  function parseDiagramKey(diagramKey) {
    var match = /^([a-z0-9-]+)-0([1-5])$/.exec(String(diagramKey));
    if (!match || !Object.hasOwn(PLANE_PROFILES, match[1])) return null;
    return { key: match[0], planeId: match[1], stepNumber: Number(match[2]), profile: PLANE_PROFILES[match[1]] };
  }

  function paperState(shape, path, details) {
    return { shape: shape, path: path, details: details || '' };
  }

  function geometry(source, target, creaseStart, creaseEnd) {
    return {
      source: source,
      target: target,
      creaseStart: creaseStart,
      creaseEnd: creaseEnd,
    };
  }

  function buildModel(profile) {
    var top = point(150, 8);
    var bottomCenter = point(150, 198);
    var firstCornerTarget = point(150, 128);
    var secondCornerTarget = point(150, 8 + Math.hypot(120, 120));
    var secondCreaseMidpoint = point(
      (30 + secondCornerTarget.x) / 2,
      (128 + secondCornerTarget.y) / 2
    );
    var creaseScale = (198 - top.y) / (secondCreaseMidpoint.y - top.y);
    var secondCreaseLeft = point(
      top.x + (secondCreaseMidpoint.x - top.x) * creaseScale,
      198
    );
    var secondCreaseRight = point(300 - secondCreaseLeft.x, 198);
    var wingCreaseRatio = Math.max(0.28, Math.min(0.5, 0.3 + (1 - profile.wing) * 0.18 + (profile.tail - 0.5) * 0.03));
    var wingCreaseTop = point(
      top.x + (secondCreaseRight.x - top.x) * wingCreaseRatio,
      top.y + (secondCreaseRight.y - top.y) * wingCreaseRatio
    );
    var foldedWingTip = reflectPoint(secondCreaseRight, wingCreaseTop, bottomCenter);

    var states = [
      paperState('sheet', 'M30 8H270V198H30Z'),
      paperState('sheet-center-crease', 'M30 8H270V198H30Z', '<path class="diagram-existing-crease" d="M150 8V198" />'),
      paperState(
        'first-corners',
        'M150 8L270 128V198H30V128Z',
        '<path class="diagram-existing-crease" d="M150 8L30 128M150 8L270 128M150 8V198" />'
      ),
      paperState(
        'second-corners',
        'M150 8L' + pathPoint(secondCreaseRight) + 'H' + formatNumber(secondCreaseLeft.x) + 'Z',
        '<path class="diagram-existing-crease" d="M150 8L' + pathPoint(secondCreaseLeft) + 'M150 8L' + pathPoint(secondCreaseRight) + 'M150 8V198" />'
      ),
      paperState(
        'folded-body',
        'M150 8L' + pathPoint(secondCreaseRight) + 'H150Z',
        '<path class="diagram-existing-crease" d="M150 8V198" />'
      ),
      paperState(
        'finished-wing-' + formatNumber(wingCreaseRatio),
        'M150 8L' + pathPoint(wingCreaseTop) + 'L150 198ZM' + pathPoint(wingCreaseTop) + 'L' + pathPoint(foldedWingTip) + 'L150 198Z',
        '<path class="diagram-existing-crease" d="M' + pathPoint(wingCreaseTop) + 'L150 198" />'
      ),
    ];

    return {
      states: states,
      top: top,
      bottomCenter: bottomCenter,
      firstCornerTarget: firstCornerTarget,
      secondCornerTarget: secondCornerTarget,
      secondCreaseLeft: secondCreaseLeft,
      secondCreaseRight: secondCreaseRight,
      wingCreaseTop: wingCreaseTop,
      foldedWingTip: foldedWingTip,
    };
  }

  function diagramParts(beforeState, afterState, moving, crease, direction, alignment, hint, foldGeometry) {
    return {
      beforeState: beforeState,
      afterState: afterState,
      moving: moving,
      crease: crease,
      direction: direction,
      alignment: alignment,
      hint: hint,
      geometry: foldGeometry,
    };
  }

  function buildCenterCrease(profile) {
    var model = buildModel(profile);
    return diagramParts(
      model.states[0],
      model.states[1],
      '<path class="diagram-moving" d="M30 8L150 8L150 198L30 198Z" />',
      '<path class="diagram-crease" d="M150 8L150 198" />',
      '<path class="diagram-direction" d="M42 24Q150 2 258 24" marker-end="url(#fold-arrow)" />',
      '<circle class="diagram-alignment" data-target="right-long-edge" cx="270" cy="8" r="7" />',
      STEP_HINTS[1],
      geometry(point(30, 8), point(270, 8), point(150, 8), point(150, 198))
    );
  }

  function buildNoseFold(profile) {
    var model = buildModel(profile);
    return diagramParts(
      model.states[1],
      model.states[2],
      '<path class="diagram-moving" d="M30 8L150 8L30 128ZM270 8L150 8L270 128Z" />',
      '<path class="diagram-crease" d="M150 8L30 128M150 8L270 128" />',
      '<path class="diagram-direction" d="M42 24Q92 70 140 118M258 24Q208 70 160 118" marker-end="url(#fold-arrow)" />',
      '<circle class="diagram-alignment" data-target="center-line" cx="150" cy="128" r="7" />',
      STEP_HINTS[2],
      geometry(point(30, 8), model.firstCornerTarget, model.top, point(30, 128))
    );
  }

  function buildSecondNoseFold(profile) {
    var model = buildModel(profile);
    var left = model.secondCreaseLeft;
    var right = model.secondCreaseRight;
    var target = model.secondCornerTarget;
    return diagramParts(
      model.states[2],
      model.states[3],
      '<path class="diagram-moving" d="M150 8L30 128L30 198L' + pathPoint(left) + 'ZM150 8L270 128L270 198L' + pathPoint(right) + 'Z" />',
      '<path class="diagram-crease" d="M150 8L' + pathPoint(left) + 'M150 8L' + pathPoint(right) + '" />',
      '<path class="diagram-direction" d="M42 136Q92 156 140 ' + formatNumber(target.y - 4) + 'M258 136Q208 156 160 ' + formatNumber(target.y - 4) + '" marker-end="url(#fold-arrow)" />',
      '<circle class="diagram-alignment" data-target="center-line" cx="150" cy="' + formatNumber(target.y) + '" r="7" />',
      STEP_HINTS[3],
      geometry(point(30, 128), target, model.top, left)
    );
  }

  function buildBodyFold(profile) {
    var model = buildModel(profile);
    var left = model.secondCreaseLeft;
    var right = model.secondCreaseRight;
    return diagramParts(
      model.states[3],
      model.states[4],
      '<path class="diagram-moving" d="M150 8L' + pathPoint(left) + 'L150 198Z" />',
      '<path class="diagram-crease" d="M150 8L150 198" />',
      '<path class="diagram-direction" d="M' + formatNumber(left.x + 8) + ' 174Q150 108 ' + formatNumber(right.x - 8) + ' 174" marker-end="url(#fold-arrow)" />',
      '<circle class="diagram-alignment" data-target="right-body-edge" cx="' + formatNumber(right.x) + '" cy="198" r="7" />',
      STEP_HINTS[4],
      geometry(left, right, model.top, model.bottomCenter)
    );
  }

  function buildWingFold(profile) {
    var model = buildModel(profile);
    var creaseTop = model.wingCreaseTop;
    var source = model.secondCreaseRight;
    var target = model.foldedWingTip;
    return diagramParts(
      model.states[4],
      model.states[5],
      '<path class="diagram-moving" d="M' + pathPoint(creaseTop) + 'L' + pathPoint(source) + 'L150 198Z" />',
      '<path class="diagram-crease" d="M' + pathPoint(creaseTop) + 'L150 198" />',
      '<path class="diagram-direction" d="M' + pathPoint(source) + 'Q' + formatNumber((source.x + target.x) / 2 + 18) + ' ' + formatNumber((source.y + target.y) / 2) + ' ' + pathPoint(target) + '" marker-end="url(#fold-arrow)" />',
      '<circle class="diagram-alignment" data-target="matching-wing-angle" cx="' + formatNumber(target.x) + '" cy="' + formatNumber(target.y) + '" r="7" />',
      STEP_HINTS[5],
      geometry(source, target, creaseTop, model.bottomCenter)
    );
  }

  const ACTION_BUILDERS = Object.freeze({
    1: buildCenterCrease,
    2: buildNoseFold,
    3: buildSecondNoseFold,
    4: buildBodyFold,
    5: buildWingFold,
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
    var foldGeometry = parts.geometry;
    return [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 280" role="img" focusable="false" aria-label="', safeLabel,
      '" data-diagram-key="', parsed.key,
      '" data-panel-order="before-after',
      '" data-before-state="', parsed.planeId, '-state-', parsed.stepNumber - 1,
      '" data-after-state="', parsed.planeId, '-state-', parsed.stepNumber,
      '" data-before-shape="', parts.beforeState.shape,
      '" data-after-shape="', parts.afterState.shape,
      '" data-source-point="', pointText(foldGeometry.source),
      '" data-target-point="', pointText(foldGeometry.target),
      '" data-crease-start="', pointText(foldGeometry.creaseStart),
      '" data-crease-end="', pointText(foldGeometry.creaseEnd), '">',
      '<title>', safeLabel, '</title><desc>', safeHint, '。HTML 圖說依序標示折前與折後。</desc>',
      '<defs><marker id="', markerId, '" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0 0L10 5L0 10Z" /></marker></defs>',
      '<g transform="translate(24 24)">', beforeContent, '</g>',
      '<path class="diagram-process" d="M342 124H370" marker-end="url(#', markerId, ')" />',
      '<g transform="translate(384 24)">', afterContent, '</g>',
      '</svg>',
    ].join('');
  }

  function renderFallbackDiagram(label) {
    var safeLabel = escapeText(label);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 280" role="img" focusable="false" aria-label="' + safeLabel + '" data-diagram-key="fallback"><title>' + safeLabel + '</title><desc>圖解準備中。</desc><rect class="diagram-fallback" x="120" y="50" width="480" height="170" rx="4" /><text class="diagram-fallback-text" x="360" y="145" text-anchor="middle">圖解準備中</text></svg>';
  }

  function renderFoldDiagram(diagramKey, label, instanceId) {
    var parsed = parseDiagramKey(diagramKey);
    if (!parsed) return renderFallbackDiagram(label);
    var action = ACTION_BUILDERS[parsed.stepNumber](parsed.profile);
    return renderDiagramShell(parsed, label, action, instanceId);
  }

  namespace.diagrams.renderFoldDiagram = renderFoldDiagram;
}(window));
