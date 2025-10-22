import React from 'react';
import './Loading.css';

export default function Loading({ text = 'Loading' }) {
  return (
    <div className="loading-container" role="status" aria-live="polite">
      <div id="box" className="loading-box" aria-hidden>
        <div>L</div>
        <div>O</div>
        <div>A</div>
        <div>D</div>
        <div>I</div>
        <div>N</div>
        <div>G</div>
      </div>
    </div>
  );
}