import Header from "./components/Header"
import { useState } from "react";
import { pointer } from 'd3';

// ─── Estruturas de dados ──────────────────────────────────────────────────────

class Node {
  id: string;
  name: number;
  coordinates: [number, number];
  edges: Edge[];
  constructor(name: number, coordinates: [number, number]) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.coordinates = coordinates;
    this.edges = [];
  }
  getId(): string { return this.id; }
  getName(): number { return this.name; }
  getCoordinates(): [number, number] { return this.coordinates; }
}

class Edge {
  to: string;
  weight: number;
  constructor(to: string, weight: number) {
    this.to = to;
    this.weight = weight;
  }
  setWeight(weight: number) { this.weight = weight; }
}

class Graph {
  nodes: Map<string, Node>;
  constructor() { this.nodes = new Map(); }
  addNode(node: Node) { this.nodes.set(node.id, node); }
  addEdge(a: string, b: string) {
    const nodeA = this.nodes.get(a);
    const nodeB = this.nodes.get(b);
    if (!nodeA || !nodeB) return;
    if (nodeA.edges.some(edge => edge.to === b)) return;
    const dist = Math.sqrt(
      Math.pow(nodeA.coordinates[0] - nodeB.coordinates[0], 2) +
      Math.pow(nodeA.coordinates[1] - nodeB.coordinates[1], 2)
    );
    nodeA.edges.push(new Edge(b, dist));
    nodeB.edges.push(new Edge(a, dist));
  }
  removeNode(id: string) {
    const node = this.nodes.get(id);
    if (!node) return;
    for (const current of this.nodes.values())
      current.edges = current.edges.filter(edge => edge.to !== id);
    this.nodes.delete(id);
  }
}


type TourResult = {
  tour: string[];
  totalCost: number;
  meta: string;
  error?: string;
};

type ApproxResult = TourResult & { mstCost: number };



function createNode(name: number, coordinates: [number, number]): Node {
  return new Node(name, coordinates);
}

function euclidean(a: Node, b: Node): number {
  return Math.sqrt(
    Math.pow(a.coordinates[0] - b.coordinates[0], 2) +
    Math.pow(a.coordinates[1] - b.coordinates[1], 2)
  );
}

function getDrawnEdges(graph: Graph): Map<string, number> {
  const map = new Map<string, number>();
  for (const node of graph.nodes.values()) {
    for (const edge of node.edges) {
      const key = node.id < edge.to
        ? `${node.id}|${edge.to}`
        : `${edge.to}|${node.id}`;
      map.set(key, edge.weight);
    }
  }
  return map;
}

/**
 * Retorna o peso da aresta desenhada entre a e b, ou Infinity se não existir.
 */
function drawnWeight(a: string, b: string, drawnEdges: Map<string, number>): number {
  const key = a < b ? `${a}|${b}` : `${b}|${a}`;
  return drawnEdges.get(key) ?? Infinity;
}

// ─── Renderização SVG ─────────────────────────────────────────────────────────

