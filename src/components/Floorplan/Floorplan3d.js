import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import * as THREE from "three";
import { OrbitControls, DragControls } from "three-stdlib";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import "./Floorplan3d.css";
import FurnitureGrid from "./FurnitureGrid.js";
import ModelGrid from "./ModelGrid.js";

const FloorPlan3D = () => {
  const mountRef = useRef(null);
  const location = useLocation();
  const [sceneObjects, setSceneObjects] = useState(null);
  const [furnitureItems, setFurnitureItems] = useState([]);
  const [activeTab, setActiveTab] = useState("MODELS");
  const controlsRef = useRef(null); // For floorplan controls
  const [selectedModel, setSelectedModel] = useState(null);
  const currentModelRef = useRef(null);
  const dragControlsRef = useRef(null); // For furniture dragging
  const furnitureControlsRef = useRef(null); // For furniture rotation
  const [floorplanBounds, setFloorplanBounds] = useState({
    minX: -Infinity,
    maxX: Infinity,
    minZ: -Infinity,
    maxZ: Infinity,
  });

  // Load and render the selected model
  useEffect(() => {
    if (selectedModel && sceneObjects) {
      const fetchModelDetails = async () => {
        try {
          // Fetch model download information
          const downloadResponse = await fetch(
            `https://api.sketchfab.com/v3/models/${selectedModel}/download`,
            {
              headers: {
                Authorization: "Token 9d2379512bd84812beb65f0ffe608310", // Replace with your API key
              },
            }
          );
          const downloadData = await downloadResponse.json();
          const glbUrl = downloadData.glb.url; // Get the GLB URL

          if (glbUrl) {
            loadModel(glbUrl); // Load the model using the GLB URL
          } else {
            console.error("GLB URL not found in model download information");
          }
        } catch (error) {
          console.error("Error fetching model download information:", error);
        }
      };

      fetchModelDetails();
    }
  }, [selectedModel, sceneObjects]);

  const loadModel = (url) => {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;

        // Remove previous model if it exists
        if (currentModelRef.current) {
          sceneObjects.scene.remove(currentModelRef.current);
        }

        // Calculate bounding box
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());

        // Scale model to reasonable size
        const scale = 100 / size.y;
        model.scale.set(scale, scale, scale);

        // Position model at center of floor
        model.position.set(0, 0, 0);

        // Add model to scene
        sceneObjects.scene.add(model);
        currentModelRef.current = model;

        // Make model draggable
        if (dragControlsRef.current) {
          dragControlsRef.current.dispose(); // Clean up previous drag controls
        }
        dragControlsRef.current = new DragControls(
          [model],
          sceneObjects.camera,
          sceneObjects.renderer.domElement
        );

        // Disable floorplan controls while dragging
        dragControlsRef.current.addEventListener("dragstart", () => {
          if (controlsRef.current) {
            controlsRef.current.enabled = false;
          }
        });

        dragControlsRef.current.addEventListener("dragend", () => {
          if (controlsRef.current) {
            controlsRef.current.enabled = true;
          }
        });

        // Enable rotation on right-click
        if (furnitureControlsRef.current) {
          furnitureControlsRef.current.dispose(); // Clean up previous furniture controls
        }
        furnitureControlsRef.current = new OrbitControls(
          model,
          sceneObjects.renderer.domElement
        );
        furnitureControlsRef.current.enabled = false; // Disable by default

        // Enable rotation on right-click
        sceneObjects.renderer.domElement.addEventListener("mousedown", (event) => {
          if (event.button === 2) {
            // Right-click
            furnitureControlsRef.current.enabled = true;
            const deltaX = event.movementX;
            model.rotation.y += deltaX * 0.02;
          }
        });

        sceneObjects.renderer.domElement.addEventListener("mouseup", () => {
          furnitureControlsRef.current.enabled = false;
        });
      },
      undefined,
      (error) => console.error("Error loading model:", error)
    );
  };

  // Initialize Three.js scene
  useEffect(() => {
    const walls = location.state?.layout || [];
    if (!walls.length) {
      console.warn("No walls data received");
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);

    const camera = new THREE.PerspectiveCamera(
      45,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      1,
      10000
    );
    camera.position.set(-500, 800, 1000);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 1,
    });

    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      roughness: 0.5,
      metalness: 0.1,
    });

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    walls.forEach((wall) => {
      [wall.points[0], wall.points[2]].forEach((x) => {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      });
      [wall.points[1], wall.points[3]].forEach((y) => {
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      });
    });

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const wallHeight = 250;
    const wallThickness = 10;
    const wallMeshes = [];

    walls.forEach((wall) => {
      const [x1, y1, x2, y2] = wall.points;
      const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      const centerWallX = (x1 + x2) / 2 - centerX;
      const centerWallY = (y1 + y2) / 2 - centerY;

      const wallGeometry = new THREE.BoxGeometry(
        length,
        wallHeight,
        wallThickness
      );
      const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);

      wallMesh.position.set(centerWallX, wallHeight / 2, centerWallY);
      const angle = Math.atan2(y2 - y1, x2 - x1);
      wallMesh.rotation.y = -angle;

      scene.add(wallMesh);
      wallMeshes.push(wallMesh);
    });

    const floorWidth = maxX - minX;
    const floorDepth = maxY - minY;
    const floorGeometry = new THREE.PlaneGeometry(floorWidth, floorDepth);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0);
    scene.add(floor);

    // Set floorplan bounds for model movement
    setFloorplanBounds({
      minX: -floorWidth / 2,
      maxX: floorWidth / 2,
      minZ: -floorDepth / 2,
      maxZ: floorDepth / 2,
    });

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(500, 1000, 500);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-500, 1000, -500);
    scene.add(directionalLight2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI;
    controls.minDistance = 500;
    controls.maxDistance = 3000;
    controls.target.set(0, wallHeight / 2, 0);
    controlsRef.current = controls;

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      if (furnitureControlsRef.current) {
        furnitureControlsRef.current.update();
      }
      renderer.render(scene, camera);
    };
    animate();

    setSceneObjects({ scene, camera, renderer, floor });

    const handleResize = () => {
      camera.aspect =
        mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        mountRef.current.clientWidth,
        mountRef.current.clientHeight
      );
    };
    window.addEventListener("resize", handleResize);
    

    return () => {
      window.removeEventListener("resize", handleResize);
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          object.material.dispose();
        }
      });
    };
  }, [location]);

  return (
    <div className="decora-container">
      <div className="main-content">
        <div className="layout-container">
          <div ref={mountRef} className="threejs-container" />
        </div>

        <div className="furniture-section">
          <div className="furniture-header">
            <button
              className={`header-button ${activeTab === "MODELS" ? "active" : ""}`}
              onClick={() => setActiveTab("MODELS")}
            >
              MODELS
            </button>
            <button
              className={`header-button ${activeTab === "FURNITURE" ? "active" : ""}`}
              onClick={() => setActiveTab("FURNITURE")}
            >
              FURNITURE
            </button>
            <button
              className={`header-button ${activeTab === "PAINT" ? "active" : ""}`}
              onClick={() => setActiveTab("PAINT")}
            >
              PAINT
            </button>
          </div>

          <div className="furniture-grid">
            {activeTab === "FURNITURE" && <FurnitureGrid products={furnitureItems} />}
            {activeTab === "MODELS" && (
              <ModelGrid
                apiKey="9d2379512bd84812beb65f0ffe608310"
                query="cupboard"
                onModelSelect={setSelectedModel}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloorPlan3D;