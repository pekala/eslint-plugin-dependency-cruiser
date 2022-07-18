import { useState } from "react";

// This import will produce an ESLint warning as it breaks
// the not-to-dev-dep dependency-cruiser rule
import { nanoid } from "nanoid";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="card">
      Id: {nanoid()}
      <button onClick={() => setCount((count) => count + 1)}>
        count is {count}
      </button>
    </div>
  );
}

export default Counter;