function renderEdges(
  graph: Graph,
  tourEdgeSet?: Set<string>,
  tourNodeMap?: Map<string, Node>
) {
  const rendered = new Set<string>();
  const elements: JSX.Element[] = [];

  for (const node of graph.nodes.values()) {
    for (const edge of node.edges) {
      const key = node.id < edge.to ? `${node.id}|${edge.to}` : `${edge.to}|${node.id}`;
      if (rendered.has(key)) continue;
      rendered.add(key);
      const target = graph.nodes.get(edge.to);
      if (!target) 
        continue;
      const isHighlighted = tourEdgeSet?.has(key) ?? false;
      elements.push(
        <g key={`ge-${key}`}>
          <line
            x1={node.coordinates[0]} y1={node.coordinates[1]}
            x2={target.coordinates[0]} y2={target.coordinates[1]}
            stroke={isHighlighted ? "#86efac" : "white"}
            strokeWidth={isHighlighted ? 3 : 2}
            strokeOpacity={isHighlighted ? 1 : 0.5}
          />
          <text
            x={(node.coordinates[0] + target.coordinates[0]) / 2}
            y={(node.coordinates[1] + target.coordinates[1]) / 2}
            textAnchor="middle"
            fill={isHighlighted ? "#86efac" : "white"}
            fontSize={12}
            dy={-6}
          >
            {Math.round(edge.weight)}
          </text>
        </g>
      );
    }
  }

  // Arestas do tour que NÃO foram desenhadas (não deveria acontecer agora,
  // mas mantido para compatibilidade visual caso exista)
  if (tourEdgeSet && tourNodeMap) {
    for (const key of tourEdgeSet) {
      if (rendered.has(key)) continue;
      const [fromId, toId] = key.split('|');
      const from = tourNodeMap.get(fromId);
      const to   = tourNodeMap.get(toId);
      if (!from || !to) continue;
      elements.push(
        <g key={`te-${key}`}>
          <line
            x1={from.coordinates[0]} y1={from.coordinates[1]}
            x2={to.coordinates[0]}   y2={to.coordinates[1]}
            stroke="#86efac"
            strokeWidth={2}
            strokeOpacity={0.85}
            strokeDasharray="6 3"
          />
          <text
            x={(from.coordinates[0] + to.coordinates[0]) / 2}
            y={(from.coordinates[1] + to.coordinates[1]) / 2}
            textAnchor="middle"
            fill="#86efac"
            fontSize={12}
            dy={-6}
          >
            {Math.round(euclidean(from, to))}
          </text>
        </g>
      );
    }
  }

  return elements;
}

function renderNode(
  node: Node,
  selectedId: string | null,
  setSelectedId: (id: string) => void,
  draggingEdge: string | null,
  setDraggingEdge: (id: string | null) => void,
  graph: Graph,
  refresh: () => void
) {
  const isSelected = selectedId === node.id;
  return (
    <>
      <circle
        r={28}
        cx={node.coordinates[0]}
        cy={node.coordinates[1]}
        fill={isSelected ? "rgba(99,102,241,0.90)" : "rgba(100,100,100,0.75)"}
        stroke={isSelected ? "#a5b4fc" : "rgba(255,255,255,0.75)"}
        strokeWidth={isSelected ? 3 : 2}
        style={{ cursor: "pointer" }}
        onClick={(e) => { e.stopPropagation(); setSelectedId(node.id); }}
        onMouseDown={(e) => { e.stopPropagation(); setDraggingEdge(node.id); }}
        onMouseUp={(e) => {
          e.stopPropagation();
          if (draggingEdge && draggingEdge !== node.id) {
            graph.addEdge(draggingEdge, node.id);
            refresh();
          }
          setDraggingEdge(null);
        }}
      />
      <text
        x={node.getCoordinates()[0]}
        y={node.getCoordinates()[1] + 5}
        fill="white"
        fontSize={14}
        fontWeight="bold"
        textAnchor="middle"
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {node.name}
      </text>
    </>
  );
}

function tourToEdgeSet(tour: string[]): Set<string> {
  const s = new Set<string>();
  for (let i = 0; i < tour.length; i++) {
    const a = tour[i];
    const b = tour[(i + 1) % tour.length];
    s.add(a < b ? `${a}|${b}` : `${b}|${a}`);
  }
  return s;
}


