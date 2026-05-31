import { Link, useLocation } from "react-router";

const Header = () => {
  const location = useLocation();

  const active = "bg-blue-600 text-white shadow-lg";

  const inactive = "bg-white/80 text-gray-700 hover:bg-white";

  return (
    <header className="w-full bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">
          Teoria da Computação
        </h1>

        <ul className="flex gap-3">
          <li>
            <Link to="/" className={`px-4 py-2 rounded-xl transition-all duration-200 font-medium ${location.pathname === "/" ? active : inactive}`}>
              AGM
            </Link>
          </li>

          <li>
            <Link to="/ag" className={`px-4 py-2 rounded-xl transition-all duration-200 font-medium ${location.pathname === "/ag" ? active : inactive}`}>
              Algoritmo Genético
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;