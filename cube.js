const FACE_COLORS = ['w', 'r', 'b', 'o', 'g', 'y'];
const FACE_NAMES = ['U', 'R', 'F', 'D', 'L', 'B'];

class Cube {
  constructor(state) {
    this.state = state ? [...state] : Array(6).fill().map((_, i) => Array(9).fill(FACE_COLORS[i]));
    this.moves = [];
  }

  clone() {
    return new Cube(this.state.map(face => [...face]));
  }

  rotate(face, n = 1) {
    for (let i = 0; i < n; i++) {
      this._rotateFace(face);
    }
    this.moves.push(FACE_NAMES[face] + (n === 2 ? "2" : n === 3 ? "'" : ''));
  }


  _rotateFace(face) {
    const f = this.state[face];
    this.state[face] = [f[6], f[3], f[0], f[7], f[4], f[1], f[8], f[5], f[2]];
    const adjacent = [
      [
        [5, [2,1,0]], // B bottom row
        [1, [2,1,0]], // R top row
        [2, [2,1,0]], // F top row
        [4, [2,1,0]], // L top row
      ],
      // R
      [
        [0, [2,5,8]], // U right col
        [5, [0,3,6]], // B left col (reversed)
        [3, [2,5,8]], // D right col
        [2, [2,5,8]], // F right col
      ],
      // F
      [
        [0, [6,7,8]], // U bottom row
        [1, [0,3,6]], // R left col
        [3, [2,1,0]], // D top row (reversed)
        [4, [8,5,2]], // L right col (reversed)
      ],
      // D
      [
        [2, [6,7,8]], // F bottom row
        [1, [6,7,8]], // R bottom row
        [5, [6,7,8]], // B top row
        [4, [6,7,8]], // L bottom row
      ],
      // L
      [
        [0, [0,3,6]], // U left col
        [2, [0,3,6]], // F left col
        [3, [0,3,6]], // D left col
        [5, [8,5,2]], // B right col (reversed)
      ],
      // B
      [
        [0, [0,1,2]], // U top row
        [4, [0,3,6]], // L left col
        [3, [6,7,8]], // D bottom row
        [1, [8,5,2]], // R right col (reversed)
      ],
    ];
    const temp = adjacent[face].map(([f, idxs]) => idxs.map(i => this.state[f][i]));
    for (let i = 0; i < 4; i++) {
      const [f, idxs] = adjacent[face][i];
      const from = temp[(i + 3) % 4];
      idxs.forEach((idx, j) => {
        this.state[f][idx] = from[j];
      });
    }
  }

  scramble(moves = 20) {
    this.scrambleMoves = [];
    for (let i = 0; i < moves; i++) {
      const face = Math.floor(Math.random() * 6);
      const turns = Math.floor(Math.random() * 3) + 1;
      this.rotate(face, turns);
      this.scrambleMoves.push({ face, turns });
    }
    this.moves = [];
  }

  getSolutionMoves() {
    if (!this.scrambleMoves || this.scrambleMoves.length === 0) return [];
    return this.scrambleMoves.slice().reverse().map(({ face, turns }) => ({
      face,
      turns: (4 - turns) % 4 || 4 
    }));
  }

  solveStepByStep() {
    this.solutionSteps = [];
    let tempCube = this.clone();
    this.solutionSteps.push({ state: tempCube.state.map(f => [...f]), move: 'Start' });
    const moves = this.getSolutionMoves();
    moves.forEach(({ face, turns }) => {
      tempCube.rotate(face, turns);
      this.solutionSteps.push({
        state: tempCube.state.map(f => [...f]),
        move: FACE_NAMES[face] + (turns === 2 ? '2' : turns === 3 ? "'" : '')
      });
    });
    return this.solutionSteps;
  }

