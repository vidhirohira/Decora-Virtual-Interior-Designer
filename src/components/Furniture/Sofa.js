import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const DraggableSofa = ({ scene, camera, renderer, floor, sofaModel, controls }) => {
  const isDraggingRef = useRef(false);
  const isRotatingRef = useRef(false);
  const mouseRef = useRef(new THREE.Vector2());
  const intersectionPointRef = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!sofaModel) return;

    scene.add(sofaModel);
    
    // Create raycaster inside useEffect
    const raycaster = new THREE.Raycaster();

    const onMouseDown = (event) => {
      event.preventDefault();

      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseRef.current, camera);
      
      // First check if we're clicking on the sofa
      const sofaIntersects = raycaster.intersectObject(sofaModel, true);
      const isSofaClicked = sofaIntersects.length > 0;

      if (isSofaClicked) {
        // Disable orbit controls when interacting with sofa
        controls.enabled = false;
        
        // Now check floor intersection for position
        const floorIntersects = raycaster.intersectObject(floor);
        if (floorIntersects.length > 0) {
          if (event.button === 0) { // Left click
            isDraggingRef.current = true;
            intersectionPointRef.current.copy(floorIntersects[0].point);
          } else if (event.button === 2) { // Right click
            isRotatingRef.current = true;
          }
        }
      }
    };

    const onMouseMove = (event) => {
      if (!isDraggingRef.current && !isRotatingRef.current) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseRef.current, camera);
      const intersects = raycaster.intersectObject(floor);

      if (intersects.length > 0) {
        if (isDraggingRef.current) {
          sofaModel.position.x = intersects[0].point.x;
          sofaModel.position.z = intersects[0].point.z;
        } else if (isRotatingRef.current) {
          const deltaX = event.movementX;
          sofaModel.rotation.y += deltaX * 0.02;
        }
      }
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      isRotatingRef.current = false;
      // Re-enable orbit controls when done interacting with sofa
      controls.enabled = true;
    };

    // Add event listeners
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

    // Cleanup
    return () => {
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('contextmenu', (e) => e.preventDefault());
      scene.remove(sofaModel);
    };
  }, [scene, camera, renderer, floor, sofaModel, controls]);

  return null;
};

export default DraggableSofa;