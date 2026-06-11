import Header from "./components/Header"
import { useState } from "react";
import { pointer } from 'd3';
import React from "react";

// ─── Estruturas de dados ──────────────────────────────────────────────────────

class No {
  id: string;
  nome: number;
  coordenadas: [number, number];
  arestas: Aresta[];

  constructor(nome: number, coordenadas: [number, number]) {
    this.id = crypto.randomUUID();
    this.nome = nome;
    this.coordenadas = coordenadas;
    this.arestas = [];
  }

  getId(): string { return this.id; }
  getNome(): number { return this.nome; }
  getCoordenadas(): [number, number] { return this.coordenadas; }
}

class Aresta {
  destino: string;
  peso: number;

  constructor(destino: string, peso: number) {
    this.destino = destino;
    this.peso = peso;
  }

  setPeso(peso: number) { this.peso = peso; }
}

class Grafo {
  nos: Map<string, No>;

  constructor() { this.nos = new Map(); }

  adicionarNo(no: No) { this.nos.set(no.id, no); }

  adicionarAresta(idA: string, idB: string) {
    const noA = this.nos.get(idA);
    const noB = this.nos.get(idB);
    if (!noA || !noB) return;

    // Evita aresta duplicada
    const jaExiste = noA.arestas.some(aresta => aresta.destino === idB);
    if (jaExiste) return;

    const distancia = Math.sqrt(
      Math.pow(noA.coordenadas[0] - noB.coordenadas[0], 2) +
      Math.pow(noA.coordenadas[1] - noB.coordenadas[1], 2)
    );

    noA.arestas.push(new Aresta(idB, distancia));
    noB.arestas.push(new Aresta(idA, distancia));
  }

  removerNo(id: string) {
    const no = this.nos.get(id);
    if (!no) return;

    // Remove todas as arestas que apontam para esse nó
    for (const noAtual of this.nos.values()) {
      noAtual.arestas = noAtual.arestas.filter(aresta => aresta.destino !== id);
    }

    this.nos.delete(id);
  }
}


// ─── Tipos de resultado ───────────────────────────────────────────────────────

type ResultadoTour = {
  tour: string[];
  custoTotal: number;
  meta: string;
  erro?: string;
};

type ResultadoAproximacao = ResultadoTour & { custoAGM: number };


// ─── Funções utilitárias ──────────────────────────────────────────────────────

function criarNo(nome: number, coordenadas: [number, number]): No {
  return new No(nome, coordenadas);
}

function distanciaEuclidiana(a: No, b: No): number {
  return Math.sqrt(
    Math.pow(a.coordenadas[0] - b.coordenadas[0], 2) +
    Math.pow(a.coordenadas[1] - b.coordenadas[1], 2)
  );
}

function obterArestasDesenhadas(grafo: Grafo): Map<string, number> {
  const mapa = new Map<string, number>();

  for (const no of grafo.nos.values()) {
    for (const aresta of no.arestas) {
      // Garante chave única independente da direção
      const chave = no.id < aresta.destino
        ? `${no.id}|${aresta.destino}`
        : `${aresta.destino}|${no.id}`;
      mapa.set(chave, aresta.peso);
    }
  }

  return mapa;
}

function pesoAresta(idA: string, idB: string, arestasDesenhadas: Map<string, number>): number {
  const chave = idA < idB ? `${idA}|${idB}` : `${idB}|${idA}`;
  return arestasDesenhadas.get(chave) ?? Infinity;
}


// ─── Renderização das arestas ─────────────────────────────────────────────────

