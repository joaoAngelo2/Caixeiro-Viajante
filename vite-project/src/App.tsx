import Header from "./components/Header"

function App() {


  return (
    <>
      <Header />
      <main className="w-full h-screen bg-gray-100">
        <div className="w-11/12 h-full mx-auto flex flex-row justify-between gap-2">
          <div className="bg-blue-500 w-2/3">Content 1</div>
          <div className="bg-blue-500 w-1/3 flex flex-col justify-between">
            <p className="text-center font-lato font-[500] text-lg">Configuração da Rota</p>
            <div className="my-0 bg-amber-600 rounded-xl h-2/3 w-full"/>
            <div className="flex flex-row justify-between bg-red-700 h-12">
              <button className="bg-blue-800 px-20 py-1 rounded-md">Iniciar</button>
              <button className="bg-blue-800 px-20 py-1 rounded-md">Parar</button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default App
