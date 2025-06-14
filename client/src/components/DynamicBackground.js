import React, { useEffect, useRef } from 'react';

const BLOB_COUNT = 5;

function DynamicBackground() {
  const canvasRef = useRef(null);
  const blobsRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create blobs
    blobsRef.current = [];
    for (let i = 0; i < BLOB_COUNT; i++) {
      blobsRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 100 + 50,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        hue: Math.random() * 60 - 30 // Variation in green hue
      });
    }

    // Mouse movement
    function handleMouseMove(e) {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    }
    document.addEventListener('mousemove', handleMouseMove);

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Update and draw blobs
      blobsRef.current.forEach(blob => {
        // Move blob
        blob.x += blob.vx;
        blob.y += blob.vy;
        // Bounce off edges
        if (blob.x < -blob.radius) blob.x = canvas.width + blob.radius;
        if (blob.x > canvas.width + blob.radius) blob.x = -blob.radius;
        if (blob.y < -blob.radius) blob.y = canvas.height + blob.radius;
        if (blob.y > canvas.height + blob.radius) blob.y = -blob.radius;
        // Mouse interaction
        const dx = mouseRef.current.x - blob.x;
        const dy = mouseRef.current.y - blob.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 300) {
          const angle = Math.atan2(dy, dx);
          const force = (300 - distance) / 300;
          blob.vx -= Math.cos(angle) * force * 0.5;
          blob.vy -= Math.sin(angle) * force * 0.5;
        }
        // Draw blob
        const gradient = ctx.createRadialGradient(
          blob.x, blob.y, 0,
          blob.x, blob.y, blob.radius
        );
        const baseHue = 120; // Green base
        const hue = (baseHue + blob.hue + Math.sin(Date.now() * 0.001) * 10) % 360;
        gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, 0.15)`);
        gradient.addColorStop(0.5, `hsla(${hue}, 100%, 50%, 0.1)`);
        gradient.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);
        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
        ctx.fill();
        // Glow effect
        ctx.shadowColor = `hsla(${hue}, 100%, 50%, 0.3)`;
        ctx.shadowBlur = 20;
        ctx.strokeStyle = `hsla(${hue}, 100%, 50%, 0.1)`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });
      // Draw connections
      for (let i = 0; i < blobsRef.current.length; i++) {
        for (let j = i + 1; j < blobsRef.current.length; j++) {
          const dx = blobsRef.current[i].x - blobsRef.current[j].x;
          const dy = blobsRef.current[i].y - blobsRef.current[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 300) {
            const opacity = (1 - distance / 300) * 0.2;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 255, 157, ${opacity})`;
            ctx.lineWidth = 2;
            ctx.moveTo(blobsRef.current[i].x, blobsRef.current[i].y);
            ctx.lineTo(blobsRef.current[j].x, blobsRef.current[j].y);
            ctx.stroke();
          }
        }
      }
      // Draw mouse effect
      const gradient = ctx.createRadialGradient(
        mouseRef.current.x, mouseRef.current.y, 0,
        mouseRef.current.x, mouseRef.current.y, 150
      );
      gradient.addColorStop(0, 'rgba(0, 255, 157, 0.1)');
      gradient.addColorStop(1, 'rgba(0, 255, 157, 0)');
      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.arc(mouseRef.current.x, mouseRef.current.y, 150, 0, Math.PI * 2);
      ctx.fill();
      animationId = requestAnimationFrame(animate);
    }
    animate();
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
}

export default DynamicBackground; 