function runApproxTSP(graph: Graph): ApproxResult {
  const nodeList = Array.from(graph.nodes.values());
  const n = nodeList.length;
  if (n < 2) 
    return { tour: [], totalCost: 0, mstCost: 0, meta: "", error: "Adicione pelo menos 2 nós." };

  const drawnEdges = getDrawnEdges(graph);
  if (drawnEdges.size === 0)
    return { tour: [], totalCost: 0, mstCost: 0, meta: "", error: "Desenhe arestas entre os nós." };

  const allEdges: { from: number; to: number; weight: number }[] = [];
  for (const [key, weight] of drawnEdges) {
    const [aId, bId] = key.split('|');
    const fromIdx = nodeList.findIndex(nd => nd.id === aId);
    const toIdx   = nodeList.findIndex(nd => nd.id === bId);
    if (fromIdx !== -1 && toIdx !== -1)
      allEdges.push({ from: fromIdx, to: toIdx, weight });
  }
  allEdges.sort((a, b) => a.weight - b.weight);

  const parent = Array.from({ length: n }, (_, i) => i);
  const rank   = new Array(n).fill(0);
  function find(x: number): number {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  }
  function union(a: number, b: number) {
    const ra = find(a), rb = find(b);
    if (ra === rb) return;
    if (rank[ra] < rank[rb]) parent[ra] = rb;
    else if (rank[ra] > rank[rb]) parent[rb] = ra;
    else { parent[rb] = ra; rank[ra]++; }
  }

  const mstAdj: number[][] = Array.from({ length: n }, () => []);
  let mstCost = 0, edgesAdded = 0;
  for (const e of allEdges) {
    if (find(e.from) !== find(e.to)) {
      union(e.from, e.to);
      mstAdj[e.from].push(e.to);
      mstAdj[e.to].push(e.from);
      mstCost += e.weight;
      edgesAdded++;
      if (edgesAdded === n - 1) break;
    }
  }

  if (edgesAdded < n - 1)
    return { tour: [], totalCost: 0, mstCost: 0, meta: "", error: "O grafo não é conexo com as arestas desenhadas. Conecte todos os nós." };

  const visited = new Array(n).fill(false);
  const tourIdx: number[] = [];
  const stack = [0];
  while (stack.length > 0) {
    const v = stack.pop()!;
    if (visited[v]) continue;
    visited[v] = true;
    tourIdx.push(v);
    for (let k = mstAdj[v].length - 1; k >= 0; k--)
      if (!visited[mstAdj[v][k]]) stack.push(mstAdj[v][k]);
  }

  let tCost = 0;
  for (let i = 0; i < tourIdx.length; i++) {
    const aId = nodeList[tourIdx[i]].id;
    const bId = nodeList[tourIdx[(i + 1) % tourIdx.length]].id;
    tCost += drawnWeight(aId, bId, drawnEdges);
  }

  return {
    tour: tourIdx.map(i => nodeList[i].id),
    totalCost: tCost,
    mstCost,
    meta: `AGM (arestas desenhadas): ${Math.round(mstCost)} · O(E log E)`,
  };
}

