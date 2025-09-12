import React from 'react';
import { useAppState } from '../../../contexts/AppStateContext';
import { useConcurrency } from '../../../hooks/useConcurrency';

const SliderControl = () => {
  const { state } = useAppState();
  const { updateConcurrency } = useConcurrency();

  const handleInputChange = (e) => {
    let value = parseInt(e.target.value);
    if (isNaN(value) || value < 1) value = 1;
    if (value > 100) value = 100;
    e.target.value = value;
    updateConcurrency(value);
  };

  const handleSliderChange = (e) => {
    updateConcurrency(parseInt(e.target.value));
  };

  return (
    <div className="concurrency-controls">
      <div className="concurrency-input-section">
        <input
          type="number"
          className="form-control concurrency-input"
          value={state.concurrency}
          min="1"
          max="100"
          onChange={handleInputChange}
          disabled={state.isTesting}
        />
      </div>
      <div className="slider-section">
        <div className="slider-container">
          <input
            type="range"
            className="slider"
            min="1"
            max="50"
            value={Math.min(state.concurrency, 50)}
            onChange={handleSliderChange}
            disabled={state.isTesting}
          />
          <span className="slider-value">{state.concurrency}</span>
        </div>
      </div>
    </div>
  );
};

export default SliderControl;
