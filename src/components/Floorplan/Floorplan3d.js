import React, { useEffect, useRef,useState } from "react";
import { useLocation } from "react-router-dom";
import * as THREE from "three";
import { OrbitControls } from 'three-stdlib';
import Sofa from '../Furniture/Sofa.js';
import { GLTFLoader } from "three-stdlib";

const ThreeDView = () => {
  const mountRef = useRef(null);
  const location = useLocation();
  const [sceneObjects, setSceneObjects] = useState(null);
  const [sofaModel, setSofaModel] = useState(null);
  const controlsRef = useRef(null);

  useEffect(() => {
    const walls = location.state?.layout || [];
    if (!walls.length) {
      console.warn("No walls data received");
      return;
    }

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      10000
    );
    camera.position.set(-500, 800, 1000);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Materials
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 1
    });

    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      roughness: 0.5,
      metalness: 0.1
    });

    // Find layout bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    walls.forEach(wall => {
      [wall.points[0], wall.points[2]].forEach(x => {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      });
      [wall.points[1], wall.points[3]].forEach(y => {
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

    walls.forEach(wall => {
      const [x1, y1, x2, y2] = wall.points;

      const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      const centerWallX = (x1 + x2) / 2 - centerX;
      const centerWallY = (y1 + y2) / 2 - centerY;

      const wallGeometry = new THREE.BoxGeometry(length, wallHeight, wallThickness);
      const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);

      wallMesh.position.set(centerWallX, wallHeight / 2, centerWallY);

      const angle = Math.atan2(y2 - y1, x2 - x1);
      wallMesh.rotation.y = -angle;

      scene.add(wallMesh);
      wallMeshes.push(wallMesh);
    });

    // Create floor
    const floorWidth = maxX - minX;
    const floorDepth = maxY - minY;
    const floorGeometry = new THREE.PlaneGeometry(floorWidth, floorDepth);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0);
    scene.add(floor);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(500, 1000, 500);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-500, 1000, -500);
    scene.add(directionalLight2);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI;
    controls.minDistance = 500;
    controls.maxDistance = 3000;
    controls.target.set(0, wallHeight / 2, 0);
    controlsRef.current = controls;

    // Wall facing camera check
    const getMostFacingWall = () => {
      let mostFacingWall = null;
      let minAngle = Infinity;

      wallMeshes.forEach(wallMesh => {
        const cameraDirection = new THREE.Vector3().subVectors(camera.position, wallMesh.position).normalize();
        const wallNormal = new THREE.Vector3(0, 0, 1);
        const rotationMatrix = new THREE.Matrix4().identity();
        rotationMatrix.makeRotationFromEuler(wallMesh.rotation);
        wallNormal.applyMatrix4(rotationMatrix);

        const angle = wallNormal.dot(cameraDirection);

        if (angle < minAngle) {
          minAngle = angle;
          mostFacingWall = wallMesh;
        }
      });

      return mostFacingWall;
    };

    const loader = new GLTFLoader();
    loader.load(
      'scene.gltf',
      (gltf) => {
        const sofa = gltf.scene;
        sofa.position.set(0, 0, 0);
        sofa.scale.set(2, 2, 2);
        
        // Make sure the sofa and all its children can be raycasted
        sofa.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        setSofaModel(sofa);
      },
      undefined,
      (error) => {
        console.error('Error loading GLTF model:', error);
      }
    );

    // Store references to scene objects
    setSceneObjects({
      scene,
      camera,
      renderer,
      floor
    });

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();

      const mostFacingWall = getMostFacingWall();

      wallMeshes.forEach(wallMesh => {
        if (wallMesh === mostFacingWall) {
          wallMesh.material.opacity = 0.5; // Make the wall semi-transparent
        } else {
          wallMesh.material.opacity = 1; // Make the wall opaque
        }
      });

      floor.material.opacity = 1; // Ensure the floor is always opaque

      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          object.material.dispose();
        }
      });
    };
  }, [location]);

  return (
    <div className="relative w-full h-screen bg-gray-100">
      <div ref={mountRef} className="w-full h-full flex items-center justify-center text-gray-400"/>
      {sceneObjects && sofaModel && controlsRef.current && (
        <Sofa
          scene={sceneObjects.scene}
          camera={sceneObjects.camera}
          renderer={sceneObjects.renderer}
          floor={sceneObjects.floor}
          sofaModel={sofaModel}
          controls={controlsRef.current}
        />
      )}
    </div>
  );
};

export default ThreeDView;