function renderizarArestas(
  grafo: Grafo,
  arestasDoTour?: Set<string>,
  mapaDeNos?: Map<string, No>
) {
  const jaRenderizadas = new Set<string>();
  const elementos: React.JSX.Element[] = [];

  for (const no of grafo.nos.values()) {
    for (const aresta of no.arestas) {
      const chave = no.id < aresta.destino
        ? `${no.id}|${aresta.destino}`
        : `${aresta.destino}|${no.id}`;

      if (jaRenderizadas.has(chave)) continue;
      jaRenderizadas.add(chave);

      const destino = grafo.nos.get(aresta.destino);
      if (!destino) continue;

      const estaNoTour = arestasDoTour?.has(chave) ?? false;

      elementos.push(
        <g key={`aresta-${chave}`}>
          <line
            x1={no.coordenadas[0]} y1={no.coordenadas[1]}
            x2={destino.coordenadas[0]} y2={destino.coordenadas[1]}
            stroke={estaNoTour ? "#86efac" : "white"}
            strokeWidth={estaNoTour ? 3 : 2}
            strokeOpacity={estaNoTour ? 1 : 0.5}
          />
          <text
            x={(no.coordenadas[0] + destino.coordenadas[0]) / 2}
            y={(no.coordenadas[1] + destino.coordenadas[1]) / 2}
            textAnchor="middle"
            fill={estaNoTour ? "#86efac" : "white"}
            fontSize={12}
            dy={-6}
          >
            {Math.round(aresta.peso)}
          </text>
        </g>
      );
    }
  }

  // Arestas do tour que não foram desenhadas no grafo (fallback visual)
  if (arestasDoTour && mapaDeNos) {
    for (const chave of arestasDoTour) {
      if (jaRenderizadas.has(chave)) continue;

      const [idOrigem, idDestino] = chave.split('|');
      const origem  = mapaDeNos.get(idOrigem);
      const destino = mapaDeNos.get(idDestino);
      if (!origem || !destino) continue;

      elementos.push(
        <g key={`tour-${chave}`}>
          <line
            x1={origem.coordenadas[0]}  y1={origem.coordenadas[1]}
            x2={destino.coordenadas[0]} y2={destino.coordenadas[1]}
            stroke="#86efac"
            strokeWidth={2}
            strokeOpacity={0.85}
            strokeDasharray="6 3"
          />
          <text
            x={(origem.coordenadas[0] + destino.coordenadas[0]) / 2}
            y={(origem.coordenadas[1] + destino.coordenadas[1]) / 2}
            textAnchor="middle"
            fill="#86efac"
            fontSize={12}
            dy={-6}
          >
            {Math.round(distanciaEuclidiana(origem, destino))}
          </text>
        </g>
      );
    }
  }

  return elementos;
}


// ─── Renderização de um nó ────────────────────────────────────────────────────

function renderizarNo(
  no: No,
  idSelecionado: string | null,
  setSelecionado: (id: string) => void,
  idArrastando: string | null,
  setArrastando: (id: string | null) => void,
  grafo: Grafo,
  atualizar: () => void
) {
  const estaSelecionado = idSelecionado === no.id;

  return (
    <>
      <circle
        r={28}
        cx={no.coordenadas[0]}
        cy={no.coordenadas[1]}
        fill={estaSelecionado ? "rgba(99,102,241,0.90)" : "rgba(100,100,100,0.75)"}
        stroke={estaSelecionado ? "#a5b4fc" : "rgba(255,255,255,0.75)"}
        strokeWidth={estaSelecionado ? 3 : 2}
        style={{ cursor: "pointer" }}
        onClick={(e) => {
          e.stopPropagation();
          setSelecionado(no.id);
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          setArrastando(no.id);
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          if (idArrastando && idArrastando !== no.id) {
            grafo.adicionarAresta(idArrastando, no.id);
            atualizar();
          }
          setArrastando(null);
        }}
      />
      <text
        x={no.getCoordenadas()[0]}
        y={no.getCoordenadas()[1] + 5}
        fill="white"
        fontSize={14}
        fontWeight="bold"
        textAnchor="middle"
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {no.nome}
      </text>
    </>
  );
}


// ─── Converte um tour em conjunto de arestas ──────────────────────────────────

function tourParaConjuntoDeArestas(tour: string[]): Set<string> {
  const conjunto = new Set<string>();

  for (let i = 0; i < tour.length; i++) {
    const idA = tour[i];
    const idB = tour[(i + 1) % tour.length];
    conjunto.add(idA < idB ? `${idA}|${idB}` : `${idB}|${idA}`);
  }

  return conjunto;
}


// ─── 1. Algoritmo de Aproximação (AGM via Kruskal + DFS) ──────────────────────

