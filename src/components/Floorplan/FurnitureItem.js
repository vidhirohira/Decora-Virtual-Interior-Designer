import React from 'react';

export default function FurnitureItem(props) {
  return (
    <div className="card mx-2" style={{ width: "14rem", margin: "0 auto", height:"24rem" }}>
      <img 
        src={props.image_url} 
        className="card-img-top" 
        alt={props.name}
        style={{ height: "200px", objectFit: "contain", padding: "1rem" }}
      />
      <div className="card-body">
        <h5 className="card-title" style={{ fontSize: "1rem", minHeight: "2.5rem" }}>{props.name}</h5>
        <p className="card-text fw-bold">{props.mrp}</p>
        <a href={props.url} className="btn btn-primary w-100" target="_blank" rel="noopener noreferrer">
          Check Out
        </a>
      </div>
    </div>
  );
}