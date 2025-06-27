import React, { useState, useRef } from "react";
import "./App.css";
import "./index.css";

// --- COMPONENTS ---

// PUBLIC_INTERFACE
function ThemeToggle({ theme, toggleTheme }) {
  /** This is a public function. */
  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}

// PUBLIC_INTERFACE
function CalculatorDisplay({ value }) {
  /** This is a public function. */
  return (
    <div className="calc-display" role="status" tabIndex={0} aria-live="polite">
      {value || "0"}
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * TI-84 Keypad with dynamic layouts based on contextual state (2nd, Alpha, etc).
 * This version adds an "x" button and mimics a TI-84's contextual key changing for 2nd, Alpha, Mode.
 */
function TI84Keypad({ onKeyPress }) {
  // States for modes: second (2nd), alpha, and mode
  const [secondActive, setSecondActive] = useState(false);
  const [alphaActive, setAlphaActive] = useState(false);
  const [modeActive, setModeActive] = useState(false);

  // Base keypad definitions: [primary key, 2nd function, alpha function]
  const keypadDefs = [
    [
      // Key labels: [Primary, 2nd Label, Alpha Label, (optional) Mode Label]
      { base: "2nd", alt: "2nd", alpha: "2nd" }, // Self toggle
      { base: "Mode", alt: "Mode", alpha: "Mode" }, // Self toggle
      { base: "Del", alt: "Ins", alpha: "Del" },
      { base: "Alpha", alt: "Alpha", alpha: "Alpha" }, // Self toggle
    ],
    [
      { base: "7", alt: "u", alpha: "A" },
      { base: "8", alt: "v", alpha: "B" },
      { base: "9", alt: "w", alpha: "C" },
      { base: "/", alt: "n/d", alpha: "/" },
    ],
    [
      { base: "4", alt: "r", alpha: "D" },
      { base: "5", alt: "s", alpha: "E" },
      { base: "6", alt: "t", alpha: "F" },
      { base: "*", alt: "×10^", alpha: "*" },
    ],
    [
      { base: "1", alt: "q", alpha: "G" },
      { base: "2", alt: "p", alpha: "H" },
      { base: "3", alt: "o", alpha: "I" },
      { base: "-", alt: "Ans", alpha: "-" },
    ],
    [
      { base: "0", alt: "θ", alpha: "J" },
      { base: ".", alt: "EE", alpha: "K" },
      { base: "(-)", alt: "π", alpha: "L" },
      { base: "+", alt: "Rnd", alpha: "+" },
    ],
    [
      { base: "Y=", alt: "Window", alpha: "Y=" },
      { base: "(", alt: "[", alpha: "M" },
      { base: ")", alt: "]", alpha: "N" },
      { base: "Graph", alt: "Table", alpha: "Graph" },
    ],
    [
      { base: "sin", alt: "sin⁻¹", alpha: "sin" },
      { base: "cos", alt: "cos⁻¹", alpha: "cos" },
      { base: "tan", alt: "tan⁻¹", alpha: "tan" },
      { base: "^", alt: "√", alpha: "^" },
    ],
    [
      { base: "ln", alt: "eˣ", alpha: "ln" },
      { base: "log", alt: "10ˣ", alpha: "log" },
      { base: "sqrt", alt: "x²", alpha: "x" }, // Here, alpha gives us the "x" variable
      { base: "=", alt: "Sto→", alpha: "=" },
    ],
  ];

  // Helper to get visible label based on state
  function getLabel(def) {
    if (alphaActive) return def.alpha ? def.alpha : def.base;
    if (secondActive) return def.alt ? def.alt : def.base;
    return def.base;
  }

  // Handler for key click (toggles for special keys, passes proper value for others)
  function handleButtonClick(def) {
    const mainLabel = def.base;

    // Special button handlers
    if (mainLabel === "2nd") {
      setSecondActive((val) => !val);
      setAlphaActive(false);
      setModeActive(false);
      return;
    }
    if (mainLabel === "Alpha") {
      setAlphaActive((val) => !val);
      setSecondActive(false);
      setModeActive(false);
      return;
    }
    if (mainLabel === "Mode") {
      setModeActive((val) => !val); // You may define a special mode keypad layout if needed
      setSecondActive(false);
      setAlphaActive(false);
      return;
    }

    // "Del" key (could be context-sensitive, e.g., "Ins" in 2nd mode)
    if (mainLabel === "Del" && secondActive) {
      onKeyPress("Ins");
      setSecondActive(false);
      return;
    }

    // "sqrt" key when alpha is pressed → 'x'
    if (mainLabel === "sqrt" && alphaActive) {
      onKeyPress("x");
      setAlphaActive(false);
      return;
    }

    // Normal key (returns the correct contextual label)
    const val = getLabel(def);

    // After entering a normal key, reset 2nd or alpha mode
    if (alphaActive || secondActive) {
      onKeyPress(val);
      setAlphaActive(false);
      setSecondActive(false);
    } else {
      onKeyPress(val);
    }
  }

  // For Mode button, optionally switch to a special mode layout
  // For simplicity, no alternative layout implemented for Mode, but state can be used in future
  // You can expand this with a "modeDefs" if needed

  return (
    <div className="calc-keypad" role="group" aria-label="Calculator keypad">
      {keypadDefs.map((row, rIdx) => (
        <div key={`row-${rIdx}`} className="keypad-row">
          {row.map((def, cIdx) => (
            <button
              key={getLabel(def) + cIdx}
              className="keypad-btn"
              onClick={() => handleButtonClick(def)}
              type="button"
              tabIndex={0}
              aria-label={getLabel(def)}
              style={
                (def.base === "2nd" && secondActive) ||
                (def.base === "Alpha" && alphaActive) ||
                (def.base === "Mode" && modeActive)
                  ? { background: "#ffc107", color: "#212121", fontWeight: "bold" }
                  : {}
              }
            >
              {getLabel(def)}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// PUBLIC_INTERFACE
function EquationInput({ equation, onEquationChange, onSubmit }) {
  /** This is a public function. */
  return (
    <form
      className="equation-input-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      autoComplete="off"
    >
      <input
        type="text"
        className="equation-input"
        placeholder="Enter equation, e.g. y=2x+1"
        value={equation}
        onChange={(e) => onEquationChange(e.target.value)}
        aria-label="Equation input"
        autoFocus={true}
      />
      <button className="equation-submit-btn" type="submit" aria-label="Plot Graph">
        Plot
      </button>
    </form>
  );
}

// PUBLIC_INTERFACE
function HistoryList({ items, onSelect }) {
  /** This is a public function. */
  return (
    <div className="history-list" aria-label="History / Log">
      <h3>History</h3>
      {items.length === 0 ? (
        <div className="history-empty">No calculations yet.</div>
      ) : (
        <ul>
          {items.map((entry, idx) => (
            <li key={idx}>
              <button className="history-equation" onClick={() => onSelect(entry.equation)}>
                {entry.equation}
              </button>
              <span className="history-result">{entry.result || ""}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// PUBLIC_INTERFACE
function GraphPlotArea({ equations, zoom, pan, setZoom, setPan }) {
  /**
   * Public interface: Interactive SVG graphing area for visualizing y=... equations.
   * @param {equations} list of equation strings (currently only supports y=... with x)
   * @param {zoom} zoom scalar, {x:..., y:...}
   * @param {pan} pan offset, {x:..., y:...}
   * @param {setZoom} setZoom({x, y}) - callback for user zoom
   * @param {setPan} setPan({x, y}) - callback for user pan
   */
  // Constants for drawing
  const width = 520;
  const height = 400;
  const centerX = width / 2 + pan.x;
  const centerY = height / 2 + pan.y;
  const scaleX = 25 * zoom.x; // Scale factors for coordinate mapping
  const scaleY = 25 * zoom.y;

  const svgRef = useRef(null);
  const isDragging = useRef(false);
  const dragOrigin = useRef({ x: 0, y: 0 });
  const panOrigin = useRef({ ...pan });

  // Event handlers for pan/zoom
  function handleWheel(evt) {
    evt.preventDefault();
    const deltaY = evt.deltaY;
    const newZoom = {
      x: Math.max(0.4, Math.min(8, zoom.x * (deltaY < 0 ? 1.1 : 0.9))),
      y: Math.max(0.4, Math.min(8, zoom.y * (deltaY < 0 ? 1.1 : 0.9))),
    };
    setZoom(newZoom);
  }

  function handleMouseDown(evt) {
    isDragging.current = true;
    dragOrigin.current = { x: evt.clientX, y: evt.clientY };
    panOrigin.current = { ...pan };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }

  function handleMouseMove(evt) {
    if (!isDragging.current) return;
    const dx = evt.clientX - dragOrigin.current.x;
    const dy = evt.clientY - dragOrigin.current.y;
    setPan({ x: panOrigin.current.x + dx, y: panOrigin.current.y + dy });
  }

  function handleMouseUp() {
    isDragging.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }

  // Helper: Parse and plot only simple y=... expressions for this version
  function plotEquation(eq) {
    // Very simplified equation parser for "y = mx + b", "y=ax^2+bx+c", "y=..." in terms of x only
    let f;
    try {
      // Extract right side of y=...
      let rhs = eq.replace(/\s/g, "");
      if (!rhs.match(/^y=/i)) return null;
      rhs = rhs.substring(2);
      // "Unsafe" Function building as a placeholder for demo only; in production use math.js or a parser
      f = new Function("x", `return ${rhs};`);
    } catch {
      return null;
    }
    // Build SVG polyline points
    const points = [];
    for (let px = 0; px < width; px++) {
      // Convert pixel X back to math-plane X
      let x = (px - centerX) / scaleX;
      let y;
      try {
        y = f(x); // get math Y
        if (typeof y !== "number" || !isFinite(y)) continue;
      } catch {
        continue;
      }
      // Map math-plane Y back to SVG-pix Y
      let svgY = centerY - y * scaleY;
      if (svgY < 0 || svgY > height) continue;
      points.push(`${px},${svgY}`);
    }
    return points.length > 1 ? <polyline points={points.join(" ")} fill="none" stroke="#1565c0" strokeWidth="2" /> : null;
  }

  // Draw grid lines for UX clarity
  function drawGridLines() {
    const gridLines = [];
    const step = scaleX;
    for (let x = centerX % step; x < width; x += step) {
      gridLines.push(
        <line
          key={"vg" + x}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          stroke="#e9ecef"
          strokeWidth={x === centerX ? 2 : 1}
        />
      );
    }
    for (let y = centerY % scaleY; y < height; y += scaleY) {
      gridLines.push(
        <line
          key={"hg" + y}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke="#e9ecef"
          strokeWidth={y === centerY ? 2 : 1}
        />
      );
    }
    return gridLines;
  }

  return (
    <div className="graph-plot-area">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        tabIndex={0}
        className="graph-svg"
        aria-label="Function graph"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
      >
        {/* Draw grid */}
        {drawGridLines()}
        {/* Axis */}
        <line
          x1={0}
          y1={centerY}
          x2={width}
          y2={centerY}
          stroke="#bbb"
          strokeWidth="1"
        />
        <line
          x1={centerX}
          y1={0}
          x2={centerX}
          y2={height}
          stroke="#bbb"
          strokeWidth="1"
        />
        {/* Functions */}
        {equations.map((eq, idx) =>
          <g key={eq + idx}>
            {plotEquation(eq)}
          </g>
        )}
      </svg>
      <div className="graph-hint">
        <span>Zoom: Mouse wheel &nbsp;|&nbsp; Pan: Drag</span>
      </div>
    </div>
  );
}

// ====================
// MAIN APP COMPONENT
// ====================
/**
 * PUBLIC_INTERFACE
 * TI-84 Graphing Calculator React App: Combines calculator UI and plotting.
 */
function App() {
  // State management
  const [theme, setTheme] = useState("light");
  const [displayValue, setDisplayValue] = useState("0");
  const [equation, setEquation] = useState("");
  const [history, setHistory] = useState([]);
  const [equationsToPlot, setEquationsToPlot] = useState([]);
  const [zoom, setZoom] = useState({ x: 1, y: 1 });
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Apply theme to <html>
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  function toggleTheme() {
    /** This is a public function. */
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  // Handle input from keypad
  function handleKeypad(key) {
    // Support for arithmetic evaluation (when not a "y=" graphing equation)
    if (key === "Del") {
      setEquation((eq) => eq.slice(0, -1));
    } else if (key === "Ins") {
      // Optional: Insert dummy space, or implement insert cursor action
    } else if (key === "=" || key === "Graph" || key === "Plot") {
      handleEquationSubmit();
    } else if (key === "Y=") {
      setEquation("y=");
    } else if (key === "(-)") {
      setEquation((eq) => eq + "-");
    } else if (["sin", "cos", "tan", "ln", "log", "sqrt", "sin⁻¹", "cos⁻¹", "tan⁻¹", "eˣ", "10ˣ", "π", "θ", "EE", "Rnd", "Ans", "Sto→", "x²", "√", "×10^", "n/d"].includes(key)) {
      // Functions with parentheses:
      if (
        [
          "sin", "cos", "tan", "sin⁻¹", "cos⁻¹", "tan⁻¹", "ln", "log", "sqrt", "eˣ", "10ˣ"
        ].includes(key)
      ) {
        setEquation((eq) => eq + key + "(");
      } else if (key === "x²") {
        setEquation((eq) => eq + "^2");
      } else {
        setEquation((eq) => eq + key);
      }
    } else if (
      "0123456789.+-*/^()".includes(key) || key === "x" ||
      /^[A-Za-z]$/.test(key)
    ) {
      setEquation((eq) => eq + key);
    }
    // Mode, Alpha, 2nd do not directly add text, they are handled by the keypad state
  }

  // Evaluates basic arithmetic safely for numbers only (no variables)
  function safeEval(expr) {
    try {
      // Only allow numbers, operators, decimal, and parentheses
      if (!/^[0-9+\-*/().\s^]+$/.test(expr)) return null;
      // Convert ^ to ** for JS evaluation
      // eslint-disable-next-line no-eval
      // Limit: Don't eval if it contains alpha variables (e.g. x), only arithmetic
      if (/[A-Za-z]/.test(expr)) return null;
      // Replace ^ with ** for exponentiation
      const jsExpr = expr.replace(/\^/g, "**");
      // eslint-disable-next-line no-eval
      const result = eval(jsExpr);
      if (typeof result === "number" && isFinite(result)) {
        return result;
      }
      return null;
    } catch {
      return null;
    }
  }

  // On submit: handle arithmetic or graph equation, and store in history
  function handleEquationSubmit() {
    const trimmed = equation.trim();
    if (trimmed.length === 0) return;
    if (trimmed.toLowerCase().startsWith("y=")) {
      setHistory([{ equation, result: "" }, ...history.slice(0, 24)]); // keep only last 25
      setEquationsToPlot([equation]);
      setDisplayValue(equation);
    } else {
      // Try arithmetic evaluation
      const res = safeEval(trimmed);
      let resultDisplay = "";
      if (res !== null) {
        resultDisplay = res.toString();
      } else {
        resultDisplay = "Error";
      }
      setHistory([{ equation, result: resultDisplay }, ...history.slice(0, 24)]);
      setEquationsToPlot([]); // Don't plot arithmetic
      setDisplayValue(resultDisplay);
    }
  }

  // On selecting from history, re-set the equation
  function handleHistorySelect(eq) {
    setEquation(eq);
    setEquationsToPlot([eq]);
    setDisplayValue(eq);
  }

  function handleEquationInputChange(val) {
    setEquation(val);
  }

  // Show either arithmetic result, current editing value, or last equation depending on mode
  // If arithmetic result (displayValue) and input box not actively being edited (for arithmetic), show result
  // If in equation entry mode, show current equation or "0"
  // If just graphed, show equation just graphed
  // If just evaluated arithmetic, show result

  // Determine what to show in the calculator display:
  // Show arithmetic result after evaluation, else current equation (while editing), else last graphed equation
  let toDisplay;
  if (displayValue && displayValue !== equation && displayValue !== "0") {
    // When displayValue is a number/string, after arithmetic
    toDisplay = displayValue;
  } else if (equation) {
    // While editing or after entering new equation
    toDisplay = equation;
  } else {
    toDisplay = "0";
  }

  return (
    <div className="App">
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      <main className="main-calc-graph">
        <section className="calculator-panel">
          <CalculatorDisplay value={toDisplay} />
          <EquationInput
            equation={equation}
            onEquationChange={handleEquationInputChange}
            onSubmit={handleEquationSubmit}
          />
          <TI84Keypad onKeyPress={handleKeypad} />
          <HistoryList items={history} onSelect={handleHistorySelect} />
        </section>
        <section className="graph-panel">
          <GraphPlotArea
            equations={equationsToPlot}
            zoom={zoom}
            pan={pan}
            setZoom={setZoom}
            setPan={setPan}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