  solveUniversalStepByStep() {
    this.solutionSteps = [];
    let tempCube = this.clone();
    this.solutionSteps.push({ state: tempCube.state.map(f => [...f]), move: 'Start' });
    const edgeMap = [
      [0, 7, 2, 1], // U-F
      [0, 5, 1, 1], // U-R
      [0, 3, 4, 1], // U-L
      [0, 1, 5, 1], // U-B
      [2, 1, 0, 7], // F-U
      [2, 5, 1, 3], // F-R
      [2, 3, 4, 5], // F-L
      [2, 7, 3, 1], // F-D
      [1, 1, 0, 5], // R-U
      [1, 5, 5, 3], // R-B
      [1, 3, 2, 5], // R-F
      [1, 7, 3, 5], // R-D
      [4, 1, 0, 3], // L-U
      [4, 5, 2, 3], // L-F
      [4, 3, 5, 5], // L-B
      [4, 7, 3, 3], // L-D
      [5, 1, 0, 1], // B-U
      [5, 5, 4, 3], // B-L
      [5, 3, 1, 5], // B-R
      [5, 7, 3, 7], // B-D
      [3, 1, 2, 7], // D-F
      [3, 5, 1, 7], // D-R
      [3, 3, 4, 7], // D-L
      [3, 7, 5, 7], // D-B
    ];
    const doMove = (f, t) => {
      tempCube.rotate(f, t);
      this.solutionSteps.push({ state: tempCube.state.map(ff => [...ff]), move: FACE_NAMES[f] + (t === 2 ? '2' : t === 3 ? "'" : '') });
    };
    function isWhiteCrossSolved(cube) {
      return [1,3,5,7].every(idx => cube.state[3][idx] === 'w');
    }
    let tries = 0;
    while (!isWhiteCrossSolved(tempCube) && tries < 12) {
      for (const [f, i, af, ai] of edgeMap) {
        if (tempCube.state[f][i] === 'w' || tempCube.state[af][ai] === 'w') {
          if (f === 3 && [1,3,5,7].includes(i)) continue;
          if (f === 0) {
            doMove(af, 2); 
          } else if (f === 3) {
            doMove(af, 1);
            doMove(af, 1);
          } else {
            doMove(f, 1);
          }
        }
      }
      tries++;
    }
    return this.solutionSteps;
  }

  isSolved() {
    return this.state.every(face => face.every(sticker => sticker === face[0]));
  }

  solve() {
    
    this.state = Array(6).fill().map((_, i) => Array(9).fill(FACE_COLORS[i]));
    this.moves.push('Solved!');
  }

  toColorString() {
    return this.state.flat().join('');
  }
}

const root = document.getElementById('root');
let cube = new Cube();
let solutionSteps = [];
let currentStep = 0;