// ─── 2. Algoritmo Genético ────────────────────────────────────────────────────
//
// A matriz de distâncias usa apenas arestas desenhadas: pares sem aresta
// recebem peso Infinity, tornando tours que os usam automaticamente piores.
// O AG naturalmente evita esses pares ao minimizar o custo total.
function runGeneticTSP(graph: Graph): TourResult {
  const nodeList = Array.from(graph.nodes.values());
  const n = nodeList.length;
  if (n < 2) return { tour: [], totalCost: 0, meta: "", error: "Adicione pelo menos 2 nós." };

  const drawnEdges = getDrawnEdges(graph);
  if (drawnEdges.size === 0)
    return { tour: [], totalCost: 0, meta: "", error: "Desenhe arestas entre os nós." };

  const dist: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (__, j) => {
      if (i === j) return 0;
      return drawnWeight(nodeList[i].id, nodeList[j].id, drawnEdges);
    })
  );

  type Chrom = number[];

  function chromCost(c: Chrom): number {
    let s = 0;
    for (let i = 0; i < n; i++) s += dist[c[i]][c[(i + 1) % n]];
    return s;
  }

  function randomChrom(): Chrom {
    const c = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [c[i], c[j]] = [c[j], c[i]];
    }
    return c;
  }

  function crossover(a: Chrom, b: Chrom): Chrom {
    const lo = Math.floor(Math.random() * n);
    const hi = lo + Math.floor(Math.random() * (n - lo));
    const child = new Array(n).fill(-1);
    for (let i = lo; i <= hi; i++) child[i] = a[i];
    const inChild = new Set(child.filter(g => g !== -1));
    let pos = (hi + 1) % n;
    for (let k = 0; k < n; k++) {
      const gene = b[(hi + 1 + k) % n];
      if (!inChild.has(gene)) {
        child[pos] = gene;
        inChild.add(gene);
        pos = (pos + 1) % n;
      }
    }
    return child;
  }

  function mutate(c: Chrom): Chrom {
    if (Math.random() > 0.25) return c;
    const m = [...c];
    const i = Math.floor(Math.random() * n);
    const j = Math.floor(Math.random() * n);
    if (Math.random() < 0.5) {
      [m[i], m[j]] = [m[j], m[i]];
    } else {
      const [lo, hi] = i <= j ? [i, j] : [j, i];
      let l = lo, r = hi;
      while (l < r) { [m[l], m[r]] = [m[r], m[l]]; l++; r--; }
    }
    return m;
  }

  const POP_SIZE = 100;
  const GENERATIONS = 400;
  const ELITE = 8;

  let pop: Chrom[] = Array.from({ length: POP_SIZE }, randomChrom);
  let bestCost = Infinity;
  let bestChrom: Chrom = pop[0];

  for (let gen = 0; gen < GENERATIONS; gen++) {
    const fitness = pop.map(chromCost);
    const order = Array.from({ length: POP_SIZE }, (_, i) => i)
      .sort((a, b) => fitness[a] - fitness[b]);

    if (fitness[order[0]] < bestCost) {
      bestCost = fitness[order[0]];
      bestChrom = [...pop[order[0]]];
    }

    const next: Chrom[] = order.slice(0, ELITE).map(i => [...pop[i]]);
    while (next.length < POP_SIZE) {
      const pickIdx = () => {
        const i = Math.floor(Math.random() * POP_SIZE);
        const j = Math.floor(Math.random() * POP_SIZE);
        return fitness[i] <= fitness[j] ? i : j;
      };
      next.push(mutate(crossover(pop[pickIdx()], pop[pickIdx()])));
    }
    pop = next;
  }

  if (bestCost === Infinity)
    return { tour: [], totalCost: 0, meta: "", error: "Nenhum tour válido encontrado. Verifique se o grafo é conexo com as arestas desenhadas." };

  return {
    tour: bestChrom.map(i => nodeList[i].id),
    totalCost: bestCost,
    meta: `${GENERATIONS} gerações · pop ${POP_SIZE} · arestas desenhadas`,
  };
}

const TSP_MAX_NODES = 10;

function tourCostDrawn(
  nodeList: Node[],
  perm: number[],
  drawnEdges: Map<string, number>
): number {
  let s = 0;
  for (let i = 0; i < perm.length; i++) {
    const aId = nodeList[perm[i]].id;
    const bId = nodeList[perm[(i + 1) % perm.length]].id;
    const w = drawnWeight(aId, bId, drawnEdges);
    if (w === Infinity) return Infinity; // tour inválido
    s += w;
  }
  return s;
}

function* permutations(arr: number[]): Generator<number[]> {
  const n = arr.length;
  const c = new Array(n).fill(0);
  yield [...arr];
  let i = 0;
  while (i < n) {
    if (c[i] < i) {
      if (i % 2 === 0) [arr[0], arr[i]] = [arr[i], arr[0]];
      else             [arr[c[i]], arr[i]] = [arr[i], arr[c[i]]];
      yield [...arr];
      c[i]++;
      i = 0;
    } else { c[i] = 0; i++; }
  }
}