function executarAproximacaoTSP(grafo: Grafo): ResultadoAproximacao {
  const listaDeNos = Array.from(grafo.nos.values());
  const quantidadeNos = listaDeNos.length;

  if (quantidadeNos < 2)
    return { tour: [], custoTotal: 0, custoAGM: 0, meta: "", erro: "Adicione pelo menos 2 nós." };

  const arestasDesenhadas = obterArestasDesenhadas(grafo);

  if (arestasDesenhadas.size === 0)
    return { tour: [], custoTotal: 0, custoAGM: 0, meta: "", erro: "Desenhe arestas entre os nós." };

  // Monta lista de arestas com índices numéricos
  const listaArestas: { de: number; para: number; peso: number }[] = [];

  for (const [chave, peso] of arestasDesenhadas) {
    const [idA, idB] = chave.split('|');
    const indiceDe   = listaDeNos.findIndex(no => no.id === idA);
    const indicePara = listaDeNos.findIndex(no => no.id === idB);
    if (indiceDe !== -1 && indicePara !== -1) {
      listaArestas.push({ de: indiceDe, para: indicePara, peso });
    }
  }

  listaArestas.sort((a, b) => a.peso - b.peso);

  // Union-Find para construir a AGM
  const pai   = Array.from({ length: quantidadeNos }, (_, i) => i);
  const grau  = new Array(quantidadeNos).fill(0);

  function encontrar(x: number): number {
    if (pai[x] !== x) pai[x] = encontrar(pai[x]);
    return pai[x];
  }

  function unir(a: number, b: number) {
    const raizA = encontrar(a);
    const raizB = encontrar(b);
    if (raizA === raizB) return;
    if (grau[raizA] < grau[raizB])      pai[raizA] = raizB;
    else if (grau[raizA] > grau[raizB]) pai[raizB] = raizA;
    else { pai[raizB] = raizA; grau[raizA]++; }
  }

  // Constrói a AGM com Kruskal
  const adjacenciaAGM: number[][] = Array.from({ length: quantidadeNos }, () => []);
  let custoAGM     = 0;
  let arestasAdicionadas = 0;

  for (const aresta of listaArestas) {
    if (encontrar(aresta.de) !== encontrar(aresta.para)) {
      unir(aresta.de, aresta.para);
      adjacenciaAGM[aresta.de].push(aresta.para);
      adjacenciaAGM[aresta.para].push(aresta.de);
      custoAGM += aresta.peso;
      arestasAdicionadas++;
      if (arestasAdicionadas === quantidadeNos - 1) break;
    }
  }

  if (arestasAdicionadas < quantidadeNos - 1)
    return {
      tour: [], custoTotal: 0, custoAGM: 0, meta: "",
      erro: "O grafo não é conexo com as arestas desenhadas. Conecte todos os nós."
    };

  // DFS pré-ordem sobre a AGM para gerar o tour
  const visitado = new Array(quantidadeNos).fill(false);
  const indicesDoTour: number[] = [];
  const pilha = [0];

  while (pilha.length > 0) {
    const vertice = pilha.pop()!;
    if (visitado[vertice]) continue;
    visitado[vertice] = true;
    indicesDoTour.push(vertice);

    for (let k = adjacenciaAGM[vertice].length - 1; k >= 0; k--) {
      if (!visitado[adjacenciaAGM[vertice][k]]) {
        pilha.push(adjacenciaAGM[vertice][k]);
      }
    }
  }

  // Calcula custo total usando as arestas desenhadas
  let custoTotal = 0;
  for (let i = 0; i < indicesDoTour.length; i++) {
    const idA = listaDeNos[indicesDoTour[i]].id;
    const idB = listaDeNos[indicesDoTour[(i + 1) % indicesDoTour.length]].id;
    custoTotal += pesoAresta(idA, idB, arestasDesenhadas);
  }

  return {
    tour: indicesDoTour.map(i => listaDeNos[i].id),
    custoTotal,
    custoAGM,
    meta: `AGM (arestas desenhadas): ${Math.round(custoAGM)} · O(E log E)`,
  };
}


// ─── 2. Algoritmo Genético ────────────────────────────────────────────────────

