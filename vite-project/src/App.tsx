import Header from "./components/Header"
import { useState, useEffect } from "react";
import {pointer} from 'd3';




class Node{
  id: string;
  name: number;
  color: string;
  coordinates: [number, number];
  edges: Edge[];

  constructor(name: number, color: string, coordinates: [number, number]){
    this.id = crypto.randomUUID(); 
    this.name = name;
    this.color = color;
    this.coordinates = coordinates;
    this.edges = [];
  }
  getId(): string{
    return this.id;
  }

  getName(): number{
    return this.name;
  }
  getColor(): string{
    return this.color;
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

}


// ao clicar no botão adicionar deve ser criado um novo nó, e arrasta na tela onde deve ficar, e ao clicar no botão remover deve ser removido o nó selecionado

function createNode(name: number, color: string, coordinates: [number, number]): Node{
   const newNode = new Node(name, color, coordinates);
   
   return newNode;
}

function renderNode(node: Node){
  return (
    <>
    <circle r={30} cx={node.getCoordinates()[0]} cy={node.getCoordinates()[1]} className="fill-white/10 stroke-white/40" strokeWidth={2} opacity={0.9} />
    <text x={node.getCoordinates()[0]-5} y={node.getCoordinates()[1]+5}>{node.name}</text>
    </>
  )
}


function generateColor(): string{
  const hex = [0,1,2,3,4,5,6,7,9,'a','b','c','d','e','f'];
  let color = "#";
  for(let i=1; i<=6; i++){
    color += hex[Math.floor(Math.random() * hex.length)];
  }
  return color;
}



function App() {
  
  const [nodes, setNodes] = useState<Node[]>([]);
  const [adicionarClicked, setAdicionarClicked] = useState<boolean>(false);
  const [removeNodeClicked, setRemoveNodeClicked] = useState<boolean>(false);
  const [names, setNames] = useState<number>(0);

  return (
    <>
      <Header />
      <main className="w-full h-screen bg-gray-400">
        <div className="w-11/12 h-full mx-auto flex flex-row justify-between gap-2">
          <div className="w-2/3 h-4/5 self-center">
            <svg width="100%" height="100%" className="bg-white/20 rounded-xl" onClick={(e) => {
              if(adicionarClicked){
                const newNode = createNode(names,generateColor(), [pointer(e)[0], pointer(e)[1]]);
                setNodes([...nodes, newNode]);
                setNames(names + 1);
                setAdicionarClicked(false);
              }
              if(removeNodeClicked){
                setNodes(nodes.filter(n => n.getId() !== id));
              }
            }}>
              {
              nodes.map(node =>
                renderNode(node))
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
                    <button className="w-full h-full bg-blue-500 rounded-full shadow-xl inset-shadow-white inset-shadow-sm/50 text-white font-bold" onClick={()=>{setRemoveNodeClicked(true);}}>Remover</button>
                  </div>
              </div> 
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default App