function runBruteForceTSP(graph: Graph): TourResult {
  const nodeList = Array.from(graph.nodes.values());
  const n = nodeList.length;
  if (n < 2) return { tour: [], totalCost: 0, meta: "", error: "Adicione pelo menos 2 nós." };
  if (n > TSP_MAX_NODES) return {
    tour: [], totalCost: 0, meta: "",
    error: `Força bruta limitada a ${TSP_MAX_NODES} nós (atual: ${n}). Remova alguns nós.`,
  };

  const drawnEdges = getDrawnEdges(graph);
  if (drawnEdges.size === 0)
    return { tour: [], totalCost: 0, meta: "", error: "Desenhe arestas entre os nós." };

  const rest = Array.from({ length: n - 1 }, (_, i) => i + 1);
  let bestTour: number[] = [];
  let bestCost = Infinity;
  let tested = 0;

  for (const perm of permutations(rest)) {
    const full = [0, ...perm];
    const cost = tourCostDrawn(nodeList, full, drawnEdges);
    tested++;
    if (cost < bestCost) { bestCost = cost; bestTour = [...full]; }
  }

  if (bestCost === Infinity)
    return { tour: [], totalCost: 0, meta: "", error: "Nenhum tour válido encontrado. Verifique se o grafo é hamiltoniano com as arestas desenhadas." };

  return {
    tour: bestTour.map(i => nodeList[i].id),
    totalCost: bestCost,
    meta: `${tested.toLocaleString("pt-BR")} permutações · arestas desenhadas`,
  };
}