function executarAGTSP(grafo: Grafo): ResultadoTour {
  const listaDeNos = Array.from(grafo.nos.values());
  const quantidadeNos = listaDeNos.length;

  if (quantidadeNos < 2)
    return { tour: [], custoTotal: 0, meta: "", erro: "Adicione pelo menos 2 nós." };

  const arestasDesenhadas = obterArestasDesenhadas(grafo);

  if (arestasDesenhadas.size === 0)
    return { tour: [], custoTotal: 0, meta: "", erro: "Desenhe arestas entre os nós." };

  // Matriz de distâncias: Infinity para pares sem aresta desenhada
  const matrizDistancias: number[][] = Array.from({ length: quantidadeNos }, (_, i) =>
    Array.from({ length: quantidadeNos }, (__, j) => {
      if (i === j) return 0;
      return pesoAresta(listaDeNos[i].id, listaDeNos[j].id, arestasDesenhadas);
    })
  );

  type Cromossomo = number[];

  function calcularCusto(cromossomo: Cromossomo): number {
    let custo = 0;
    for (let i = 0; i < quantidadeNos; i++) {
      custo += matrizDistancias[cromossomo[i]][cromossomo[(i + 1) % quantidadeNos]];
    }
    return custo;
  }

  function cromossomoAleatorio(): Cromossomo {
    const cromossomo = Array.from({ length: quantidadeNos }, (_, i) => i);
    // Embaralha com Fisher-Yates
    for (let i = quantidadeNos - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = cromossomo[i];
      cromossomo[i] = cromossomo[j];
      cromossomo[j] = temp;
    }
    return cromossomo;
  }

  function cruzamento(pai: Cromossomo, mae: Cromossomo): Cromossomo {
    // OX Crossover: copia segmento do pai e preenche com genes da mãe
    const inicio = Math.floor(Math.random() * quantidadeNos);
    const fim    = inicio + Math.floor(Math.random() * (quantidadeNos - inicio));

    const filho = new Array(quantidadeNos).fill(-1);

    // Copia o segmento do pai
    for (let i = inicio; i <= fim; i++) {
      filho[i] = pai[i];
    }

    // Preenche o restante com genes da mãe, na ordem
    const genesNoFilho = new Set(filho.filter(gene => gene !== -1));
    let posicao = (fim + 1) % quantidadeNos;

    for (let k = 0; k < quantidadeNos; k++) {
      const gene = mae[(fim + 1 + k) % quantidadeNos];
      if (!genesNoFilho.has(gene)) {
        filho[posicao] = gene;
        genesNoFilho.add(gene);
        posicao = (posicao + 1) % quantidadeNos;
      }
    }

    return filho;
  }

  function mutar(cromossomo: Cromossomo): Cromossomo {
    const CHANCE_MUTACAO = 0.25;
    if (Math.random() > CHANCE_MUTACAO) return cromossomo;

    const resultado = [...cromossomo];
    const indiceA = Math.floor(Math.random() * quantidadeNos);
    const indiceB = Math.floor(Math.random() * quantidadeNos);

    const usarSwapSimples = Math.random() < 0.5;

    if (usarSwapSimples) {
      // Troca dois genes de posição
      const temp = resultado[indiceA];
      resultado[indiceA] = resultado[indiceB];
      resultado[indiceB] = temp;
    } else {
      // Inverte o trecho entre indiceA e indiceB (mutação 2-opt)
      const inicio = Math.min(indiceA, indiceB);
      const fim    = Math.max(indiceA, indiceB);

      let esquerda = inicio;
      let direita  = fim;

      while (esquerda < direita) {
        const temp = resultado[esquerda];
        resultado[esquerda] = resultado[direita];
        resultado[direita]  = temp;
        esquerda++;
        direita--;
      }
    }

    return resultado;
  }

  const TAMANHO_POPULACAO = 100;
  const GERACOES          = 400;
  const ELITE             = 8;

  let populacao: Cromossomo[] = Array.from({ length: TAMANHO_POPULACAO }, cromossomoAleatorio);
  let melhorCusto    = Infinity;
  let melhorCromossomo: Cromossomo = populacao[0];

  for (let geracao = 0; geracao < GERACOES; geracao++) {
    // Avalia aptidão e ordena do melhor para o pior
    const aptidoes = populacao.map(calcularCusto);
    const ordemPorAptidao = Array.from({ length: TAMANHO_POPULACAO }, (_, i) => i)
      .sort((a, b) => aptidoes[a] - aptidoes[b]);

    if (aptidoes[ordemPorAptidao[0]] < melhorCusto) {
      melhorCusto     = aptidoes[ordemPorAptidao[0]];
      melhorCromossomo = [...populacao[ordemPorAptidao[0]]];
    }

    // Elitismo: mantém os melhores direto
    const proxGeracap: Cromossomo[] = ordemPorAptidao.slice(0, ELITE).map(i => [...populacao[i]]);

    // Torneio para selecionar pais e gerar filhos
    function selecionarPorTorneio(): number {
      const i = Math.floor(Math.random() * TAMANHO_POPULACAO);
      const j = Math.floor(Math.random() * TAMANHO_POPULACAO);
      return aptidoes[i] <= aptidoes[j] ? i : j;
    }

    while (proxGeracap.length < TAMANHO_POPULACAO) {
      const pai = populacao[selecionarPorTorneio()];
      const mae = populacao[selecionarPorTorneio()];
      proxGeracap.push(mutar(cruzamento(pai, mae)));
    }

    populacao = proxGeracap;
  }

  if (melhorCusto === Infinity)
    return {
      tour: [], custoTotal: 0, meta: "",
      erro: "Nenhum tour válido encontrado. Verifique se o grafo é conexo com as arestas desenhadas."
    };

  return {
    tour: melhorCromossomo.map(i => listaDeNos[i].id),
    custoTotal: melhorCusto,
    meta: `${GERACOES} gerações · pop ${TAMANHO_POPULACAO} · arestas desenhadas`,
  };
}


