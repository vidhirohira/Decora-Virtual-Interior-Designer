import React, { useState, useEffect } from "react";

const ModelGrid = ({ apiKey, query, onModelSelect }) => {
  const [models, setModels] = useState([]);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch(
          `https://api.sketchfab.com/v3/search?type=models&q=${query}&downloadable=true`,
          {
            headers: {
              Authorization: `Token ${apiKey}`,
            },
          }
        );
        const data = await response.json();
        setModels(data.results || []);
      } catch (error) {
        console.error("Error fetching models:", error);
      }
    };

    fetchModels();
  }, [apiKey, query]);

  const handleModelSelect = (model) => {
    onModelSelect(model.uid); // Pass the model UID to the parent component
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: "1rem",
          flexGrow: 1,
        }}
      >
        {models.map((model) => (
          <div
            key={model.uid}
            style={{
              cursor: "pointer",
              border: "1px solid #ddd",
              borderRadius: "8px",
              overflow: "hidden",
              textAlign: "center",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={() => handleModelSelect(model)}
          >
            <img
              src={model.thumbnails.images[0].url}
              alt={model.name}
              style={{ width: "100%", height: "150px", objectFit: "cover" }}
            />
            <div style={{ padding: "0.5rem", fontSize: "0.9rem" }}>
              {model.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelGrid;