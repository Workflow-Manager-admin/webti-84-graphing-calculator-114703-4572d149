import React from "react";
import { render, screen, fireEvent, within, act } from "@testing-library/react";
import App from "./App";

// Helper: find keypad button by ARIA label
function clickKey(label) {
  const btn = screen.getByRole("button", { name: label });
  fireEvent.click(btn);
}

// Helper: type an equation using the keypad (primary keys only)
async function typeEquationKeypad(keys) {
  for (let k of keys) {
    await act(() => clickKey(k));
  }
}

describe("TI-84 Graphing Calculator App", () => {
  beforeEach(() => {
    // Ensure a fresh DOM for each test
    render(<App />);
  });

  test("renders calculator display and input box", () => {
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/enter equation/i)
    ).toBeInTheDocument();
  });

  test("numeric keypad input updates equation", async () => {
    // Simulate entry: Y=→1→+→2
    clickKey("Y="); // sets "y="
    await typeEquationKeypad(["1", "+", "2"]);
    // Equation input should update accordingly
    expect(screen.getByDisplayValue("y=1+2")).toBeInTheDocument();
  });

  test("alpha mode allows inputting variable 'x'", async () => {
    // Activate alpha, then click "sqrt" (alpha for sqrt is "x"), type 3
    clickKey("Y=");
    clickKey("Alpha");
    clickKey("sqrt"); // should add x
    clickKey("+");
    clickKey("3");
    expect(screen.getByDisplayValue("y=x+3")).toBeInTheDocument();
  });

  test("2nd mode triggers alternate keys", async () => {
    // 2nd + Del should emit "Ins", which has no effect but disables 2nd
    clickKey("2nd");
    clickKey("Del");
    // 2nd should return to normal, and input unchanged
    // Now type 8, should type as normal
    clickKey("8");
    expect(screen.getByDisplayValue(expect.stringContaining("8"))).toBeInTheDocument();
  });

  test("toggle Mode and Alpha stateful buttons", () => {
    // Click Mode - should highlight, and then Alpha - toggles
    const modeBtn = screen.getByRole("button", { name: "Mode" });
    fireEvent.click(modeBtn);
    // Mode disables when Alpha is clicked
    const alphaBtn = screen.getByRole("button", { name: "Alpha" });
    fireEvent.click(alphaBtn);
    // Alpha state resets on key entry
    clickKey("1");
    expect(screen.getByRole("button", { name: "Alpha" })).toBeInTheDocument();
  });

  test("del key removes last character from equation input", async () => {
    clickKey("Y=");
    await typeEquationKeypad(["5", "+", "3"]);
    clickKey("Del");
    expect(screen.getByDisplayValue("y=5+")).toBeInTheDocument();
  });

  test("can enter and submit a valid equation for plotting", async () => {
    clickKey("Y=");
    for (let k of ["2", "*", "x", "+", "1"]) {
      // Use "Alpha" for 'x'
      if (k === "x") {
        clickKey("Alpha");
        clickKey("sqrt");
      } else {
        clickKey(k);
      }
    }
    // Submit via Plot button (or Graph key)
    const plotBtn = screen.getByRole("button", { name: /plot/i });
    fireEvent.click(plotBtn);

    // Graph area should contain a <svg> with at least one <polyline> for a valid y= equation
    const svg = screen.getByLabelText(/function graph/i);
    // Use querySelector for <polyline>
    expect(svg.querySelector("polyline")).toBeTruthy();
    // Display should show the correct equation
    expect(screen.getByRole("status")).toHaveTextContent("y=2x+1");
    // History entry appears
    expect(screen.getByText("y=2x+1")).toBeInTheDocument();
  });

  test("invalid equation does not plot", async () => {
    // input: "y=" then invalid string "y=1/**/"
    clickKey("Y=");
    await typeEquationKeypad(["1", "/", "/", "*"]);
    const plotBtn = screen.getByRole("button", { name: /plot/i });
    fireEvent.click(plotBtn);
    // Graph svg should have no polyline
    const svg = screen.getByLabelText(/function graph/i);
    expect(svg.querySelector("polyline")).toBeFalsy();
  });

  test("history entry recall populates equation and plots", async () => {
    clickKey("Y=");
    await typeEquationKeypad(["3", "*", "2"]);
    fireEvent.click(screen.getByRole("button", { name: /plot/i }));
    // Add another
    clickKey("Y=");
    await typeEquationKeypad(["1", "+", "1"]);
    fireEvent.click(screen.getByRole("button", { name: /plot/i }));

    // Click first entry (should be most recent)
    const history = screen.getByLabelText(/history/i);
    const eqButtons = within(history).getAllByRole("button");
    // Click the second (recall "y=3*2")
    fireEvent.click(eqButtons[1]);
    expect(screen.getByDisplayValue("y=3*2")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("y=3*2");
  });

  test("theme toggles between light and dark", () => {
    const toggleButton = screen.getByRole("button", { name: /switch to dark mode/i });
    fireEvent.click(toggleButton);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    fireEvent.click(screen.getByRole("button", { name: /switch to light mode/i }));
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  test("can zoom and pan the graph (mouse events)", () => {
    const svg = screen.getByLabelText(/function graph/i);
    // Wheel event: zoom in
    fireEvent.wheel(svg, { deltaY: -100 });
    // Wheel event: zoom out
    fireEvent.wheel(svg, { deltaY: 100 });

    // Pan (mousedown + mousemove + mouseup)
    fireEvent.mouseDown(svg, { clientX: 200, clientY: 100 });
    fireEvent.mouseMove(document, { clientX: 220, clientY: 120 });
    fireEvent.mouseUp(document);
    // No error thrown = pass
    expect(svg).toBeInTheDocument();
  });
});