// ─── 3. Força Bruta (TSP exato) ───────────────────────────────────────────────

const MAX_NOS_FORCA_BRUTA = 10;

function calcularCustoTour(
  listaDeNos: No[],
  permutacao: number[],
  arestasDesenhadas: Map<string, number>
): number {
  let custo = 0;
  for (let i = 0; i < permutacao.length; i++) {
    const idA = listaDeNos[permutacao[i]].id;
    const idB = listaDeNos[permutacao[(i + 1) % permutacao.length]].id;
    const peso = pesoAresta(idA, idB, arestasDesenhadas);
    if (peso === Infinity) return Infinity; // tour inválido
    custo += peso;
  }
  return custo;
}

function* gerarPermutacoes(arr: number[]): Generator<number[]> {
  const n = arr.length;
  const contadores = new Array(n).fill(0);
  yield [...arr];

  let i = 0;
  while (i < n) {
    if (contadores[i] < i) {
      if (i % 2 === 0) {
        // Troca com o primeiro
        const temp = arr[0];
        arr[0] = arr[i];
        arr[i] = temp;
      } else {
        // Troca com o elemento na posição do contador
        const temp = arr[contadores[i]];
        arr[contadores[i]] = arr[i];
        arr[i] = temp;
      }
      yield [...arr];
      contadores[i]++;
      i = 0;
    } else {
      contadores[i] = 0;
      i++;
    }
  }
}

function executarForcaBrutaTSP(grafo: Grafo): ResultadoTour {
  const listaDeNos = Array.from(grafo.nos.values());
  const quantidadeNos = listaDeNos.length;

  if (quantidadeNos < 2)
    return { tour: [], custoTotal: 0, meta: "", erro: "Adicione pelo menos 2 nós." };

  if (quantidadeNos > MAX_NOS_FORCA_BRUTA)
    return {
      tour: [], custoTotal: 0, meta: "",
      erro: `Força bruta limitada a ${MAX_NOS_FORCA_BRUTA} nós (atual: ${quantidadeNos}). Remova alguns nós.`,
    };

  const arestasDesenhadas = obterArestasDesenhadas(grafo);

  if (arestasDesenhadas.size === 0)
    return { tour: [], custoTotal: 0, meta: "", erro: "Desenhe arestas entre os nós." };

  // Fixa o nó 0 e permuta os demais para evitar tours equivalentes
  const indicesRestantes = Array.from({ length: quantidadeNos - 1 }, (_, i) => i + 1);
  let melhorTour: number[] = [];
  let melhorCusto = Infinity;
  let permutacoesTestadas = 0;

  for (const permutacao of gerarPermutacoes(indicesRestantes)) {
    const tourCompleto = [0, ...permutacao];
    const custo = calcularCustoTour(listaDeNos, tourCompleto, arestasDesenhadas);
    permutacoesTestadas++;
    if (custo < melhorCusto) {
      melhorCusto = custo;
      melhorTour  = [...tourCompleto];
    }
  }

  if (melhorCusto === Infinity)
    return {
      tour: [], custoTotal: 0, meta: "",
      erro: "Nenhum tour válido encontrado. Verifique se o grafo é hamiltoniano com as arestas desenhadas."
    };

  return {
    tour: melhorTour.map(i => listaDeNos[i].id),
    custoTotal: melhorCusto,
    meta: `${permutacoesTestadas.toLocaleString("pt-BR")} permutações · arestas desenhadas`,
  };
}


