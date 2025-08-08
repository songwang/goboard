export interface SGFMove {
  color: 'B' | 'W'; // Black or White
  position: string; // SGF coordinate like "dd", "pd", etc.
  moveNumber: number;
}

export interface SGFGameInfo {
  playerBlack?: string;
  playerWhite?: string;
  result?: string;
  date?: string;
  event?: string;
  round?: string;
  komi?: number;
  handicap?: number;
  boardSize: number;
}

export interface SGFGame {
  gameInfo: SGFGameInfo;
  moves: SGFMove[];
}

class SGFParser {
  private pos = 0;
  private sgf = '';

  parse(sgfContent: string): SGFGame {
    this.sgf = sgfContent.trim();
    this.pos = 0;

    const gameTree = this.parseGameTree();
    return this.extractGame(gameTree);
  }

  private parseGameTree(): any {
    this.skipWhitespace();
    if (this.sgf[this.pos] !== '(') {
      throw new Error('SGF must start with (');
    }
    this.pos++; // skip '('

    const nodes = [];
    
    while (this.pos < this.sgf.length && this.sgf[this.pos] !== ')') {
      this.skipWhitespace();
      if (this.sgf[this.pos] === ';') {
        nodes.push(this.parseNode());
      } else if (this.sgf[this.pos] === '(') {
        // Handle variations (skip for now)
        this.skipVariation();
      } else {
        this.pos++;
      }
    }

    if (this.sgf[this.pos] === ')') {
      this.pos++; // skip ')'
    }

    return nodes;
  }

  private parseNode(): any {
    this.pos++; // skip ';'
    this.skipWhitespace();

    const node: any = {};

    while (this.pos < this.sgf.length && 
           this.sgf[this.pos] !== ';' && 
           this.sgf[this.pos] !== ')' && 
           this.sgf[this.pos] !== '(') {
      
      const property = this.parseProperty();
      if (property) {
        node[property.key] = property.values;
      }
      this.skipWhitespace();
    }

    return node;
  }

  private parseProperty(): { key: string; values: string[] } | null {
    this.skipWhitespace();
    
    // Parse property key
    const keyStart = this.pos;
    while (this.pos < this.sgf.length && 
           /[A-Z]/.test(this.sgf[this.pos])) {
      this.pos++;
    }
    
    if (keyStart === this.pos) return null;
    
    const key = this.sgf.substring(keyStart, this.pos);
    const values: string[] = [];

    this.skipWhitespace();

    // Parse property values
    while (this.pos < this.sgf.length && this.sgf[this.pos] === '[') {
      values.push(this.parseValue());
      this.skipWhitespace();
    }

    return { key, values };
  }

  private parseValue(): string {
    if (this.sgf[this.pos] !== '[') {
      throw new Error('Expected [');
    }
    this.pos++; // skip '['

    let value = '';
    while (this.pos < this.sgf.length && this.sgf[this.pos] !== ']') {
      if (this.sgf[this.pos] === '\\') {
        this.pos++; // skip escape character
        if (this.pos < this.sgf.length) {
          value += this.sgf[this.pos];
        }
      } else {
        value += this.sgf[this.pos];
      }
      this.pos++;
    }

    if (this.sgf[this.pos] === ']') {
      this.pos++; // skip ']'
    }

    return value;
  }

  private skipWhitespace(): void {
    while (this.pos < this.sgf.length && /\s/.test(this.sgf[this.pos])) {
      this.pos++;
    }
  }

  private skipVariation(): void {
    let depth = 0;
    while (this.pos < this.sgf.length) {
      if (this.sgf[this.pos] === '(') {
        depth++;
      } else if (this.sgf[this.pos] === ')') {
        depth--;
        if (depth === 0) {
          this.pos++;
          break;
        }
      }
      this.pos++;
    }
  }

  private extractGame(nodes: any[]): SGFGame {
    const gameInfo: SGFGameInfo = {
      boardSize: 19 // default
    };
    const moves: SGFMove[] = [];
    let moveNumber = 0;

    for (const node of nodes) {
      // Extract game info from root node
      if (node.SZ) gameInfo.boardSize = parseInt(node.SZ[0]);
      if (node.PB) gameInfo.playerBlack = node.PB[0];
      if (node.PW) gameInfo.playerWhite = node.PW[0];
      if (node.RE) gameInfo.result = node.RE[0];
      if (node.DT) gameInfo.date = node.DT[0];
      if (node.EV) gameInfo.event = node.EV[0];
      if (node.RO) gameInfo.round = node.RO[0];
      if (node.KM) gameInfo.komi = parseFloat(node.KM[0]);
      if (node.HA) gameInfo.handicap = parseInt(node.HA[0]);

      // Extract moves
      if (node.B) {
        moves.push({
          color: 'B',
          position: node.B[0],
          moveNumber: ++moveNumber
        });
      }
      if (node.W) {
        moves.push({
          color: 'W',
          position: node.W[0],
          moveNumber: ++moveNumber
        });
      }
    }

    return { gameInfo, moves };
  }

  // Convert SGF coordinate to GoGame coordinate
  static sgfToVertex(sgfCoord: string, boardSize: number): [number, number] {
    if (!sgfCoord || sgfCoord === '' || sgfCoord === 'tt') {
      return [-1, -1]; // Pass move
    }

    if (sgfCoord.length !== 2) {
      throw new Error(`Invalid SGF coordinate: ${sgfCoord}`);
    }

    const x = sgfCoord.charCodeAt(0) - 'a'.charCodeAt(0);
    const y = sgfCoord.charCodeAt(1) - 'a'.charCodeAt(0);

    if (x < 0 || x >= boardSize || y < 0 || y >= boardSize) {
      throw new Error(`SGF coordinate out of bounds: ${sgfCoord}`);
    }

    return [x, y];
  }

  // Convert GoGame coordinate to SGF coordinate
  static vertexToSgf(vertex: [number, number], boardSize: number): string {
    const [x, y] = vertex;
    
    if (x === -1 && y === -1) {
      return ''; // Pass move
    }

    if (x < 0 || x >= boardSize || y < 0 || y >= boardSize) {
      throw new Error(`Vertex out of bounds: [${x}, ${y}]`);
    }

    return String.fromCharCode('a'.charCodeAt(0) + x) + 
           String.fromCharCode('a'.charCodeAt(0) + y);
  }
}

export default SGFParser;