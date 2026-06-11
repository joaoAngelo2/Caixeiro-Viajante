type Tab = "kruskal" | "ag" | "tsp";

interface HeaderProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
  return (
    <header className="w-full backdrop-blur-md bg-black/25 border-b border-white/15 shadow-lg">
      <div className="w-11/12 mx-auto h-14 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="5" cy="12" r="2" />
            <circle cx="19" cy="5" r="2" />
            <circle cx="19" cy="19" r="2" />
            <line x1="7" y1="11.5" x2="17" y2="6.5" />
            <line x1="7" y1="12.5" x2="17" y2="17.5" />
          </svg>
          <span className="text-white font-bold text-base tracking-tight">
            GraphEditor
          </span>
        </div>

        <div className="flex items-center bg-black/20 rounded-full p-1 gap-1">
          <button
            onClick={() => setActiveTab("kruskal")}
            className={`px-5 h-8 rounded-full text-sm font-bold transition-all duration-200 ${
              activeTab === "kruskal" ? "bg-blue-500 text-white shadow-md" : "text-white/60 hover:text-white"
            }`}
          >
            Aproximação
          </button>
          <button
            onClick={() => setActiveTab("ag")}
            className={`px-5 h-8 rounded-full text-sm font-bold transition-all duration-200 ${
              activeTab === "ag" ? "bg-green-500 text-white shadow-md" : "text-white/60 hover:text-white"
            }`}
          >
            Alg. Genético
          </button>
          <button
            onClick={() => setActiveTab("tsp")}
            className={`px-5 h-8 rounded-full text-sm font-bold transition-all duration-200 ${
              activeTab === "tsp" ? "bg-orange-500 text-white shadow-md" : "text-white/60 hover:text-white"
            }`}
          >
            Caixeiro
          </button>
        </div>

        <div className="w-28" />

      </div>
    </header>
  );
}