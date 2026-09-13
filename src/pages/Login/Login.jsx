import React, { useState, useEffect } from 'react';
import { FiDelete } from 'react-icons/fi'; // The backspace icon
import './Login.css';

export default function Login({ onLoginSuccess }) {
  const [pin, setPin] = useState('');
  const [isError, setIsError] = useState(false);

  const handlePress = (num) => {
    if (pin.length < 4) {
      setPin((prev) => prev + num);
      setIsError(false);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setIsError(false);
  };

  // Listen for physical keyboard input
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ignore typing if the error shake animation is currently playing
      if (isError) return;

      // Map number keys to the handlePress function
      if (event.key >= '0' && event.key <= '9') {
        handlePress(event.key);
      } 
      // Map the physical backspace key to the handleBackspace function
      else if (event.key === 'Backspace') {
        handleBackspace();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup the event listener when the component unmounts or state updates
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pin, isError]); // Re-bind listener when pin or error state changes

  useEffect(() => {
    if (pin.length === 4) {
      // Force it to be a string to guarantee an exact match
      const correctPin = String(import.meta.env.VITE_LOGIN_PIN).trim();
      
      if (pin === correctPin) {
        onLoginSuccess();
      } else {
        setIsError(true);
        setTimeout(() => {
          setPin('');
          setIsError(false);
        }, 500); // Briefly show error state before clearing
      }
    }
  }, [pin, onLoginSuccess]);

  return (
    <div className="login-screen">
      <div className="login-header">
        <div className="login-logo">JN</div>
        <h1 className="login-title">JNTIMS</h1>
        <p className="login-subtitle">Enter your 4-digit PIN to continue</p>
      </div>

      <div className={`pin-indicators ${isError ? 'shake' : ''}`}>
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`pin-dot ${index < pin.length ? 'filled' : ''} ${isError ? 'error' : ''}`}
          ></div>
        ))}
      </div>

      <div className="numpad-grid">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button key={num} className="numpad-btn" onClick={() => handlePress(num.toString())}>
            {num}
          </button>
        ))}
        <div className="numpad-btn empty"></div>
        <button className="numpad-btn" onClick={() => handlePress('0')}>
          0
        </button>
        <button className="numpad-btn backspace" onClick={handleBackspace}>
          <FiDelete size={22} />
        </button>
      </div>
    </div>
  );
}