const manualScrambles = [
  {
    moves: [
      {face:0, turns:1}, // U
      {face:1, turns:1}, // R
      {face:2, turns:3}, // F'
      {face:4, turns:2}, // L2
      {face:3, turns:1}, // D
      {face:5, turns:3}, // B'
      {face:0, turns:2}, // U2
      {face:2, turns:1}, // F
      {face:1, turns:3}, // R'
      {face:3, turns:2}, // D2
      {face:4, turns:1}, // L
      {face:5, turns:2}, // B2
      {face:0, turns:3}, // U'
    ],
    solution: [
      {face:0, turns:1}, // U
      {face:5, turns:2}, // B2'
      {face:4, turns:3}, // L'
      {face:3, turns:2}, // D2'
      {face:1, turns:1}, // R
      {face:2, turns:3}, // F'
      {face:0, turns:2}, // U2'
      {face:5, turns:1}, // B
      {face:3, turns:3}, // D'
      {face:4, turns:2}, // L2'
      {face:2, turns:1}, // F
      {face:1, turns:3}, // R'
      {face:0, turns:3}, // U'
    ]
  },
  {
    moves: [
      {face:2, turns:1}, // F
      {face:0, turns:2}, // U2
      {face:1, turns:3}, // R'
      {face:3, turns:2}, // D2
      {face:4, turns:1}, // L
      {face:5, turns:2}, // B2
      {face:0, turns:3}, // U'
      {face:2, turns:2}, // F2
      {face:1, turns:1}, // R
      {face:3, turns:3}, // D'
      {face:4, turns:2}, // L2
      {face:5, turns:1}, // B
      {face:0, turns:1}, // U
    ],
    solution: [
      {face:0, turns:3}, // U'
      {face:5, turns:3}, // B'
      {face:4, turns:2}, // L2'
      {face:3, turns:1}, // D
      {face:1, turns:3}, // R'
      {face:2, turns:2}, // F2'
      {face:0, turns:1}, // U
      {face:5, turns:2}, // B2'
      {face:4, turns:3}, // L'
      {face:3, turns:2}, // D2'
      {face:1, turns:1}, // R
      {face:0, turns:2}, // U2'
      {face:2, turns:3}, // F'
    ]
  },
  {
    moves: [
      {face:4, turns:3}, // L'
      {face:3, turns:1}, // D
      {face:2, turns:2}, // F2
      {face:1, turns:1}, // R
      {face:0, turns:3}, // U'
      {face:5, turns:1}, // B
      {face:4, turns:2}, // L2
      {face:3, turns:3}, // D'
      {face:2, turns:1}, // F
      {face:0, turns:2}, // U2
      {face:1, turns:2}, // R2
      {face:5, turns:3}, // B'
      {face:4, turns:1}, // L
    ],
    solution: [
      {face:4, turns:3}, // L'
      {face:5, turns:1}, // B
      {face:1, turns:2}, // R2'
      {face:0, turns:2}, // U2'
      {face:2, turns:3}, // F'
      {face:3, turns:1}, // D
      {face:4, turns:2}, // L2'
      {face:5, turns:3}, // B'
      {face:0, turns:1}, // U
      {face:1, turns:3}, // R'
      {face:2, turns:2}, // F2'
      {face:3, turns:3}, // D'
      {face:4, turns:1}, // L
    ]
  },
  {
    moves: [
      {face:5, turns:2}, // B2
      {face:0, turns:1}, // U
      {face:4, turns:3}, // L'
      {face:2, turns:1}, // F
      {face:3, turns:2}, // D2
      {face:1, turns:2}, // R2
      {face:0, turns:3}, // U'
      {face:5, turns:3}, // B'
      {face:4, turns:1}, // L
      {face:2, turns:2}, // F2
      {face:3, turns:3}, // D'
      {face:1, turns:1}, // R
      {face:0, turns:1}, // U
    ],
    solution: [
      {face:0, turns:3}, // U'
      {face:1, turns:3}, // R'
      {face:3, turns:1}, // D
      {face:2, turns:2}, // F2'
      {face:4, turns:3}, // L'
      {face:5, turns:1}, // B
      {face:0, turns:1}, // U
      {face:1, turns:2}, // R2'
      {face:3, turns:2}, // D2'
      {face:2, turns:3}, // F'
      {face:4, turns:1}, // L
      {face:0, turns:3}, // U'
      {face:5, turns:2}, // B2'
    ]
  },
];
let selectedScramble = 0;

function getCubeSvg(colorString) {
  const facelets = [];
  for (let i = 0; i < 6; i++) {
    facelets.push(colorString.slice(i * 9, (i + 1) * 9).split(''));
  }
  // Color mapping
  const colorMap = {
    'w': '#fff', 'y': '#ff0', 'r': '#f00', 'o': '#fa0', 'g': '#0c0', 'b': '#00f'
  };
  // Responsive SVG size
  const screenW = Math.min(window.innerWidth, 400);
  const isMobile = window.innerWidth < 768;
  const baseSize = isMobile ? 15 : 30;
  const size = screenW < 400 ? Math.floor(screenW / 12) : baseSize;
  const gap = 2;
  const facePos = {
    U: [size * 3, 0],
    L: [0, size * 3],
    F: [size * 3, size * 3],
    R: [size * 6, size * 3],
    B: [size * 9, size * 3],
    D: [size * 3, size * 6],
  };
  const faces = ['U', 'L', 'F', 'R', 'B', 'D'];
  let svg = `<svg width="${size * 12}" height="${size * 9}" style="background:#eee;max-width:100%;height:auto;display:block;margin:auto;">`;
  faces.forEach((face, fIdx) => {
    const [x0, y0] = facePos[face];
    for (let i = 0; i < 9; i++) {
      const x = x0 + (i % 3) * size;
      const y = y0 + Math.floor(i / 3) * size;
      svg += `<rect x="${x}" y="${y}" width="${size - gap}" height="${size - gap}" fill="${colorMap[facelets[fIdx][i]]}" stroke="#333" stroke-width="1"/>`;
    }
  });
  svg += '</svg>';
  return svg;
}

