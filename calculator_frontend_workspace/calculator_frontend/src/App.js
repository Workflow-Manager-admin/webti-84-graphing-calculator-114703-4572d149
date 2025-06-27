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

// PUBLIC_INTERFACE
function TI84Keypad({ onKeyPress }) {
  /**
   * TI-84 style keypad layout; emits button values via onKeyPress.
   * This is a public function.
   */
  const keys = [
    ["2nd", "Mode", "Del", "Alpha"],
    ["7", "8", "9", "/"],
    ["4", "5", "6", "*"],
    ["1", "2", "3", "-"],
    ["0", ".", "(-)", "+"],
    ["Y=", "(", ")", "Graph"],
    ["sin", "cos", "tan", "^"],
    ["ln", "log", "sqrt", "="],
  ];

  return (
    <div className="calc-keypad" role="group" aria-label="Calculator keypad">
      {keys.map((row, rowIdx) => (
        <div key={rowIdx} className="keypad-row">
          {row.map((key) => (
            <button
              key={key}
              className="keypad-btn"
              onClick={() => onKeyPress(key)}
              type="button"
              tabIndex={0}
              aria-label={key}
            >
              {key}
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
    // Handle calculator and equation keys
    if (key === "Del") {
      setEquation((eq) => eq.slice(0, -1));
    } else if (key === "=" || key === "Graph" || key === "Plot") {
      handleEquationSubmit();
    } else if (key === "Y=") {
      setEquation("y=");
    } else if (key === "(-)") {
      setEquation((eq) => eq + "-");
    } else if (["sin", "cos", "tan", "ln", "log", "sqrt"].includes(key)) {
      setEquation((eq) => eq + key + "(");
    } else if ("0123456789.+-*/^()".includes(key) || /^[A-Za-z]$/.test(key)) {
      setEquation((eq) => eq + key);
    } // ignore other special keys for now (Mode, Alpha, 2nd)
  }

  // On submit: try to plot and add to log
  function handleEquationSubmit() {
    if (!equation.trim().toLowerCase().startsWith("y=")) return;
    setHistory([{ equation, result: "" }, ...history.slice(0, 24)]); // keep only last 25
    setEquationsToPlot([equation]);
    setDisplayValue(equation);
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

  return (
    <div className="App">
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      <main className="main-calc-graph">
        <section className="calculator-panel">
          <CalculatorDisplay value={displayValue || equation} />
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
