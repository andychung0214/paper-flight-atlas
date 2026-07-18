# Clear Fold Diagrams Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the five repeated abstract sketches with forty unique, accessible “before → after” folding diagrams that match every tutorial step and remain clear on desktop and mobile.

**Architecture:** Keep each step’s `diagram` field as a string, but change it to a unique `<plane-id>-0<step>` key. `src/diagrams.js` will parse that controlled key, combine one of eight plane geometry profiles with one of five folding actions, and render a shared two-panel SVG grammar; `src/render.js` will add the persistent legend and continue reusing the same SVG in the native dialog.

**Tech Stack:** HTML5, CSS3, Vanilla JavaScript, SVG, native `<dialog>`, browser-only executable tests; no Node.js, Python, package manager, build tool, backend, or third-party library.

## Global Constraints

- The site must run by opening `index.html` directly from the filesystem.
- Runtime and tests must run with only HTML, CSS, JavaScript, SVG, and browser APIs.
- All Chinese copy uses Traditional Chinese and the repository terminology rules.
- All 40 tutorial steps have unique diagram keys and render controlled SVG only.
- Diagrams do not use animation, video, photos, external images, gradients, glow, 3D, or decorative motion.
- Unknown and prototype-chain keys render a neutral “圖解準備中” fallback, never another fold.
- Existing routing, themes, favorites, filtering, dialog behavior, keyboard focus, SEO, and GitHub Pages compatibility remain intact.

---

## File Map

- Modify `src/data/planes.js`: assign 40 unique diagram keys and tighten step instructions into action → alignment → press order.
- Rewrite `src/diagrams.js`: define plane profiles, five folding actions, safe fallback, and shared accessible two-panel SVG rendering.
- Modify `src/render.js`: render one diagram legend beneath the SVG and share the current SVG with the enlarged dialog.
- Modify `styles.css`: style the new semantic SVG layers, responsive panels, legend, and enlarged dialog.
- Modify `tests/browser-test.js`: enforce key uniqueness, SVG semantic layers, fallback safety, rendering contracts, and regression behavior.
- Modify `README.md`, `docs/PLAN.md`, `docs/ART-DIRECTION.md`, `docs/TEST-PLAN.md`: document the 40-diagram system and verification method.

---

### Task 1: Lock the Forty-Step Diagram Data Contract

**Files:**
- Modify: `tests/browser-test.js`
- Modify: `src/data/planes.js`

**Interfaces:**
- Consumes: `PaperFlightAtlas.data.planes: Plane[]`.
- Produces: every `Step.diagram` is a unique string matching `/^[a-z0-9-]+-0[1-5]$/`; key prefix equals the containing `Plane.id`.

- [ ] **Step 1: Split the data assertions from SVG rendering and add the failing uniqueness contract**

Add a `testUniqueDiagramKeys` test function beside the existing data tests:

```javascript
function testUniqueDiagramKeys() {
  var keys = [];

  api.planes.forEach(function (plane) {
    plane.steps.forEach(function (step, stepIndex) {
      var expectedKey = plane.id + '-0' + (stepIndex + 1);
      assertEqual(step.diagram, expectedKey, plane.name + ' 第 ' + (stepIndex + 1) + ' 步圖解鍵值應對應機型與順序');
      keys.push(step.diagram);
    });
  });

  assertEqual(keys.length, 40, '應有四十個步驟圖解鍵值');
  assertEqual(new Set(keys).size, 40, '四十個圖解鍵值不得重複');
}
```

Register it as:

```javascript
createTest('四十個步驟使用唯一且可追蹤的圖解鍵值', testUniqueDiagramKeys),
```

- [ ] **Step 2: Run the browser test and verify the new contract fails**

Run in PowerShell:

```powershell
$edge='C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$testUrl='file:///F:/Codex/Projects/paper-flight-atlas/tests/browser-test.html'
& $edge --headless=new --disable-gpu --allow-file-access-from-files --dump-dom $testUrl
```

Expected: the dumped HTML contains `data-test-status="failed"` and the new test reports that `crease-center` does not equal `classic-dart-01`.

- [ ] **Step 3: Replace every repeated diagram id with its unique key**

Use this exact mapping in `src/data/planes.js`:

```text
classic-dart-01 … classic-dart-05
beginner-glider-01 … beginner-glider-05
sky-arrow-01 … sky-arrow-05
longtail-01 … longtail-05
swift-spear-01 … swift-spear-05
loop-wing-01 … loop-wing-05
origami-falcon-01 … origami-falcon-05
wabi-sabi-crane-01 … wabi-sabi-crane-05
```

