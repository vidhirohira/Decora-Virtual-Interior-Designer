import React, { useEffect, useRef, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import * as THREE from "three";
import { OrbitControls } from "three-stdlib";
import "./Floorplan3d.css";
import FurnitureGrid from "./FurnitureGrid.js";
import ModelGrid from "./ModelGrid.js";
import PaintGrid from './PaintGrid.js';
import ModelRenderer from './ModelItem';
import Cart from './Cart.js';
import { Search, User } from "lucide-react";
import LogoutButton from "../Login-in/LogoutButton.js";

const FloorPlan3D = () => {
  const { user_id, room_id } = useParams();
  const mountRef = useRef(null);
  const location = useLocation();
  const [sceneObjects, setSceneObjects] = useState(null);
  const [furnitureItems, setFurnitureItems] = useState([]);
  const [activeTab, setActiveTab] = useState("MODELS");
  const controlsRef = useRef(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [floorplanBounds, setFloorplanBounds] = useState({
    minX: -Infinity,
    maxX: Infinity,
    minZ: -Infinity,
    maxZ: Infinity,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPaint, setSelectedPaint] = useState(null);
  const [isPaintMode, setIsPaintMode] = useState(false);
  const wallMeshesRef = useRef([]);
  const [cartItems, handleCartItems] = useState([]);
  const [cartPrice, SetCartPrice] = useState(0);
  const[FurnitureSearch, SetFurnitureSearch] = useState(false)

  const [FurnitureLoading, SetFurnitureLoading] = useState(false)

  // Handle paint selection
  const handlePaintSelect = (paint) => {
    console.log("Selected Paint:", paint);
    setSelectedPaint(paint);
    setIsPaintMode(true);
    mountRef.current.classList.add('painting');
  };

  useEffect(() => {
    const fetchProducts = async () => {
      SetFurnitureLoading(true)
      try {
        const response = await fetch('http://localhost:5002/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setFurnitureItems(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally{
        SetFurnitureLoading(false)
      }
    };
  
    fetchProducts();
    console.log(furnitureItems)
  }, [FurnitureSearch]);
  // Function to capture a screenshot
  const captureScreenshot = (camera, renderer, scene) => {
    renderer.render(scene, camera); // Render the scene with the given camera
    return renderer.domElement.toDataURL('image/png'); // Capture the screenshot as a data URL
  };

  // Function to generate a collage from 4 screenshots
  const generateCollage = async (frontView, topView, leftView, rightView) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions (2x2 grid of screenshots)
    canvas.width = 800; // Adjust as needed
    canvas.height = 800; // Adjust as needed

    // Load each screenshot as an image
    const loadImage = (src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = reject;
      });
    };

    const [frontImg, topImg, leftImg, rightImg] = await Promise.all([
      loadImage(frontView),
      loadImage(topView),
      loadImage(leftView),
      loadImage(rightView),
    ]);

    // Draw each screenshot onto the canvas
    ctx.drawImage(frontImg, 0, 0, 400, 400); // Top-left
    ctx.drawImage(topImg, 400, 0, 400, 400); // Top-right
    ctx.drawImage(leftImg, 0, 400, 400, 400); // Bottom-left
    ctx.drawImage(rightImg, 400, 400, 400, 400); // Bottom-right

    // Convert canvas to a data URL
    return canvas.toDataURL('image/png');
  };

  // Function to handle the download button click
  const handleDownload = async () => {
    if (!sceneObjects) return;

    const { scene, camera, renderer } = sceneObjects;

    // Save the original camera position and rotation
    const originalPosition = camera.position.clone();
    const originalRotation = camera.rotation.clone();

    // Capture front view
    camera.position.set(-500, 800, 1000); // Adjust for front view
    camera.lookAt(0, 0, 0);
    const frontView = captureScreenshot(camera, renderer, scene);

    // Capture top view
    camera.position.set(0, 1000, 0); // Adjust for top view
    camera.lookAt(0, 0, 0);
    const topView = captureScreenshot(camera, renderer, scene);

    // Capture left view
    camera.position.set(-1000, 800, 0); // Adjust for left view
    camera.lookAt(0, 0, 0);
    const leftView = captureScreenshot(camera, renderer, scene);

    // Capture right view
    camera.position.set(1000, 800, 0); // Adjust for right view
    camera.lookAt(0, 0, 0);
    const rightView = captureScreenshot(camera, renderer, scene);

    // Restore the original camera position and rotation
    camera.position.copy(originalPosition);
    camera.rotation.copy(originalRotation);
    renderer.render(scene, camera); // Re-render the original view

    // Generate the collage
    const collageDataUrl = await generateCollage(frontView, topView, leftView, rightView);

    // Trigger download
    const link = document.createElement('a');
    link.href = collageDataUrl;
    link.download = 'floorplan_collage.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    mountRef.current.appendChild(renderer.domElement);

    // Initialize floor
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      roughness: 0.5,
      metalness: 0.1,
    });

    // Calculate floor dimensions
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

    // Create walls
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

      const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.2,
        metalness: 0.1,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide
      });

      const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
      wallMesh.position.set(centerWallX, wallHeight / 2, centerWallY);
      const angle = Math.atan2(y2 - y1, x2 - x1);
      wallMesh.rotation.y = -angle;

      scene.add(wallMesh);
      wallMeshes.push(wallMesh);
      wallMeshesRef.current.push(wallMesh);
    });

    // Handle wall painting
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleWallClick = (event) => {
      if (!isPaintMode || !selectedPaint) {
        console.log("Paint mode is not active or no paint is selected.");
        return;
      }
    
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(wallMeshesRef.current);
    
      if (intersects.length > 0) {
        const wallMesh = intersects[0].object;
        console.log("Wall clicked:", wallMesh);
        console.log("Selected paint color:", selectedPaint.color);
    
        // Dispose of the old material
        if (wallMesh.material) {
          console.log("Disposing old material:", wallMesh.material);
          wallMesh.material.dispose();
        }
    
        // Create a new material with the selected color
        const newMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(selectedPaint.color), // Ensure the color is valid
          roughness: 0.2,
          metalness: 0.1,
          side: THREE.DoubleSide,
        });
    
        // Apply the new material to the wall mesh
        wallMesh.material = newMaterial;
        wallMesh.material.needsUpdate = true; // Ensure the material is updated
        wallMesh.geometry.computeBoundingSphere(); // Recompute bounding sphere
    
        console.log("Wall material after update:", wallMesh.material);
    
        // Force a re-render of the scene
        renderer.render(scene, camera);
        console.log("Scene re-rendered with updated wall color.");
      } else {
        console.log("No wall was clicked.");
      }
    };

    renderer.domElement.addEventListener('click', handleWallClick);

    // Create floor
    const floorWidth = maxX - minX;
    const floorDepth = maxY - minY;
    const floorGeometry = new THREE.PlaneGeometry(floorWidth, floorDepth);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0);
    scene.add(floor);

    // Set floorplan bounds
    setFloorplanBounds({
      minX: -floorWidth / 2,
      maxX: floorWidth / 2,
      minZ: -floorDepth / 2,
      maxZ: floorDepth / 2,
    });

    // Setup lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(500, 1000, 500);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-500, 1000, -500);
    scene.add(directionalLight2);

    // Setup controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI;
    controls.minDistance = 500;
    controls.maxDistance = 3000;
    controls.target.set(0, wallHeight / 2, 0);
    controls.enabled = true; // Make sure it's enabled by default
    controls.enableRotate = true;
    controls.rotateSpeed = 0.5;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.panSpeed = 0.5;
    controlsRef.current = controls;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    setSceneObjects({ scene, camera, renderer, floor });

    // Handle window resize
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

    // Cleanup
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
      renderer.domElement.removeEventListener('click', handleWallClick);
    };
  }, [location, selectedPaint, isPaintMode]);

  return (
    <div className="decora-container">
      <nav className="nav">
        <div className="nav-content">
          <div className="nav-left">
          <h1 className="logo">
    <a href="/main-page" className="logo-link">Decora</a>
</h1>
            <div className="nav-links">
              {/* <a href="/">Design</a> */}
              <a href="/products">Products</a>
              <Link to={`/${user_id}/budget-estimator`}>Budget Estimator</Link>
            </div>
          </div>
          <div className="nav-right">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search"
                className="search-input"
              />
              <Search className="search-icon" />
            </div>
            <button className="profile-button">
              <User className="profile-icon" />
            </button>
            <LogoutButton />
          </div>
        </div>
      </nav>
      <div className="main-content">
        <div className="layout-container">
          <div ref={mountRef} className="threejs-container" />
          <button className="tool3d-button" onClick={handleDownload}>Download</button>
          {sceneObjects && (
            <ModelRenderer
            scene={sceneObjects.scene}
            camera={sceneObjects.camera}
            renderer={sceneObjects.renderer}
            selectedModel={selectedModel}
            walls={location.state?.layout || []}
            floorBounds={floorplanBounds}
            onError={setError}
            onLoadingChange={setIsLoading}
            orbitControls={controlsRef.current}
            />
          )}
          {isLoading && <div className="loading-indicator">Loading...</div>}
          {error && <div className="error-message">{error}</div>}
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
            {/* <button
              className={`header-button ${activeTab === "PAINT" ? "active" : ""}`}
              onClick={() => setActiveTab("PAINT")}
            >
              PAINT
            </button> */}
            <button
              className={`header-button ${activeTab === "CART" ? "active" : ""}`}
              onClick={() => setActiveTab("CART")}
            >
              CART
            </button>
          </div>

          <div className="furniture-grid">
            {activeTab === "FURNITURE" && <FurnitureGrid SetFurnitureLoading={SetFurnitureLoading} FurnitureLoading={FurnitureLoading} setFurnitureSearch={SetFurnitureSearch} products={furnitureItems} items={cartItems} handleCartItems={handleCartItems} cartPrice={cartPrice} handleCartPrice={SetCartPrice} />}
            {activeTab === "MODELS" && (
              <ModelGrid
                apiKey="9d2379512bd84812beb65f0ffe608310"
                onModelSelect={setSelectedModel}
              />
            )}
            {activeTab === 'PAINT' && <PaintGrid onPaintSelect={handlePaintSelect} />}
            {activeTab === "CART" && <Cart items={cartItems} handleCartItems={handleCartItems} cartPrice={cartPrice} handleCartPrice={SetCartPrice} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloorPlan3D;