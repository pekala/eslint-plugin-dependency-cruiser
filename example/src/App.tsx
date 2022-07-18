import "./App.css";
import Header from "./components/header/header";
import Counter from "./components/counter/counter";

function App() {
  return (
    <div className="App">
      <Header />
      <h1>Vite + React</h1>
      <Counter />
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  );
}

export default App;