For each plane, preserve the five-step order: center crease, nose shaping, wing shaping, body reinforcement, tip/tail finishing.

- [ ] **Step 4: Run the focused browser suite and verify the data contract passes**

Run the Edge command from Step 2.

Expected: `四十個步驟使用唯一且可追蹤的圖解鍵值` passes. The existing SVG test may fail because the renderer does not support the new keys yet; record that expected red state for Task 2.

- [ ] **Step 5: Commit the data contract**

```powershell
git add tests/browser-test.js src/data/planes.js
git commit -m "test: 鎖定四十個專屬圖解鍵值"
```

---

### Task 2: Build the Accessible Before-and-After SVG Renderer

**Files:**
- Modify: `tests/browser-test.js`
- Rewrite: `src/diagrams.js`

**Interfaces:**
- Consumes: `renderFoldDiagram(diagramKey: string, label: string)` and keys from Task 1.
- Produces: safe SVG with `data-diagram-key`, `.diagram-before`, `.diagram-after`, `.diagram-moving`, `.diagram-crease`, `.diagram-direction`, `.diagram-alignment`, `.diagram-hint`, `<title>`, and `<desc>`.

- [ ] **Step 1: Replace the old six-id assertions with semantic SVG assertions that fail**

Define the required markers and test all 40 keys:

```javascript
var requiredDiagramMarkers = [
  'data-diagram-key=',
  'class="diagram-before"',
  'class="diagram-after"',
  'class="diagram-moving"',
  'class="diagram-crease"',
  'class="diagram-direction"',
  'class="diagram-alignment"',
  'class="diagram-hint"',
  '<title>',
  '<desc>',
  '>折前<',
  '>折後<',
];

api.planes.forEach(function (plane) {
  plane.steps.forEach(function (step, stepIndex) {
    var svg = api.diagrams.renderFoldDiagram(step.diagram, plane.name + ' ' + step.title);
    requiredDiagramMarkers.forEach(function (marker) {
      assert(svg.includes(marker), step.diagram + ' 缺少 ' + marker);
    });
    assert(svg.includes('data-diagram-key="' + step.diagram + '"'), step.diagram + ' 應保留可追蹤鍵值');
  });
});
```

Also require unknown keys to contain `data-diagram-key="fallback"` and `圖解準備中`.

- [ ] **Step 2: Run the test and verify the new semantic contract fails**

Run the Task 1 Edge command.

Expected: `全部四十個步驟圖與安全 SVG 可產生` fails because the current SVG has none of the new semantic classes.

- [ ] **Step 3: Define controlled plane profiles and parse only valid owned keys**

Replace the old `DIAGRAMS` object with frozen profiles:

```javascript
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

function parseDiagramKey(diagramKey) {
  var match = /^([a-z0-9-]+)-0([1-5])$/.exec(String(diagramKey));
  if (!match || !Object.hasOwn(PLANE_PROFILES, match[1])) return null;
  return { key: match[0], planeId: match[1], stepNumber: Number(match[2]), profile: PLANE_PROFILES[match[1]] };
}
```

- [ ] **Step 4: Implement five focused action builders**

Create one function per action. Use local panel coordinates `0 0 300 220`; the shared shell translates them into the full SVG. Add these exact helpers and builders, then tune only the profile-derived numeric values if browser inspection reveals clipping:

```javascript
const STEP_HINTS = Object.freeze({
  1: '長邊對齊，再壓出中心線',
  2: '左右角尖對準中心線',
  3: '兩側翼線保持同高',
  4: '沿機身中軸壓緊紙層',
  5: '兩側翼尖調成相同角度',
});

function diagramParts(beforePaper, afterPaper, moving, crease, direction, alignment, hint) {
  return { beforePaper, afterPaper, moving, crease, direction, alignment, hint };
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
```

All geometry values must be clamped to the `viewBox="0 0 720 320"`; no user-provided path data is accepted.

- [ ] **Step 5: Compose the shared SVG shell and safe fallback**

Implement the safe shell and fallback with escaped labels:

```javascript
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
    : parts.alignment;
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
```

Add `.diagram-process` to the semantic direction styling in Task 3. Keep the marker path itself controlled and set its fill through CSS.

- [ ] **Step 6: Run tests and verify all renderer contracts pass**

Run the Task 1 Edge command.