// ─── Painel de resultado do tour ──────────────────────────────────────────────

function PainelTour({
  resultado,
  grafo,
  cor,
  labelVazio,
  dicaVazia,
  labelInfo,
  labelTotal,
}: {
  resultado: ResultadoTour | ResultadoAproximacao | null;
  grafo: Grafo;
  cor: "azul" | "verde" | "laranja";
  labelVazio: string;
  dicaVazia: string;
  labelInfo: string;
  labelTotal: string;
}) {
  const estilos = {
    azul: {
      badge:  "bg-blue-500/30",
      card:   "bg-blue-500/20 border-blue-400/30",
      cardRet:"bg-blue-500/10 border-blue-400/20",
      total:  "bg-blue-500/20 border-blue-400/40",
      texto:  "text-blue-300"
    },
    verde: {
      badge:  "bg-green-500/30",
      card:   "bg-green-500/20 border-green-400/30",
      cardRet:"bg-green-500/10 border-green-400/20",
      total:  "bg-green-500/20 border-green-400/40",
      texto:  "text-green-300"
    },
    laranja: {
      badge:  "bg-orange-500/30",
      card:   "bg-orange-500/20 border-orange-400/30",
      cardRet:"bg-orange-500/10 border-orange-400/20",
      total:  "bg-orange-500/20 border-orange-400/40",
      texto:  "text-orange-300"
    },
  }[cor];

  return (
    <>
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        {resultado && !resultado.erro && (
          <div className="flex gap-2 flex-wrap">
            <span className={`text-xs ${estilos.badge} text-white rounded-full px-2 py-0.5`}>
              {resultado.tour.length} cidades
            </span>
            <span className="text-xs bg-white/20 text-white rounded-full px-2 py-0.5">
              Custo: {Math.round(resultado.custoTotal)}
            </span>
            <span className="text-xs bg-white/10 text-white/70 rounded-full px-2 py-0.5">
              {resultado.meta}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-1 min-h-0">
        {!resultado ? (
          <div className="h-full flex flex-col items-center justify-center text-white/50 text-sm gap-2">
            <span>{labelVazio}</span>
            <span className="text-xs text-center px-4 text-white/35">{dicaVazia}</span>
          </div>
        ) : resultado.erro ? (
          <div className="h-full flex flex-col items-center justify-center text-white/70 text-sm gap-2 px-4 text-center">
            <span>{resultado.erro}</span>
          </div>
        ) : (
          <>
            <div className="mb-3 rounded-lg bg-white/10 border border-white/20 px-3 py-2">
              <p className="text-white/60 text-xs mb-0.5">{labelInfo}</p>
              <p className={`text-xs font-medium ${estilos.texto}`}>{resultado.meta}</p>
              {'custoAGM' in resultado && (
                <p className="text-white/50 text-xs mt-0.5">
                  Custo da AGM: {Math.round((resultado as ResultadoAproximacao).custoAGM)}
                </p>
              )}
            </div>

            <p className="text-white/60 text-xs px-1 mb-1">Tour</p>

            {resultado.tour.map((id, indice) => {
              const noAtual  = grafo.nos.get(id);
              const idProximo = resultado.tour[(indice + 1) % resultado.tour.length];
              const noProximo = grafo.nos.get(idProximo);
              const arestasDesenhadas = obterArestasDesenhadas(grafo);
              const custoSegmento = noAtual && noProximo
                ? pesoAresta(noAtual.id, noProximo.id, arestasDesenhadas)
                : 0;
              const ehRetorno = indice === resultado.tour.length - 1;

              return (
                <div
                  key={indice}
                  className={`flex items-center gap-2 mb-1.5 rounded-lg px-3 py-2 text-sm border ${
                    ehRetorno ? estilos.cardRet : estilos.card
                  }`}
                >
                  <span className={`${estilos.texto} text-xs font-bold flex-shrink-0 w-5 text-center`}>
                    {indice + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold">
                      {noAtual?.nome}
                      <span className="text-white/50 font-normal"> → </span>
                      {noProximo?.nome}
                      {ehRetorno && (
                        <span className={`ml-1 ${estilos.texto} opacity-70 text-xs`}>(retorno)</span>
                      )}
                    </div>
                    <div className="text-white/50 text-xs">distância {Math.round(custoSegmento)}</div>
                  </div>
                </div>
              );
            })}

            <div className={`mt-2 rounded-lg ${estilos.total} border px-3 py-2 flex justify-between items-center`}>
              <span className="text-white/70 text-sm">{labelTotal}</span>
              <span className={`${estilos.texto} font-bold text-base`}>{Math.round(resultado.custoTotal)}</span>
            </div>
          </>
        )}
      </div>
    </>
  );
}



type Aba = "aproximacao" | "genetico" | "forcaBruta";

function App() {
  const [idArrastando, setIdArrastando]    = useState<string | null>(null);
  const [posicaoMouse, setPosicaoMouse]    = useState<[number, number]>([0, 0]);
  const [, forcarAtualizacao]   = useState(0);
  const [resultadoAproximacao, setResultadoAproximacao] = useState<ResultadoAproximacao | null>(null);
  const [resultadoAG, setResultadoAG]   = useState<ResultadoTour | null>(null);
  const [resultadoForca, setResultadoForca]  = useState<ResultadoTour | null>(null);
  const [abaAtiva, setAbaAtiva]  = useState<Aba>("aproximacao");
  const [grafo]  = useState(() => new Grafo());
  const [nos, setNos]  = useState<No[]>([]);
  const [modoAdicionarNo, setModoAdicionarNo]   = useState<boolean>(false);
  const [idSelecionado, setIdSelecionado]  = useState<string | null>(null);
  const [proximoNome, setProximoNome] = useState<number>(0);

  function encontrarNo(id: string) { 
    return nos.find(n => n.id === id); 
  }

  const mapaDeNos = new Map(nos.map(n => [n.id, n]));

  const resultadoAtivo =
    abaAtiva === "aproximacao" ? resultadoAproximacao :
    abaAtiva === "genetico"   ? resultadoAG           : resultadoForca;

  const arestasDoTour =
    resultadoAtivo && !resultadoAtivo.erro && resultadoAtivo.tour.length > 1
      ? tourParaConjuntoDeArestas(resultadoAtivo.tour)
      : undefined;

  return (
    <>
      <Header activeTab={abaAtiva} setActiveTab={setAbaAtiva} />
      <main className="w-full h-screen bg-gray-400">
        <div className="w-11/12 h-full mx-auto flex flex-row justify-between gap-2">

          {/* Canvas SVG */}
          <div className="w-2/3 h-4/5 self-center">
            <svg
              width="100%" height="100%"
              className="bg-white/30 rounded-xl"
              onMouseMove={(e) => setPosicaoMouse(pointer(e))}
              onMouseUp={() => setIdArrastando(null)}
              onClick={(e) => {
                if (modoAdicionarNo) {
                  const novoNo = criarNo(proximoNome, [pointer(e)[0], pointer(e)[1]]);
                  setNos([...nos, novoNo]);
                  grafo.adicionarNo(novoNo);
                  setProximoNome(proximoNome + 1);
                  setModoAdicionarNo(false);
                }
              }}
            >
              {renderizarArestas(grafo, arestasDoTour, mapaDeNos)}

              {/* Linha de prévia ao arrastar para criar aresta */}
              {idArrastando && (() => {
                const noOrigem = encontrarNo(idArrastando);
                if (!noOrigem) return null;
                return (
                  <line
                    x1={noOrigem.coordenadas[0]} y1={noOrigem.coordenadas[1]}
                    x2={posicaoMouse[0]} y2={posicaoMouse[1]}
                    stroke="white" strokeWidth={2} strokeDasharray="6"
                  />
                );
              })()}

              {nos.map(no => (
                <g key={no.id}>
                  {renderizarNo(
                    no,
                    idSelecionado,
                    setIdSelecionado,
                    idArrastando,
                    setIdArrastando,
                    grafo,
                    () => forcarAtualizacao(v => v + 1)
                  )}
                </g>
              ))}
            </svg>
          </div>

          <div className="w-1/3 flex flex-col place-content-center py-8">
            <div className="backdrop-blur-sm bg-white/30 rounded-xl w-full h-3/4 shadow-xl flex flex-col overflow-hidden">

              {/* Abas */}
              <div className="flex border-b border-white/20 flex-shrink-0">
                {(["aproximacao", "genetico", "forcaBruta"] as Aba[]).map((aba) => {
                  const rotulos: Record<Aba, string> = {
                    aproximacao: "Aproximação",
                    genetico:    "Alg. Genético",
                    forcaBruta:  "Caixeiro"
                  };
                  const cores: Record<Aba, string> = {
                    aproximacao: "border-blue-400",
                    genetico:    "border-green-400",
                    forcaBruta:  "border-orange-400"
                  };
                  return (
                    <button
                      key={aba}
                      onClick={() => setAbaAtiva(aba)}
                      className={`flex-1 py-3 text-xs font-bold transition-colors ${
                        abaAtiva === aba
                          ? `text-white border-b-2 ${cores[aba]} bg-white/10`
                          : "text-white/50 hover:text-white/80"
                      }`}
                    >
                      {rotulos[aba]}
                    </button>
                  );
                })}
              </div>

              {abaAtiva === "aproximacao" && (
                <PainelTour
                  resultado={resultadoAproximacao}
                  grafo={grafo}
                  cor="azul"
                  labelVazio="Clique em Executar para calcular"
                  dicaVazia="AGM via Kruskal + DFS pré-ordem. Usa apenas arestas desenhadas."
                  labelInfo="Método"
                  labelTotal="Distância total"
                />
              )}
              {abaAtiva === "genetico" && (
                <PainelTour
                  resultado={resultadoAG}
                  grafo={grafo}
                  cor="verde"
                  labelVazio="Clique em Executar para rodar"
                  dicaVazia="Genético com OX crossover, swap e mutação 2-opt. Usa apenas arestas desenhadas."
                  labelInfo="Parâmetros"
                  labelTotal="Distância total"
                />
              )}
              {abaAtiva === "forcaBruta" && (
                <PainelTour
                  resultado={resultadoForca}
                  grafo={grafo}
                  cor="laranja"
                  labelVazio="Clique em Executar para calcular"
                  dicaVazia={`Testa todas as rotas pelas arestas desenhadas. Limitado a ${MAX_NOS_FORCA_BRUTA} nós.`}
                  labelInfo="Busca exaustiva"
                  labelTotal="Distância total"
                />
              )}

              <div className="px-4 pb-4 pt-2 flex-shrink-0 border-t border-white/20">
                <div className="grid grid-cols-3 gap-2 h-10">
                  <button
                    className="w-full h-full bg-white/20 border border-white/30 rounded-full text-white font-bold text-sm hover:bg-white/30 transition-colors"
                    onClick={() => setModoAdicionarNo(true)}
                  >
                    + Nó
                  </button>
                  <button
                    className="w-full h-full bg-white/20 border border-white/30 rounded-full text-white font-bold text-sm hover:bg-white/30 transition-colors disabled:opacity-30"
                    disabled={!idSelecionado}
                    onClick={() => {
                      if (!idSelecionado) return;
                      grafo.removerNo(idSelecionado);
                      setNos(prev => prev.filter(n => n.id !== idSelecionado));
                      setIdSelecionado(null);
                      forcarAtualizacao(v => v + 1);
                    }}
                  >
                    − Nó
                  </button>
                  <button
                    className={`w-full h-full rounded-full text-white font-bold text-sm shadow-xl transition-colors ${
                      abaAtiva === "aproximacao" ? "bg-blue-500 hover:bg-blue-600"
                      : abaAtiva === "genetico"  ? "bg-green-500 hover:bg-green-600"
                                                 : "bg-orange-500 hover:bg-orange-600"
                    }`}
                    onClick={() => {
                      if (abaAtiva === "aproximacao") setResultadoAproximacao(executarAproximacaoTSP(grafo));
                      else if (abaAtiva === "genetico") setResultadoAG(executarAGTSP(grafo));
                      else setResultadoForca(executarForcaBrutaTSP(grafo));
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