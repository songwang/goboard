const alpha = 'ABCDEFGHJKLMNOPQRSTUVWXYZ'

export type Vertex = [number, number]
export type Sign = 0 | -1 | 1
export type SignMap = Sign[][]

function vertexEquals([x1, y1]: Vertex, [x2, y2]: Vertex): boolean {
    return x1 === x2 && y1 === y2
}

interface KoInfo {
    sign: Sign
    vertex: Vertex
}

class GoGame {
    signMap: SignMap
    height: number
    width: number
    private _players: Sign[]
    private _captures: number[]
    private _koInfo: KoInfo

    constructor(signMap: SignMap = []) {
        this.signMap = signMap
        this.height = signMap.length
        this.width = this.height === 0 ? 0 : signMap[0].length

        if (signMap.some(row => row.length !== this.width)) {
            throw new Error('signMap is not well-formed')
        }

        this._players = [1, -1]
        this._captures = [0, 0]
        this._koInfo = { sign: 0, vertex: [-1, -1] }
    }

    get(vertex: Vertex): number | null {
        const [x, y] = vertex
        return this.signMap[y] != null ? this.signMap[y][x] : null
    }

    set(vertex: Vertex, sign: Sign): GoGame {
        const [x, y] = vertex
        if (this.has(vertex)) {
            this.signMap[y][x] = sign
        }

        return this
    }

    has(vertex: Vertex): boolean {
        const [x, y] = vertex
        return 0 <= x && x < this.width && 0 <= y && y < this.height
    }

    clear(): GoGame {
        this.signMap = this.signMap.map(row => row.map(() => 0))
        return this
    }

    makeMove(
        sign: Sign,
        vertex: Vertex,
        {
            preventSuicide = false,
            preventOverwrite = false,
            preventKo = false
        }: {
            preventSuicide?: boolean
            preventOverwrite?: boolean
            preventKo?: boolean
        } = {}
    ): GoGame {
        const move = this.clone()
        if (sign === 0 || !this.has(vertex)) return move

        if (preventOverwrite && !!this.get(vertex)) {
            throw new Error('Overwrite prevented')
        }

        const normalizedSign: Sign = sign > 0 ? 1 : -1

        if (
            preventKo
            && this._koInfo.sign === normalizedSign
            && vertexEquals(this._koInfo.vertex, vertex)
        ) {
            throw new Error('Ko prevented')
        }

        move.set(vertex, normalizedSign)

        // Remove captured stones
        const neighbors = move.getNeighbors(vertex)
        const deadStones: Vertex[] = []
        const oppositeSign: Sign = normalizedSign === 1 ? -1 : 1
        const deadNeighbors = neighbors.filter(n => move.get(n) === oppositeSign && !move.hasLiberties(n))

        for (const n of deadNeighbors) {
            if (move.get(n) === 0) continue

            for (const c of move.getChain(n)) {
                move.set(c, 0).setCaptures(normalizedSign, x => x + 1)
                deadStones.push(c)
            }
        }

        // Detect future ko
        const liberties = move.getLiberties(vertex)
        const hasKo = deadStones.length === 1
            && liberties.length === 1
            && vertexEquals(liberties[0], deadStones[0])
            && neighbors.every(n => move.get(n) !== normalizedSign)

        move._koInfo = {
            sign: hasKo ? oppositeSign : 0,
            vertex: hasKo ? deadStones[0] : [-1, -1]
        }

        // Detect suicide
        if (deadStones.length === 0 && liberties.length === 0) {
            if (preventSuicide) {
                throw new Error('Suicide prevented')
            }

            for (const c of move.getChain(vertex)) {
                move.set(c, 0).setCaptures(oppositeSign, x => x + 1)
            }
        }

        return move
    }

    analyzeMove(
        sign: Sign,
        vertex: Vertex
    ): {
        pass: boolean
        overwrite: boolean
        capturing: boolean
        suicide: boolean
        ko: boolean
    } {
        const pass = sign === 0 || !this.has(vertex)
        const overwrite = !pass && !!this.get(vertex)
        const ko = this._koInfo.sign === sign && vertexEquals(this._koInfo.vertex, vertex)

        const originalSign = this.get(vertex) as Sign
        this.set(vertex, sign)

        const oppositeSign: Sign = sign === 1 ? -1 : 1
        const capturing = !pass && this.getNeighbors(vertex)
            .some(n => this.get(n) === oppositeSign && !this.hasLiberties(n))
        const suicide = !pass && !capturing && !this.hasLiberties(vertex)

        this.set(vertex, originalSign)

        return { pass, overwrite, capturing, suicide, ko }
    }

    getCaptures(sign: Sign): number {
        const index = this._players.indexOf(sign)
        if (index < 0) return 0

        return this._captures[index]
    }

    setCaptures(
        sign: Sign,
        mutator: number | ((prevCaptures: number) => number)
    ): GoGame {
        const index = this._players.indexOf(sign)

        if (index >= 0) {
            this._captures[index] = typeof mutator === 'function'
                ? mutator(this._captures[index])
                : mutator
        }

        return this
    }

    isSquare(): boolean {
        return this.width === this.height
    }

    isEmpty(): boolean {
        return this.signMap.every(row => row.every(x => !x))
    }