Expected: the 40-key test, semantic SVG test, fallback test, `__proto__` test, and escaping test all pass.

- [ ] **Step 7: Commit the renderer**

```powershell
git add tests/browser-test.js src/diagrams.js
git commit -m "feat: 建立折前折後教學圖解"
```

---

### Task 3: Integrate the Legend and Responsive Diagram Presentation

**Files:**
- Modify: `tests/browser-test.js`
- Modify: `src/render.js`
- Modify: `styles.css`

**Interfaces:**
- Consumes: the semantic SVG classes from Task 2.
- Produces: `.diagram-legend` with four explained markers and responsive diagram/dialog layouts.

- [ ] **Step 1: Add failing render assertions for the persistent legend**

Extend the guide test with:

```javascript
assertMatch(guide, /class="diagram-legend"/);
assertMatch(guide, /虛線＝這一步的新折線/);
assertMatch(guide, /箭頭＝紙面移動方向/);
assertMatch(guide, /淡色區＝要移動的紙面/);
assertMatch(guide, /圓點＝需要對齊的位置/);
```

- [ ] **Step 2: Run the test and verify it fails on the missing legend**

Run the Task 1 Edge command.

Expected: the guide rendering test fails on `class="diagram-legend"`.

- [ ] **Step 3: Render one semantic legend below the main diagram**

Add this markup after `${svg}` and before the zoom button in `.diagram-frame`:

```html
<ul class="diagram-legend" aria-label="圖解符號說明">
  <li><span class="diagram-legend__sample diagram-legend__sample--crease" aria-hidden="true"></span>虛線＝這一步的新折線</li>
  <li><span class="diagram-legend__sample diagram-legend__sample--arrow" aria-hidden="true">→</span>箭頭＝紙面移動方向</li>
  <li><span class="diagram-legend__sample diagram-legend__sample--moving" aria-hidden="true"></span>淡色區＝要移動的紙面</li>
  <li><span class="diagram-legend__sample diagram-legend__sample--point" aria-hidden="true"></span>圓點＝需要對齊的位置</li>
</ul>
```

Do not duplicate the legend inside the dialog; the SVG itself retains all labels and accessible description.

- [ ] **Step 4: Replace obsolete SVG styles with semantic layer styles**

Use existing theme variables and define:

```css
.diagram-before,
.diagram-after { fill: var(--paper-bright); stroke: var(--ink); stroke-width: 3; }
.diagram-moving { fill: #e6b85f; fill-opacity: .42; stroke: var(--accent); stroke-width: 2; }
.diagram-crease { fill: none; stroke: var(--muted); stroke-width: 2; stroke-dasharray: 8 7; }
.diagram-direction { fill: none; stroke: var(--accent); stroke-width: 5; }
.diagram-alignment { fill: var(--accent); stroke: var(--paper-bright); stroke-width: 2; }
.diagram-hint { fill: var(--ink); font: 600 16px/1.4 var(--font-body); }
.diagram-panel-label { fill: var(--ink); font: 700 18px/1 var(--font-utility); letter-spacing: .08em; }
```

Add a compact two-column legend on desktop and one-column legend below 560 px. Ensure `.diagram-frame svg` remains width `100%`, height `auto`, and the dialog canvas allows horizontal overflow only below 420 px instead of clipping paths.

- [ ] **Step 5: Run browser tests and inspect desktop/mobile layout**

Run the Task 1 Edge command; expect all tests to pass.

Then open `index.html#plane/classic-dart/1` at 1365×900 and 390×844. Verify the two panels, hint, legend, and zoom control do not overlap or clip.

- [ ] **Step 6: Commit the guide integration**

```powershell
git add tests/browser-test.js src/render.js styles.css
git commit -m "feat: 加入圖解圖例與響應式版面"
```

---

### Task 4: Synchronize Step Copy and Project Documentation

**Files:**
- Modify: `src/data/planes.js`
- Modify: `README.md`
- Modify: `docs/PLAN.md`
- Modify: `docs/ART-DIRECTION.md`
- Modify: `docs/TEST-PLAN.md`

**Interfaces:**
- Consumes: the five action types and visual grammar from Tasks 1–3.
- Produces: instruction copy that consistently states action → alignment → pressing method and documents the verified system.

- [ ] **Step 1: Audit all 40 instructions against the rendered action**

For each instruction, use one active sentence with this grammar:

```text
將／把 [紙面] 往 [方向] 摺，使 [邊／角] 對準 [目標]，再從 [起點] 向 [終點] 壓平折痕。
```

