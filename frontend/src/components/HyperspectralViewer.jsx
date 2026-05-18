import React, { useRef, useEffect, useState } from 'react';

const HyperspectralViewer = ({ imageUrl, onPointSelect, points = [] }) => {
  const canvasRef = useRef(null);

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));
    
    onPointSelect(x, y);
  };

  useEffect(() => {
    if (!imageUrl) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      points.forEach(p => {
        ctx.strokeStyle = p.color || '#ff4d4f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Draw crosshair or small circle for precision
        ctx.fillStyle = p.color || '#ff4d4f';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, 2 * Math.PI);
        ctx.fill();
      });
    };
  }, [imageUrl, points]);

  return (
    <div style={{ position: 'relative', overflow: 'auto', maxHeight: '500px', background: '#000', borderRadius: '8px' }}>
      <canvas 
        ref={canvasRef} 
        onClick={handleClick} 
        style={{ cursor: 'crosshair', display: 'block', margin: '0 auto' }}
      />
      {!imageUrl && <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No image loaded</div>}
    </div>
  );
};

export default HyperspectralViewer;