    isValid(): boolean {
        const liberties: { [key: string]: boolean } = {}

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const vertex: Vertex = [x, y]
                const vertexKey = `${x},${y}`
                if (this.get(vertex) === 0 || vertexKey in liberties) continue
                if (!this.hasLiberties(vertex)) return false

                this.getChain(vertex).forEach(v => liberties[`${v[0]},${v[1]}`] = true)
            }
        }

        return true
    }

    getDistance(vertex1: Vertex, vertex2: Vertex): number {
        const [x1, y1] = vertex1
        const [x2, y2] = vertex2
        return Math.abs(x2 - x1) + Math.abs(y2 - y1)
    }

    getNeighbors(vertex: Vertex): Vertex[] {
        if (!this.has(vertex)) return []

        const [x, y] = vertex
        return [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]
            .filter(v => this.has(v as Vertex)) as Vertex[]
    }

    getConnectedComponent(
        vertex: Vertex,
        predicate: (vertex: Vertex) => boolean,
        result: Vertex[] | null = null
    ): Vertex[] {
        if (!this.has(vertex)) return []
        if (!result) result = [vertex]

        // Recursive depth-first search
        for (const v of this.getNeighbors(vertex)) {
            if (!predicate(v)) continue
            if (result.some(w => vertexEquals(w, v))) continue

            result.push(v)
            this.getConnectedComponent(v, predicate, result)
        }

        return result
    }

    getChain(vertex: Vertex): Vertex[] {
        const sign = this.get(vertex)
        return this.getConnectedComponent(vertex, v => this.get(v) === sign)
    }

    getRelatedChains(vertex: Vertex): Vertex[] {
        if (!this.has(vertex) || this.get(vertex) === 0) return []

        const signs = [this.get(vertex), 0]
        const area = this.getConnectedComponent(vertex, v => signs.includes(this.get(v) as number))

        return area.filter(v => this.get(v) === this.get(vertex))
    }

    getLiberties(vertex: Vertex): Vertex[] {
        if (!this.has(vertex) || this.get(vertex) === 0) return []

        const chain = this.getChain(vertex)
        const liberties: Vertex[] = []
        const added: { [key: string]: boolean } = {}

        for (const c of chain) {
            const freeNeighbors = this.getNeighbors(c).filter(n => this.get(n) === 0)

            liberties.push(...freeNeighbors.filter(n => {
                const key = `${n[0]},${n[1]}`
                return !(key in added)
            }))
            freeNeighbors.forEach(n => added[`${n[0]},${n[1]}`] = true)
        }

        return liberties
    }

    hasLiberties(vertex: Vertex, visited: { [key: string]: boolean } = {}): boolean {
        const sign = this.get(vertex)
        if (!this.has(vertex) || sign === 0) return false

        const vertexKey = `${vertex[0]},${vertex[1]}`
        if (vertexKey in visited) return false
        const neighbors = this.getNeighbors(vertex)

        if (neighbors.some(n => this.get(n) === 0))
            return true

        visited[vertexKey] = true

        return neighbors
            .filter(n => this.get(n) === sign)
            .some(n => this.hasLiberties(n, visited))
    }

    clone(): GoGame {
        const result = new GoGame(this.signMap.map(row => [...row]))
            .setCaptures(1, this.getCaptures(1))
            .setCaptures(-1, this.getCaptures(-1))

        result._koInfo = { ...this._koInfo, vertex: [...this._koInfo.vertex] as Vertex }

        return result
    }

    diff(board: GoGame): Vertex[] | null {
        if (board.width !== this.width || board.height !== this.height) {
            return null
        }

        const result: Vertex[] = []

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const vertex: Vertex = [x, y]
                const sign = board.get(vertex)
                if (this.get(vertex) === sign) continue

                result.push(vertex)
            }
        }

        return result
    }

    stringifyVertex(vertex: Vertex): string {
        if (!this.has(vertex)) return ''
        return alpha[vertex[0]] + (this.height - vertex[1])
    }

    parseVertex(coord: string): Vertex {
        if (coord.length < 2) return [-1, -1]

        const x = alpha.indexOf(coord[0].toUpperCase())
        const y = this.height - +coord.slice(1)
        const v: Vertex = [x, y]

        return this.has(v) ? v : [-1, -1]
    }

    getHandicapPlacement(count: number, { tygem = false }: { tygem?: boolean } = {}): Vertex[] {
        if (Math.min(this.width, this.height) <= 6 || count < 2) return []

        const [nearX, nearY] = [this.width, this.height].map(x => x >= 13 ? 3 : 2)
        const [farX, farY] = [this.width - nearX - 1, this.height - nearY - 1]
        const [middleX, middleY] = [this.width, this.height].map(x => (x - 1) / 2)

        const result: Vertex[] = !tygem
            ? [[nearX, farY], [farX, nearY], [farX, farY], [nearX, nearY]]
            : [[nearX, farY], [farX, nearY], [nearX, nearY], [farX, farY]]

        if (this.width % 2 !== 0 && this.height % 2 !== 0 && this.width !== 7 && this.height !== 7) {
            if (count === 5) result.push([middleX, middleY])
            result.push([nearX, middleY], [farX, middleY])

            if (count === 7) result.push([middleX, middleY])
            result.push([middleX, nearY], [middleX, farY], [middleX, middleY])
        } else if (this.width % 2 !== 0 && this.width !== 7) {
            result.push([middleX, nearY], [middleX, farY])
        } else if (this.height % 2 !== 0 && this.height !== 7) {
            result.push([nearX, middleY], [farX, middleY])
        }

        return result.slice(0, count)
    }

    static fromDimensions(width: number, height?: number): GoGame {
        if (height == null) height = width

        const signMap: SignMap = [...Array(height)].map(() => Array(width).fill(0))

        return new GoGame(signMap)
    }
}

export default GoGame