Examples:

```javascript
instruction: '將紙張長邊對摺，使四個紙角完全重合，再從中段向兩端壓平折痕。'
instruction: '把左右上角往內摺，使角尖落在中心線同一位置，再由上往下壓實兩道斜折痕。'
```

Preserve model-specific differences: gliders use wider wings and gentler tips; darts/spears use narrow wings and sharper noses; loop wing mentions matched outward angles; falcon/crane retain their distinct profiles.

- [ ] **Step 2: Update documentation with exact delivered behavior**

Make these factual changes:

- README: replace “六種受控 SVG” with “四十張專屬折前／折後 SVG”; explain the four-symbol legend and browser-only test coverage.
- `docs/PLAN.md`: update the SVG milestone and acceptance condition to require 40 unique keys and safe fallback.
- `docs/ART-DIRECTION.md`: document paper/ink/moving/crease/direction/alignment tokens, line weights, mobile behavior, and forbidden visual effects.
- `docs/TEST-PLAN.md`: add 40-diagram visual sweep, legend checks, 390×844 mobile dialog check, and color-independent meaning check.

- [ ] **Step 3: Run content and repository checks**

```powershell
rg -n "六種受控|crease-center|fold-nose|shape-wing|reinforce-body|finish-tip|master-lock" README.md docs src tests
git diff --check
```

Expected: no obsolete generic diagram ids or “六種受控” remain; `git diff --check` prints nothing.

- [ ] **Step 4: Run the full browser suite**

Run the Task 1 Edge command.

Expected: the summary reports every test passed and no failed test item is present.

- [ ] **Step 5: Commit copy and documents**

```powershell
git add src/data/planes.js README.md docs/PLAN.md docs/ART-DIRECTION.md docs/TEST-PLAN.md
git commit -m "docs: 同步專屬圖解說明與驗收方式"
```

---

### Task 5: Complete Full Visual Verification and Review

**Files:**
- Verify: `index.html`
- Verify: `tests/browser-test.html`
- Verify: all modified source and documentation files

**Interfaces:**
- Consumes: completed application from Tasks 1–4.
- Produces: current test output, desktop/mobile screenshots, clean Git state, and review evidence.

- [ ] **Step 1: Run the full browser-only test page from a clean browser process**

```powershell
$edge='C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$testUrl='file:///F:/Codex/Projects/paper-flight-atlas/tests/browser-test.html'
$dom=& $edge --headless=new --disable-gpu --allow-file-access-from-files --dump-dom $testUrl
$dom | Select-String 'data-test-status="passed"|test-summary'
```

Expected: `data-test-status="passed"` and the summary shows all registered tests passing.

- [ ] **Step 2: Capture desktop and mobile evidence for representative steps**

Capture at minimum these routes:

```text
#plane/classic-dart/1
#plane/beginner-glider/2
#plane/loop-wing/4
#plane/origami-falcon/3
#plane/wabi-sabi-crane/5
```

Use 1365×900 desktop and 390×844 mobile viewports. Confirm fold-before, moving area, crease, direction, alignment, fold-after, hint, and legend are visible. Open and close the enlarged diagram on both sizes.

- [ ] **Step 3: Sweep all forty steps in the actual browser**

For every plane, navigate from step 1 through step 5 using “下一則”. Check that the silhouette changes by model profile and action, no path leaves the SVG, and each diagram matches its instruction. Record any mismatch by exact diagram key before fixing it.

- [ ] **Step 4: Run accessibility and regression checks**

Verify keyboard focus for zoom, close, previous, and next controls; inspect SVG `role`, `title`, `desc`, and `aria-label`; confirm no information depends on color alone; verify themes, favorites, filters, direct file opening, and unknown routes still work.

- [ ] **Step 5: Invoke `superpowers:requesting-code-review` and address only verified findings**

Provide the reviewer the approved spec, this plan, commit range from `823a8a7` to `HEAD`, and the latest browser evidence. If a failure or bug appears, invoke `superpowers:systematic-debugging` before changing implementation.

- [ ] **Step 6: Invoke `superpowers:verification-before-completion`**

Re-run the full browser suite, `git diff --check`, `git status --short --branch`, and inspect the final diff. Do not claim completion unless the output is current and clean.

- [ ] **Step 7: Use `superpowers:finishing-a-development-branch`**

Present the verified branch state and integration choices. Do not push unless the user explicitly requests it; before any push, display remote, branch, and commit as required by the project rules.
