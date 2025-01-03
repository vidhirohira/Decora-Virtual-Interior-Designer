import React, { useState, useRef} from "react";
import { Stage, Layer, Line, Text } from "react-konva";
import { useNavigate } from "react-router-dom";
import './Floorplan2d.css'

const GRID_SIZE = 20;

const FloorPlan = () => {
  const [walls, setWalls] = useState([]); // Array of walls (lines)
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState("draw"); // Tool selection: draw, move, delete
  const [unit, setUnit] = useState("feet"); // Default unit is feet
  const stageRef = useRef();
  const navigate = useNavigate();

  // Conversion factor
  const conversionFactor = unit === "feet" ? 1 : 0.3048;

  // Create grid lines
  const createGrid = (width, height, gridSize) => {
    const gridLines = [];
    for (let i = 0; i <= width / gridSize; i++) {
      gridLines.push(
        <Line
          key={`v-${i}`}
          points={[i * gridSize, 0, i * gridSize, height]}
          stroke="#ddd"
          strokeWidth={1}
        />
      );
    }
    for (let i = 0; i <= height / gridSize; i++) {
      gridLines.push(
        <Line
          key={`h-${i}`}
          points={[0, i * gridSize, width, i * gridSize]}
          stroke="#ddd"
          strokeWidth={1}
        />
      );
    }
    return gridLines;
  };

  // Start drawing a wall
  const handleMouseDown = (e) => {
    if (tool !== "draw") return;

    const pos = e.target.getStage().getPointerPosition();
    const snappedX = Math.round(pos.x / GRID_SIZE) * GRID_SIZE;
    const snappedY = Math.round(pos.y / GRID_SIZE) * GRID_SIZE;

    setWalls([...walls, { points: [snappedX, snappedY, snappedX, snappedY] }]);
    setIsDrawing(true);
  };

  // Update the endpoint of the wall while dragging
  const handleMouseMove = (e) => {
    if (!isDrawing || tool !== "draw") return;

    const pos = e.target.getStage().getPointerPosition();
    const snappedX = Math.round(pos.x / GRID_SIZE) * GRID_SIZE;
    const snappedY = Math.round(pos.y / GRID_SIZE) * GRID_SIZE;

    const updatedWalls = [...walls];
    updatedWalls[updatedWalls.length - 1].points[2] = snappedX;
    updatedWalls[updatedWalls.length - 1].points[3] = snappedY;
    setWalls(updatedWalls);
  };

  // Finalize the wall
  const handleMouseUp = () => {
    if (isDrawing && tool === "draw") {
      setIsDrawing(false);
    }
  };

  // Select a wall for deletion or moving
  const handleWallClick = (index) => {
    if (tool === "delete") {
      const updatedWalls = walls.filter((_, i) => i !== index);
      setWalls(updatedWalls);
    }
  };

  // Clear the entire layout
  const handleClearLayout = () => {
    setWalls([]);
  };

  // Navigate to 3D view and pass walls state
  const handleDone = () => {
    navigate("/floorplan3d", { state: { layout: walls } }); // Passing walls as 'layout' to 3D view
  };

  return (
    <div>
      <h1>2D Floor Plan Builder</h1>
      <div style={{ marginBottom: "10px" }}>
        <button onClick={() => setTool("draw")}>Draw Walls</button>
        <button onClick={() => setTool("move")}>Move Walls</button>
        <button onClick={() => setTool("delete")}>Delete Walls</button>
        <button onClick={handleClearLayout}>Clear Layout</button>
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          style={{ marginLeft: "10px" }}
        >
          <option value="feet">Feet</option>
          <option value="meters">Meters</option>
        </select>
        <button
          style={{ position: "absolute", top: "10px", right: "10px" }}
          onClick={handleDone}
        >
          Done
        </button>
      </div>
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        ref={stageRef}
      >
        <Layer>
          {/* Grid */}
          {createGrid(window.innerWidth, window.innerHeight, GRID_SIZE)}

          {/* Draw walls */}
          {walls.map((wall, index) => (
            <Line
              key={index}
              points={wall.points}
              stroke="black"
              strokeWidth={3}
              draggable={tool === "move"}
              onClick={() => handleWallClick(index)}
            />
          ))}

          {/* Display wall dimensions */}
          {walls.map((wall, index) => {
            const x1 = wall.points[0];
            const y1 = wall.points[1];
            const x2 = wall.points[2];
            const y2 = wall.points[3];
            const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            const convertedDistance = (distance / GRID_SIZE) * conversionFactor;

            return (
              <Text
                key={`dimension-${index}`}
                x={(x1 + x2) / 2}
                y={(y1 + y2) / 2 - 20}
                text={`${convertedDistance.toFixed(1)} ${unit}`}
                fontSize={14}
                fill="blue"
              />
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default FloorPlan;