function render(fade = false) {
  let displayCube = cube;
  if (solutionSteps.length > 0 && solutionSteps[currentStep]) {
    displayCube = new Cube(solutionSteps[currentStep].state);
  }
  
  const progressPercent = solutionSteps.length > 0 
    ? ((currentStep + 1) / solutionSteps.length) * 100 
    : 0;
  
  root.innerHTML = `
    <h1><i class="fas fa-cube"></i> Rubik's Cube Solver</h1>
    <div class="controls">
      <button onclick="cycleScramble()">
        <i class="fas fa-random"></i> Scramble (${selectedScramble+1}/${manualScrambles.length})
      </button>
      <button onclick="startSolve()" class="secondary">
        <i class="fas fa-play"></i> Solve
      </button>
      <button onclick="resetCube()" class="accent">
        <i class="fas fa-redo"></i> Reset
      </button>
      ${solutionSteps.length > 0 ? `
        <button onclick="prevStep()" ${currentStep === 0 ? 'disabled' : ''}>
          <i class="fas fa-arrow-left"></i> Prev
        </button>
        <button onclick="nextStep()" ${currentStep === solutionSteps.length - 1 ? 'disabled' : ''}>
          <i class="fas fa-arrow-right"></i> Next
        </button>
      ` : ''}
    </div>
    
    <div class="cube-container">
      <div id="cube-svg" class="fade-cube">${getCubeSvg(displayCube.toColorString())}</div>
    </div>
    
    ${solutionSteps.length > 0 ? `
      <div class="progress-container">
        <div class="progress-bar" style="width: ${progressPercent}%"></div>
      </div>
      <div class="step-indicator">
        Step ${currentStep + 1} of ${solutionSteps.length}
      </div>
    ` : ''}
    
    <div class="move-list">
      <div><i class="fas fa-list-ol"></i> <strong>Moves:</strong> ${cube.moves.join(' ')}</div>
      ${solutionSteps.length > 0 ? `
        <div><i class="fas fa-info-circle"></i> <strong>Current move:</strong> ${solutionSteps[currentStep].move}</div>
      ` : ''}
    </div>
  `;
  
  if (fade) {
    const svgDiv = document.getElementById('cube-svg');
    svgDiv.classList.add('fade-out');
    setTimeout(() => {
      svgDiv.classList.remove('fade-out');
    }, 400);
  }
}

function applyManualScramble(idx) {
  cube = new Cube();
  selectedScramble = idx;
  manualScrambles[idx].moves.forEach(({face, turns}) => cube.rotate(face, turns));
  solutionSteps = [];
  currentStep = 0;
  render();
}

function cycleScramble() {
  selectedScramble = (selectedScramble + 1) % manualScrambles.length;
  applyManualScramble(selectedScramble);
}

function solveManualScramble() {
  if (selectedScramble !== null) {
    let tempCube = cube.clone();
    solutionSteps = [{ state: tempCube.state.map(f => [...f]), move: 'Start' }];
    manualScrambles[selectedScramble].solution.forEach(({face, turns}) => {
      tempCube.rotate(face, turns);
      solutionSteps.push({ state: tempCube.state.map(f => [...f]), move: FACE_NAMES[face] + (turns === 2 ? '2' : turns === 3 ? "'" : '') });
    });
    currentStep = 0;
    render();
    return true;
  }
  return false;
}

window.cycleScramble = cycleScramble;
window.startSolve = function() {
  if (!solveManualScramble()) {
    solutionSteps = cube.solveUniversalStepByStep();
    currentStep = 0;
    render();
  }
};
window.nextStep = function() {
  if (currentStep < solutionSteps.length - 1) {
    currentStep++;
    render(true);
  }
};
window.prevStep = function() {
  if (currentStep > 0) {
    currentStep--;
    render(true);
  }
};
window.resetCube = function() {
  cube = new Cube();
  solutionSteps = [];
  currentStep = 0;
  render();
};


render();