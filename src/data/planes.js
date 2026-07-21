(function registerPlaneData(global) {
  'use strict';

  const namespace = global.PaperFlightAtlas ?? (global.PaperFlightAtlas = {});
  namespace.data = namespace.data ?? {};

  const difficultyLabels = Object.freeze({
  basic: '基礎',
  intermediate: '進階',
  advanced: '困難',
  master: '大師',
  });

  const difficultyOrder = Object.freeze(['basic', 'intermediate', 'advanced', 'master']);

  const planeData = [
  {
    id: 'classic-dart',
    name: 'Classic Dart',
    difficulty: 'basic',
    difficultyLabel: difficultyLabels.basic,
    summary: '經典箭型機身，折線清楚、重心穩定，是熟悉紙飛機摺法的最佳起點。',
    flightTraits: ['直線穩定', '中短距離', '容易控制'],
    materials: ['A4 紙 1 張', '平整桌面'],
    paperSize: 'A4 210 × 297 mm',
    time: '8 分鐘',
    steps: [
      {
        title: '對齊中心線',
        instruction: '將紙張左半部往右對摺，使左長邊貼齊右長邊，從中段向上下兩端壓平中心折痕後，再把紙張完全展開。',
        tip: '折痕越筆直，機身左右越平衡。',
        commonMistake: '只用手壓一下沒有確實壓平，會讓中線偏斜。',
        diagram: 'classic-dart-01',
      },
      {
        title: '收尖機頭',
        instruction: '把左右上角往中心線內摺，使兩個角尖對準中心線同一位置，再由上角向下壓平兩道銳利斜折痕。',
        tip: '兩側邊緣要在中線上整齊對齊。',
        commonMistake: '兩邊折角大小不一，造成機頭偏重一側。',
        diagram: 'classic-dart-02',
      },
      {
        title: '再次收窄機頭',
        instruction: '將左右斜邊再次往內摺，使兩條斜邊貼齊中心線，再由上往下壓平兩道長直折痕。',
        tip: '兩條斜邊要同時貼線，機頭才不會偏斜。',
        commonMistake: '只校正其中一側，會讓機頭重心偏掉。',
        diagram: 'classic-dart-03',
      },
      {
        title: '加強機身',
        instruction: '沿中心線把左半機身往右合起，使左右外輪廓完全重合，再從中段向機頭與機尾壓平中軸折痕。',
        tip: '加強後再檢查左右是否仍然對稱。',
        commonMistake: '只壓單邊，會把機身扭斜。',
        diagram: 'classic-dart-04',
      },
      {
        title: '折下兩側機翼',
        instruction: '將上層機翼往下摺，使翼緣對準機腹定位點，從翼根向翼尾壓平後翻面，另一側以相同角度重複。',
        tip: '兩側翼根高度一致，直線飛行才會穩定。',
        commonMistake: '兩側翼角不同，飛機會持續偏向一邊。',
        diagram: 'classic-dart-05',
      },
    ],
  },
  {
    id: 'beginner-glider',
    name: 'Beginner Glider',
    difficulty: 'basic',
    difficultyLabel: difficultyLabels.basic,
    summary: '翼面更寬的滑翔型紙飛機，適合練習放手角度與穩定的平飛感。',
    flightTraits: ['滑翔時間長', '起飛平順', '容錯度高'],
    materials: ['A4 紙 1 張', '平滑桌面', '尺或卡片'],
    paperSize: 'A4 210 × 297 mm',
    time: '10 分鐘',
    steps: [
      {
        title: '建立中心摺痕',
        instruction: '將紙張左半部往右對摺，使左長邊貼齊右長邊，從中段向上下兩端壓平中心折痕後，再把紙張完全展開。',
        tip: '中心線是一切對稱性的起點。',
        commonMistake: '折痕模糊，後續折線容易偏掉。',
        diagram: 'beginner-glider-01',
      },
      {
        title: '塑形機頭',
        instruction: '把左右上角往中心線內摺，使兩個角尖對準較低的中心定位點，再由上角向下壓平兩道柔和斜折痕。',
        tip: '機頭不要太尖，滑翔型更重視穩定。',
        commonMistake: '機頭過尖導致前端太重，容易下墜。',
        diagram: 'beginner-glider-02',
      },
      {
        title: '再次收攏斜邊',
        instruction: '將左右斜邊再次往內摺，使兩條斜邊貼齊中心線，再由上往下壓平較寬的對稱折痕。',
        tip: '保留較寬肩部，後續才能形成滑翔翼面。',
        commonMistake: '把兩側收得太窄，會減少滑翔機的翼面。',
        diagram: 'beginner-glider-03',
      },
      {
        title: '壓實主梁',
        instruction: '沿中心線把左半機身往右合起，使左右外輪廓完全重合，再從中段向機頭與機尾壓平主梁折痕。',
        tip: '主梁穩，滑翔時才不會左右抖動。',
        commonMistake: '只在外層按壓，中心層沒有貼緊。',
        diagram: 'beginner-glider-04',
      },
      {
        title: '折下寬幅機翼',
        instruction: '將上層寬翼往下摺，使翼緣對準較低的機腹定位點，壓平後翻面，另一側以相同角度重複。',
        tip: '翼面保持寬而平，才能延長滑翔時間。',
        commonMistake: '兩側翼根高低不同，會讓機體旋轉。',
        diagram: 'beginner-glider-05',
      },
    ],
  },
  {
    id: 'sky-arrow',
    name: 'Sky Arrow',
    difficulty: 'intermediate',
    difficultyLabel: difficultyLabels.intermediate,
    summary: '帶有俐落箭頭感的機型，速度與穩定性兼具，適合開始嘗試更銳利的線條。',
    flightTraits: ['中高速', '航向俐落', '穿透風性佳'],
    materials: ['A4 紙 1 張', '硬質桌面'],
    paperSize: 'A4 210 × 297 mm',
    time: '12 分鐘',
    steps: [
      {
        title: '對摺定位',
        instruction: '將紙張左半部往右對摺，使左長邊貼齊右長邊，從中段向上下兩端壓平中心折痕後，再把紙張完全展開。',
        tip: '對稱性會直接反映在飛行穩定度上。',
        commonMistake: '折好後沒有完全展平，後續會難以對齊。',
        diagram: 'sky-arrow-01',
      },
      {
        title: '折出銳角機頭',
        instruction: '把左右上角往中心線內摺，使兩個角尖對準較高的中心定位點，再由上角向下壓平兩道尖銳斜折痕。',
        tip: '銳角能降低前端風阻。',
        commonMistake: '角度太鈍，箭型特色會消失。',
        diagram: 'sky-arrow-02',
      },
      {
        title: '二次收尖',
        instruction: '將左右斜邊再次往內摺，使兩條斜邊緊貼中心線，再由機頭向下壓平銳利長折痕。',
        tip: '箭型機頭重視兩側線條筆直。',
        commonMistake: '斜邊沒有貼線，箭頭會失去對稱。',
        diagram: 'sky-arrow-03',
      },
      {
        title: '加固機身前段',
        instruction: '沿中心線把左半機身往右合起，使左右外輪廓完全重合，再從中段向機頭與機尾壓平中軸折痕。',
        tip: '重心往前有助於快速穿越空氣。',
        commonMistake: '前段壓得歪斜，飛行時會偏向一側。',
        diagram: 'sky-arrow-04',
      },
      {
        title: '折下細長箭翼',
        instruction: '將上層箭翼往下摺，使翼緣對準機腹定位點，壓平細長翼折痕後翻面，另一側以相同角度重複。',
        tip: '兩側箭翼保持窄直，可降低飛行阻力。',
        commonMistake: '翼根角度不一致，會破壞快速直線航向。',
        diagram: 'sky-arrow-05',
      },
    ],
  },
  {
    id: 'longtail',
    name: 'Longtail',
    difficulty: 'intermediate',
    difficultyLabel: difficultyLabels.intermediate,
    summary: '機尾延伸感明顯的滑行機型，適合喜歡長距離與尾流感的紙飛行表現。',
    flightTraits: ['延長滑行', '尾部穩定', '線條優雅'],
    materials: ['A4 紙 1 張', '尺'],
    paperSize: 'A4 210 × 297 mm',
    time: '11 分鐘',
    steps: [
      {
        title: '壓出中軸',
        instruction: '將紙張左半部往右對摺，使左長邊貼齊右長邊，從中段向上下兩端壓平中心折痕後，再把紙張完全展開。',
        tip: '長尾型最怕左右不對稱。',
        commonMistake: '中心線太淺，尾部容易跑偏。',
        diagram: 'longtail-01',
      },
      {
        title: '收斂前鼻',
        instruction: '把左右上角往中心線內摺，使兩個角尖對準中心線同一位置，再由上角向下壓平兩道修長斜折痕。',
        tip: '尖角太短會削弱長尾的視覺比例。',
        commonMistake: '左右折角沒有貼到中線。',
        diagram: 'longtail-02',
      },
      {
        title: '收攏長鼻斜邊',
        instruction: '將左右修長斜邊再次往內摺，使兩條斜邊貼齊中心線，再由機頭向長尾方向壓平折痕。',
        tip: '兩條長折痕平行，尾部才容易保持穩定。',
        commonMistake: '斜邊長度不一，會使長尾朝單側偏移。',
        diagram: 'longtail-03',
      },
      {
        title: '固定機腹',
        instruction: '沿中心線把左半機身往右合起，使左右外輪廓完全重合，再從中段向機頭與長尾壓平中軸折痕。',
        tip: '機腹越穩，尾部越不容易晃動。',
        commonMistake: '壓合時拉扯紙纖維，造成局部鬆散。',
        diagram: 'longtail-04',
      },
      {
        title: '折下長翼',
        instruction: '將上層長翼往下摺，使翼緣對準機腹定位點，沿長翼壓平後翻面，另一側以相同角度重複。',
        tip: '翼根與長尾折線保持平順，滑行會更穩。',
        commonMistake: '左右長翼角度不同，會讓尾部失去延伸感。',
        diagram: 'longtail-05',
      },
    ],
  },
  {
    id: 'swift-spear',
    name: 'Swift Spear',
    difficulty: 'advanced',
    difficultyLabel: difficultyLabels.advanced,
    summary: '追求高速穿透的機型，機頭與機身線條都更緊湊，適合穩定投擲。',
    flightTraits: ['高速穿透', '直線俐落', '對稱要求高'],
    materials: ['A4 紙 1 張', '桌面邊緣'],
    paperSize: 'A4 210 × 297 mm',
    time: '14 分鐘',
    steps: [
      {
        title: '確立骨線',
        instruction: '將紙張左半部往右對摺，使左長邊貼齊右長邊，從中段向上下兩端壓平銳利中心折痕後，再把紙張完全展開。',
        tip: '高速機型最需要精準骨線。',
        commonMistake: '骨線歪斜會讓高速時更明顯偏航。',
        diagram: 'swift-spear-01',
      },
      {
        title: '塑成槍尖',
        instruction: '把左右上角往中心線內摺，使兩個角尖對準較高的中心定位點，再由上角向下壓平兩道槍尖斜折痕。',
        tip: '前端集中可提升穿透感。',
        commonMistake: '機頭太厚，會增加前阻。',
        diagram: 'swift-spear-02',
      },
      {
        title: '二次收窄槍頭',
        instruction: '將左右長斜邊再次往內摺，使兩條斜邊緊貼中心線，再由尖端向下壓平窄直折痕。',
        tip: '收窄幅度一致，才能形成筆直槍型機頭。',
        commonMistake: '其中一邊沒有貼線，飛行路徑會彎掉。',
        diagram: 'swift-spear-03',
      },
      {
        title: '強化中段',
        instruction: '沿中心線把左半機身往右合起，使左右外輪廓完全重合，再從中段向機頭與機尾壓平緊實中軸折痕。',
        tip: '中段穩定是高速平飛的關鍵。',
        commonMistake: '中段鬆散會讓機體晃動放大。',
        diagram: 'swift-spear-04',
      },
      {
        title: '折下貼身窄翼',
        instruction: '將上層窄翼往下摺，使翼緣對準較高的機腹定位點，壓平後翻面，另一側以相同角度重複。',
        tip: '任何多餘皺褶都可能減慢速度。',
        commonMistake: '兩側窄翼角度不同，會拖慢槍型機身。',
        diagram: 'swift-spear-05',
      },
    ],
  },
  {
    id: 'loop-wing',
    name: 'Loop Wing',
    difficulty: 'advanced',
    difficultyLabel: difficultyLabels.advanced,
    summary: '帶有迴旋傾向的實驗型機體，透過機翼角度與重心配置形成明顯曲線。',
    flightTraits: ['迴旋感', '角度敏感', '可做路徑變化'],
    materials: ['A4 紙 1 張', '光滑桌面', '手掌'],
    paperSize: 'A4 210 × 297 mm',
    time: '15 分鐘',
    steps: [
      {
        title: '建立迴旋基準',
        instruction: '將紙張左半部往右對摺，使左長邊貼齊右長邊，從中段向上下兩端壓平中心折痕後，再把紙張完全展開。',
        tip: '迴旋型只要中心線失準，整體軌跡就會跑掉。',
        commonMistake: '以為曲線靠手勢就能修正，忽略基本中線。',
        diagram: 'loop-wing-01',
      },
      {
        title: '收緊前鼻',
        instruction: '把左右上角往中心線內摺，使兩個角尖對準中心線同一位置，再由上角向下壓平集中前鼻折痕。',
        tip: '前端重心會影響飛行時的轉向幅度。',
        commonMistake: '機頭過輕，機體只會飄不會轉。',
        diagram: 'loop-wing-02',
      },
      {
        title: '收攏迴旋斜邊',
        instruction: '將左右斜邊再次往內摺，使兩條斜邊貼齊中心線，再由上往下壓平對稱折痕。',
        tip: '先確保機身對稱，最後才調整迴旋翼角。',
        commonMistake: '兩側收攏角度差太大，會變成失控打轉。',
        diagram: 'loop-wing-03',
      },
      {
        title: '壓實核心',
        instruction: '沿中心線把左半機身往右合起，使左右外輪廓完全重合，再從中段向機頭與機尾壓平迴旋核心折痕。',
        tip: '核心一旦穩定，轉向會更可預測。',
        commonMistake: '只重視外翼，忽略核心的結構支撐。',
        diagram: 'loop-wing-04',
      },
      {
        title: '折下迴旋機翼',
        instruction: '將上層機翼往下摺，使翼緣對準迴旋定位點，壓平後翻面，另一側以相同角度重複。',
        tip: '想要迴旋，兩側基礎翼角仍須完全一致。',
        commonMistake: '兩邊翼角差異太大，會讓路徑失控。',
        diagram: 'loop-wing-05',
      },
    ],
  },
  {
    id: 'origami-falcon',
    name: 'Origami Falcon',
    difficulty: 'master',
    difficultyLabel: difficultyLabels.master,
    summary: '以銳利機頭與高辨識度翼面著稱的高階機型，像獵鷹一樣講究俯衝與穩定。',
    flightTraits: ['高精度', '俯衝銳利', '控制難度高'],
    materials: ['A4 紙 1 張', '尺', '平整硬板'],
    paperSize: 'A4 210 × 297 mm',
    time: '18 分鐘',
    steps: [
      {
        title: '鎖定中線',
        instruction: '將紙張左半部往右對摺，使左長邊貼齊右長邊，從中段向上下兩端壓平銳利中心折痕後，再把紙張完全展開。',
        tip: '大師級機型把對稱性看得最重。',
        commonMistake: '草率摺線會導致後面所有步驟都失準。',
        diagram: 'origami-falcon-01',
      },
      {
        title: '塑出獵鷹嘴',
        instruction: '把左右上角往中心線內摺，使兩個角尖對準較高的中心定位點，再由上角向下壓平厚實獵鷹嘴斜折痕。',
        tip: '前端形狀要銳利，重心也要集中。',
        commonMistake: '前端收得太散，會失去獵鷹輪廓。',
        diagram: 'origami-falcon-02',
      },
      {
        title: '收束獵鷹機頭',
        instruction: '將左右銳利斜邊再次往內摺，使兩條斜邊緊貼中心線，再由機頭向下壓平修長折痕。',
        tip: '斜邊線條越乾淨，速度與穩定越容易兼顧。',
        commonMistake: '機頭折痕過多，會破壞獵鷹輪廓。',
        diagram: 'origami-falcon-03',
      },
      {
        title: '強化背脊',
        instruction: '沿中心線把左半機身往右合起，使左右外輪廓完全重合，再從中段向機頭與機尾壓平獵鷹背脊折痕。',
        tip: '背脊穩，機頭才不會在高速中晃動。',
        commonMistake: '只壓表層，沒有讓內層真正貼合。',
        diagram: 'origami-falcon-04',
      },
      {
        title: '折下獵鷹長翼',
        instruction: '將上層長翼往下摺，使翼緣對準機腹定位點，壓平銳利翼折痕後翻面，另一側以相同角度重複。',
        tip: '長翼線條平順，尾端才會保持方向感。',
        commonMistake: '兩側翼角差異過大，會把獵鷹線條弄鈍。',
        diagram: 'origami-falcon-05',
      },
    ],
  },
  {
    id: 'wabi-sabi-crane',
    name: 'Wabi-Sabi Crane',
    difficulty: 'master',
    difficultyLabel: difficultyLabels.master,
    summary: '以留白與平衡感取勝的大師級機型，外觀含蓄卻能在飛行中展現柔和延展。',
    flightTraits: ['平衡細膩', '滑行柔順', '姿態優雅'],
    materials: ['A4 紙 1 張', '手掌', '安靜的桌面'],
    paperSize: 'A4 210 × 297 mm',
    time: '20 分鐘',
    steps: [
      {
        title: '安定中軸',
        instruction: '將紙張左半部往右對摺，使左長邊貼齊右長邊，從中段向上下兩端壓平平衡中心折痕後，再把紙張完全展開。',
        tip: '鶴型講究的是節制，不是繁複。',
        commonMistake: '中軸太浮，會讓機體失去安定感。',
        diagram: 'wabi-sabi-crane-01',
      },
      {
        title: '收攏鶴喙',
        instruction: '把左右上角往中心線內摺，使兩個角尖對準較低的中心定位點，再由上角向下壓平含蓄鶴喙斜折痕。',
        tip: '機頭精簡後，線條會更顯得從容。',
        commonMistake: '前端過厚，會破壞整體輕盈感。',
        diagram: 'wabi-sabi-crane-02',
      },
      {
        title: '收攏鶴首斜邊',
        instruction: '將左右柔長斜邊再次往內摺，使兩條斜邊貼齊中心線，再由鶴首向下壓平柔和折痕。',
        tip: '兩側斜邊要自然貼合，不要拉扯紙纖維。',
        commonMistake: '斜邊壓得太急，整體會失去鶴的平衡。',
        diagram: 'wabi-sabi-crane-03',
      },
      {
        title: '修整軀幹',
        instruction: '沿中心線把左半機身往右合起，使左右外輪廓完全重合，再從中段向機頭與鶴尾壓平柔韌中軸折痕。',
        tip: '大師級作品不是壓到最硬，而是穩中帶柔。',
        commonMistake: '過度壓折會讓紙纖維疲乏，飛行反而不穩。',
        diagram: 'wabi-sabi-crane-04',
      },
      {
        title: '折下寬長羽翼',
        instruction: '將上層羽翼往下輕摺，使翼緣對準機腹定位點，壓平後翻面，另一側以相同角度重複。',
        tip: '最後兩側羽翼要像留白一樣乾淨對稱。',
        commonMistake: '兩側翼角不一致，會破壞鶴型的餘韻。',
        diagram: 'wabi-sabi-crane-05',
      },
    ],
  },
  ];

  function deepFreeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.freeze(value);
      for (const item of Object.values(value)) {
        deepFreeze(item);
      }
    }
    return value;
  }

  const planes = Object.freeze(planeData.map(plane => deepFreeze(plane)));

  const difficultySummary = difficultyOrder.map(id => ({
    id,
    label: difficultyLabels[id],
    count: planes.filter(plane => plane.difficulty === id).length,
  }));

  const getPlaneById = id => planes.find(plane => plane.id === id);

  const getDifficultySummary = () => Object.freeze(difficultySummary.map(item => Object.freeze({ ...item })));

  const getFeaturedPlane = () => planes[0];

  namespace.data.planes = planes;
  namespace.data.difficultyLabels = difficultyLabels;
  namespace.data.difficultyOrder = difficultyOrder;
  namespace.data.getPlaneById = getPlaneById;
  namespace.data.getDifficultySummary = getDifficultySummary;
  namespace.data.getFeaturedPlane = getFeaturedPlane;
}(window));
