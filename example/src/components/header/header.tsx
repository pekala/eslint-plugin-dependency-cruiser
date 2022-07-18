import reactLogo from "./assets/react.svg";

// This import will produce an ESLint error as it breaks
// the no-inter-page dependency-cruiser rule
import Counter from "../counter/counter";

function Header() {
  return (
    <div>
      <Counter />
      <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
        <img src="/vite.svg" className="logo" alt="Vite logo" />
      </a>
      <a href="https://reactjs.org" target="_blank" rel="noreferrer">
        <img src={reactLogo} className="logo react" alt="React logo" />
      </a>
    </div>
  );
}

export default Header;
