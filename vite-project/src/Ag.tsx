import Header from "./components/Header"
import { useState, useEffect } from "react";
import {pointer, drag} from 'd3';



class Node{
  id: string;
  name: number;
  coordinates: [number, number];
  edges: Edge[];

  constructor(name: number, coordinates: [number, number]){
    this.id = crypto.randomUUID(); 
    this.name = name;
    this.coordinates = coordinates;
    this.edges = [];
  }
  getId(): string{
    return this.id;
  }

  getName(): number{
    return this.name;
  }
  getCoordinates(): [number, number]{
    return this.coordinates;
  }
}

class Edge{
    to: string;
    weight: number;

    constructor(to: string, weight: number)
    {
      this.to = to;
      this.weight = weight;
    }

    setWeight(weight: number){
      this.weight = weight;
    }
}

class Graph{
   nodes: Map<string, Node>;
   
   constructor(){
    this.nodes = new Map();
   }
   addNode(node: Node){
    this.nodes.set(node.id, node);
   }
   addEdge(a: string, b: string) {
      const nodeA = this.nodes.get(a);
      const nodeB = this.nodes.get(b);

      if (!nodeA || !nodeB) return;

      if (nodeA.edges.some(edge => edge.to === b))
        return;

      const dist = Math.sqrt(
        Math.pow(nodeA.coordinates[0] - nodeB.coordinates[0], 2) +
        Math.pow(nodeA.coordinates[1] - nodeB.coordinates[1], 2)
      );

      nodeA.edges.push(new Edge(b, dist));
      nodeB.edges.push(new Edge(a, dist));
    }
    removeNode(id: string) {
      const node = this.nodes.get(id);

      if (!node) 
        return;
      for (const current of this.nodes.values()) {
        current.edges = current.edges.filter(
          edge => edge.to !== id
        );
      }

      this.nodes.delete(id);
    }
}





// ao clicar no botão adicionar deve ser criado um novo nó, e arrasta na tela onde deve ficar, e ao clicar no botão remover deve ser removido o nó selecionado

function createNode(name: number, coordinates: [number, number]): Node{
   const newNode = new Node(name, coordinates);
   
   return newNode;
}

function renderEdges(graph: Graph) {
  const rendered = new Set<string>();

  return Array.from(graph.nodes.values()).flatMap(node =>
    node.edges.map(edge => {

      const key = node.id < edge.to ? `${node.id}-${edge.to}`: `${edge.to}-${node.id}`;

      if (rendered.has(key))
        return null;

      rendered.add(key);

      const target = graph.nodes.get(edge.to);

      if (!target)
        return null;

      return (
        <line
          key={key}
          x1={node.coordinates[0]}
          y1={node.coordinates[1]}
          x2={target.coordinates[0]}
          y2={target.coordinates[1]}
          stroke="white"
          strokeWidth={2}
        />
      );
    })
  );
}

function renderNode(node: Node,selectedId: string | null, setSelectedId: (id:string) => void,draggingEdge: string | null,setDraggingEdge: (id:string | null) => void, graph: Graph,refresh: () => void){
  return (
    <>
    <circle r={30} cx={node.coordinates[0]}  cy={node.coordinates[1]} fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth={selectedId === node.id ? 4 : 2} onClick={(e)=>{ e.stopPropagation(); setSelectedId(node.id); }}
      onMouseDown={(e)=>{
        e.stopPropagation();
        setDraggingEdge(node.id);
      }}
      onMouseUp={(e)=>{
        e.stopPropagation();

        if (
          draggingEdge &&
          draggingEdge !== node.id
        ) {
          graph.addEdge(
            draggingEdge,
            node.id
          );
          refresh();
        }
        setDraggingEdge(null);
      }}/>
    <text x={node.getCoordinates()[0]-5} y={node.getCoordinates()[1]+5}>{node.name}</text>
    </>
  )
}



function Ag() {
  const [draggingEdge, setDraggingEdge] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<[number, number]>([0, 0]);
  const [, forceUpdate] = useState(0);
  const [graph] = useState(() => new Graph());
  const [nodes, setNodes] = useState<Node[]>([]);
  const [adicionarClicked, setAdicionarClicked] = useState<boolean>(false);
  const [removeNodeClicked, setRemoveNodeClicked] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [names, setNames] = useState<number>(0);

  function findNode(id: string) {
    return nodes.find(node => node.id === id);
  }

  return (
    <>
      <Header />
      <main className="w-full h-screen bg-gray-400">
        <div className="w-11/12 h-full mx-auto flex flex-row justify-between gap-2">
          <div className="w-2/3 h-4/5 self-center">
            <svg width="100%" height="100%" className="bg-white/30 rounded-xl"
              onMouseMove={(e) => {
                setMousePos(pointer(e));
              }}
              onMouseUp={() => {
                setDraggingEdge(null);
              }}
              onClick={(e) => {
                if (adicionarClicked) {
                  const newNode = createNode(
                    names,
                    [pointer(e)[0], pointer(e)[1]]
                  );

                  setNodes([...nodes, newNode]);
                  graph.addNode(newNode);

                  setNames(names + 1);
                  setAdicionarClicked(false);
                }
              }}
            >
              {renderEdges(graph)}
              {
                draggingEdge && (() => {

                  const source = findNode(draggingEdge);

                  if (!source) return null;

                  return (
                    <line
                      x1={source.coordinates[0]}
                      y1={source.coordinates[1]}
                      x2={mousePos[0]}
                      y2={mousePos[1]}
                      stroke="white"
                      strokeWidth={2}
                      strokeDasharray="6"
                    />
                  );
                })()
              }
              {
              nodes.map(node => (
                <g key={node.id}>
                  {renderNode(
                    node,
                    selectedId,
                    setSelectedId,
                    draggingEdge,
                    setDraggingEdge,
                    graph,
                    () => forceUpdate(v => v + 1)
                  )}
                </g>
              ))
              }
            </svg>
          </div>
          <div className=" w-1/3 flex flex-col place-content-center">
            <div className=" backdrop-blur-sm bg-white/30  rounded-xl h-3/4 w-full grid place-items-center shadow-xl inset-shadow-white inset-shadow-sm/50">
              <div className="w-4/5 h-4/5 flex flex-col justify-between">
                  <div>
                  </div>
                  <div className="grid grid-cols-2 w-full h-14 gap-2">
                    <button className="w-full h-full bg-blue-500 rounded-full shadow-xl inset-shadow-white inset-shadow-sm/50 text-white font-bold" onClick={()=> {setAdicionarClicked(true);}}>Adicionar</button>
                    <button className="w-full h-full bg-blue-500 rounded-full shadow-xl inset-shadow-white inset-shadow-sm/50 text-white font-bold" onClick={() => {                     
                        if (!selectedId) return;

                        graph.removeNode(selectedId);

                        setNodes(prev =>
                          prev.filter(node => node.id !== selectedId)
                        );

                        setSelectedId(null);

                        forceUpdate(v => v + 1);
                      }}>Remover</button>
                  </div>
              </div> 
            </div>
          </div>
        </div>
      </main>
    </>
  )
}



export default Ag