function TourPanel({
  result,
  graph,
  color,
  emptyLabel,
  emptyHint,
  infoLabel,
  totalLabel,
}: {
  result: TourResult | ApproxResult | null;
  graph: Graph;
  color: "blue" | "green" | "orange";
  emptyLabel: string;
  emptyHint: string;
  infoLabel: string;
  totalLabel: string;
}) {
  const c = {
    blue:   { badge: "bg-blue-500/30",   card: "bg-blue-500/20 border-blue-400/30",   cardRet: "bg-blue-500/10 border-blue-400/20",   total: "bg-blue-500/20 border-blue-400/40",   text: "text-blue-300" },
    green:  { badge: "bg-green-500/30",  card: "bg-green-500/20 border-green-400/30", cardRet: "bg-green-500/10 border-green-400/20", total: "bg-green-500/20 border-green-400/40", text: "text-green-300" },
    orange: { badge: "bg-orange-500/30", card: "bg-orange-500/20 border-orange-400/30", cardRet: "bg-orange-500/10 border-orange-400/20", total: "bg-orange-500/20 border-orange-400/40", text: "text-orange-300" },
  }[color];

  return (
    <>
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        {result && !result.error && (
          <div className="flex gap-2 flex-wrap">
            <span className={`text-xs ${c.badge} text-white rounded-full px-2 py-0.5`}>
              {result.tour.length} cidades
            </span>
            <span className="text-xs bg-white/20 text-white rounded-full px-2 py-0.5">
              Custo: {Math.round(result.totalCost)}
            </span>
            <span className="text-xs bg-white/10 text-white/70 rounded-full px-2 py-0.5">
              {result.meta}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-1 min-h-0">
        {!result ? (
          <div className="h-full flex flex-col items-center justify-center text-white/50 text-sm gap-2">
            <span>{emptyLabel}</span>
            <span className="text-xs text-center px-4 text-white/35">{emptyHint}</span>
          </div>
        ) : result.error ? (
          <div className="h-full flex flex-col items-center justify-center text-white/70 text-sm gap-2 px-4 text-center">
            <span>{result.error}</span>
          </div>
        ) : (
          <>
            <div className="mb-3 rounded-lg bg-white/10 border border-white/20 px-3 py-2">
              <p className="text-white/60 text-xs mb-0.5">{infoLabel}</p>
              <p className={`text-xs font-medium ${c.text}`}>{result.meta}</p>
              {'mstCost' in result && (
                <p className="text-white/50 text-xs mt-0.5">
                  Custo da AGM: {Math.round((result as ApproxResult).mstCost)}
                </p>
              )}
            </div>

            <p className="text-white/60 text-xs px-1 mb-1">Tour</p>
            {result.tour.map((id, index) => {
              const from = graph.nodes.get(id);
              const toId = result.tour[(index + 1) % result.tour.length];
              const to   = graph.nodes.get(toId);
              const drawnEdges = getDrawnEdges(graph);
              const segCost = from && to ? drawnWeight(from.id, to.id, drawnEdges) : 0;
              const isReturn = index === result.tour.length - 1;
              return (
                <div
                  key={index}
                  className={`flex items-center gap-2 mb-1.5 rounded-lg px-3 py-2 text-sm border ${
                    isReturn ? c.cardRet : c.card
                  }`}
                >
                  <span className={`${c.text} text-xs font-bold flex-shrink-0 w-5 text-center`}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold">
                      {from?.name}
                      <span className="text-white/50 font-normal"> → </span>
                      {to?.name}
                      {isReturn && <span className={`ml-1 ${c.text} opacity-70 text-xs`}>(retorno)</span>}
                    </div>
                    <div className="text-white/50 text-xs">distância {Math.round(segCost)}</div>
                  </div>
                </div>
              );
            })}

            <div className={`mt-2 rounded-lg ${c.total} border px-3 py-2 flex justify-between items-center`}>
              <span className="text-white/70 text-sm">{totalLabel}</span>
              <span className={`${c.text} font-bold text-base`}>{Math.round(result.totalCost)}</span>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

type Tab = "kruskal" | "ag" | "tsp";

function App() {
  const [draggingEdge, setDraggingEdge] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<[number, number]>([0, 0]);
  const [, forceUpdate] = useState(0);
  const [approxResult, setApproxResult] = useState<ApproxResult | null>(null);
  const [agResult, setAgResult] = useState<TourResult | null>(null);
  const [tspResult, setTspResult] = useState<TourResult | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("kruskal");
  const [graph] = useState(() => new Graph());
  const [nodes, setNodes] = useState<Node[]>([]);
  const [adicionarClicked, setAdicionarClicked] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [names, setNames] = useState<number>(0);

  function findNode(id: string) { return nodes.find(n => n.id === id); }

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  const activeResult =
    activeTab === "kruskal" ? approxResult :
    activeTab === "ag"      ? agResult     : tspResult;

  const tourEdgeSet = activeResult && !activeResult.error && activeResult.tour.length > 1
    ? tourToEdgeSet(activeResult.tour)
    : undefined;

  return (
    <>
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="w-full h-screen bg-gray-400">
        <div className="w-11/12 h-full mx-auto flex flex-row justify-between gap-2">

          {/* Canvas */}
          <div className="w-2/3 h-4/5 self-center">
            <svg
              width="100%" height="100%"
              className="bg-white/30 rounded-xl"
              onMouseMove={(e) => setMousePos(pointer(e))}
              onMouseUp={() => setDraggingEdge(null)}
              onClick={(e) => {
                if (adicionarClicked) {
                  const newNode = createNode(names, [pointer(e)[0], pointer(e)[1]]);
                  setNodes([...nodes, newNode]);
                  graph.addNode(newNode);
                  setNames(names + 1);
                  setAdicionarClicked(false);
                }
              }}
            >
              {renderEdges(graph, tourEdgeSet, nodeMap)}

              {draggingEdge && (() => {
                const source = findNode(draggingEdge);
                if (!source) return null;
                return (
                  <line
                    x1={source.coordinates[0]} y1={source.coordinates[1]}
                    x2={mousePos[0]} y2={mousePos[1]}
                    stroke="white" strokeWidth={2} strokeDasharray="6"
                  />
                );
              })()}

              {nodes.map(node => (
                <g key={node.id}>
                  {renderNode(node, selectedId, setSelectedId, draggingEdge, setDraggingEdge, graph, () => forceUpdate(v => v + 1))}
                </g>
              ))}
            </svg>
          </div>

          {/* Painel lateral */}
          <div className="w-1/3 flex flex-col place-content-center py-8">
            <div className="backdrop-blur-sm bg-white/30 rounded-xl w-full h-3/4 shadow-xl flex flex-col overflow-hidden">

              {/* Abas */}
              <div className="flex border-b border-white/20 flex-shrink-0">
                {(["kruskal", "ag", "tsp"] as Tab[]).map((tab) => {
                  const labels: Record<Tab, string> = { kruskal: "Aproximação", ag: "Alg. Genético", tsp: "Caixeiro" };
                  const colors: Record<Tab, string> = { kruskal: "border-blue-400", ag: "border-green-400", tsp: "border-orange-400" };
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-3 text-xs font-bold transition-colors ${
                        activeTab === tab
                          ? `text-white border-b-2 ${colors[tab]} bg-white/10`
                          : "text-white/50 hover:text-white/80"
                      }`}
                    >
                      {labels[tab]}
                    </button>
                  );
                })}
              </div>

              {/* Conteúdo das abas */}
              {activeTab === "kruskal" && (
                <TourPanel
                  result={approxResult}
                  graph={graph}
                  color="blue"
                  emptyLabel="Clique em Executar para calcular"
                  emptyHint="AGM via Kruskal + DFS pré-ordem. Usa apenas arestas desenhadas."
                  infoLabel="Método"
                  totalLabel="Distância total"
                />
              )}
              {activeTab === "ag" && (
                <TourPanel
                  result={agResult}
                  graph={graph}
                  color="green"
                  emptyLabel="Clique em Executar para rodar"
                  emptyHint="Genético com OX crossover, swap e mutação 2-opt. Usa apenas arestas desenhadas."
                  infoLabel="Parâmetros"
                  totalLabel="Distância total"
                />
              )}
              {activeTab === "tsp" && (
                <TourPanel
                  result={tspResult}
                  graph={graph}
                  color="orange"
                  emptyLabel="Clique em Executar para calcular"
                  emptyHint={`Testa todas as rotas pelas arestas desenhadas. Limitado a ${TSP_MAX_NODES} nós.`}
                  infoLabel="Busca exaustiva"
                  totalLabel="Distância total"
                />
              )}

              {/* Botões */}
              <div className="px-4 pb-4 pt-2 flex-shrink-0 border-t border-white/20">
                <div className="grid grid-cols-3 gap-2 h-10">
                  <button
                    className="w-full h-full bg-white/20 border border-white/30 rounded-full text-white font-bold text-sm hover:bg-white/30 transition-colors"
                    onClick={() => setAdicionarClicked(true)}
                  >
                    + Nó
                  </button>
                  <button
                    className="w-full h-full bg-white/20 border border-white/30 rounded-full text-white font-bold text-sm hover:bg-white/30 transition-colors disabled:opacity-30"
                    disabled={!selectedId}
                    onClick={() => {
                      if (!selectedId) return;
                      graph.removeNode(selectedId);
                      setNodes(prev => prev.filter(n => n.id !== selectedId));
                      setSelectedId(null);
                      forceUpdate(v => v + 1);
                    }}
                  >
                    − Nó
                  </button>
                  <button
                    className={`w-full h-full rounded-full text-white font-bold text-sm shadow-xl transition-colors ${
                      activeTab === "kruskal" ? "bg-blue-500 hover:bg-blue-600"
                      : activeTab === "ag"    ? "bg-green-500 hover:bg-green-600"
                                             : "bg-orange-500 hover:bg-orange-600"
                    }`}
                    onClick={() => {
                      if (activeTab === "kruskal") setApproxResult(runApproxTSP(graph));
                      else if (activeTab === "ag")  setAgResult(runGeneticTSP(graph));
                      else                          setTspResult(runBruteForceTSP(graph));
                    }}
                  >
                    Executar
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </>
  );
}

export default App;