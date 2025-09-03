import React, { useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';

export const QRCode = ({ data, size = 128, options = {} }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && data) {
      // Clear previous QR code
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Generate QR code with default options
      const defaultOptions = {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        ...options
      };

      QRCodeLib.toCanvas(canvas, data, defaultOptions, (error) => {
        if (error) {
          console.error('Error generating QR code:', error);
        }
      });
    }
  }, [data, size, options]);

  return (
    <div className="inline-block bg-white p-2 rounded border">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="block"
      />
      <div className="text-center text-xs text-gray-500 mt-1">
        QR Code
      </div>
    </div>
  );
};
