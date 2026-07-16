const DEFAULT_DIAGRAM_ID = 'crease-center';

const DIAGRAMS = {
  'crease-center': {
    paper: 'M32 28H208L222 44V150L208 166H32L18 150V44Z',
    shadow: 'M38 154L208 154L196 164H50Z',
    folds: [
      'M56 44L184 136',
      'M184 44L56 136',
    ],
    arrows: [
      'M120 40L120 20',
      'M112 28L120 18L128 28',
    ],
    accents: [
      'M78 76L162 76',
    ],
  },
  'fold-nose': {
    paper: 'M32 28H208L222 44V150L208 166H32L18 150V44Z',
    shadow: 'M44 150L120 118L196 150L184 160H56Z',
    folds: [
      'M120 40L120 128',
      'M60 92L120 52L180 92',
    ],
    arrows: [
      'M120 44L120 24',
      'M112 32L120 22L128 32',
      'M80 102L120 128L160 102',
    ],
    accents: [
      'M92 66L148 66',
      'M96 112L144 112',
    ],
  },
  'shape-wing': {
    paper: 'M32 28H208L222 44V150L208 166H32L18 150V44Z',
    shadow: 'M44 146L116 110L190 146L176 160H58Z',
    folds: [
      'M48 74L120 92L192 74',
      'M52 126L120 94L188 126',
    ],
    arrows: [
      'M52 84L88 100',
      'M184 84L152 100',
      'M120 48L120 26',
    ],
    accents: [
      'M78 66L162 66',
      'M72 138L168 138',
    ],
  },
  'reinforce-body': {
    paper: 'M32 28H208L222 44V150L208 166H32L18 150V44Z',
    shadow: 'M40 150H200L190 160H50Z',
    folds: [
      'M72 48L72 146',
      'M168 48L168 146',
      'M72 92L168 92',
    ],
    arrows: [
      'M72 52L72 32',
      'M64 40L72 30L80 40',
      'M168 52L168 32',
      'M160 40L168 30L176 40',
    ],
    accents: [
      'M92 72L148 72',
      'M92 112L148 112',
    ],
  },
  'finish-tip': {
    paper: 'M32 28H208L222 44V150L208 166H32L18 150V44Z',
    shadow: 'M84 148L120 120L156 148L144 160H96Z',
    folds: [
      'M120 40L120 120',
      'M84 96L120 60L156 96',
    ],
    arrows: [
      'M120 44L120 24',
      'M112 32L120 22L128 32',
      'M96 104L120 128L144 104',
    ],
    accents: [
      'M92 130L148 130',
      'M104 78L136 78',
    ],
  },
  'master-lock': {
    paper: 'M32 28H208L222 44V150L208 166H32L18 150V44Z',
    shadow: 'M54 148L120 118L186 148L172 160H68Z',
    folds: [
      'M64 54L120 92L176 54',
      'M64 122L120 92L176 122',
      'M92 60L120 96L148 60',
    ],
    arrows: [
      'M120 46L120 24',
      'M112 32L120 22L128 32',
      'M62 110L92 92',
      'M178 110L148 92',
    ],
    accents: [
      'M84 76L156 76',
      'M92 106L148 106',
    ],
  },
};

function escapeAttribute(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function renderPaths(paths, className) {
  return paths.map(path => `<path class="${className}" d="${path}" />`).join('');
}

function renderDiagramContent(definition) {
  return [
    `<path class="diagram-shadow" d="${definition.shadow}" />`,
    `<path class="diagram-paper" d="${definition.paper}" />`,
    renderPaths(definition.folds, 'diagram-fold'),
    renderPaths(definition.accents, 'diagram-accent'),
    renderPaths(definition.arrows, 'diagram-arrow'),
  ].join('');
}

export function renderFoldDiagram(diagramId, label) {
  const definition = DIAGRAMS[diagramId] ?? DIAGRAMS[DEFAULT_DIAGRAM_ID];
  const ariaLabel = escapeAttribute(label ?? '');

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" role="img" focusable="false" aria-label="',
    ariaLabel,
    '">',
    `<title>${ariaLabel}</title>`,
    '<g fill="none" stroke-linecap="round" stroke-linejoin="round">',
    renderDiagramContent(definition),
    '</g>',
    '</svg>',
  ].join('');
}
