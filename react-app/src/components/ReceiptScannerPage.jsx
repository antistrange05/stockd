// src/components/ReceiptScannerPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { scanReceipt } from '../services/GeminiService';
import './ReceiptScannerPage.css'; 

const ReceiptScannerPage = ({ onItemsScanned, setAppView }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); // NEW: State for image preview
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // NEW: Generate preview URL whenever a file is selected
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    
    // Create a temporary URL for the file
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Clean up memory when file changes or component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    setDragActive(false);
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError("Please drop a valid image file.");
    }
  }, []);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleScan = async () => {
    if (!file) {
      setError("Please select or drop a receipt image first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const scannedItems = await scanReceipt(file);
      
      if (!Array.isArray(scannedItems)) {
        throw new Error("AI returned invalid data format.");
      }

      onItemsScanned(scannedItems); 
      
    } catch (err) {
      console.error(err);
      setError(err.message || "Error scanning receipt. Please try a clearer image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <h1>Scan a Receipt 🧾</h1>
      <div className="form-container scanner-container">
        
        {/* Drag and Drop Area */}
        <div 
          className="drop-zone"
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('fileInput').click()}
          style={{ 
            borderColor: dragActive ? '#7ba28a' : (file ? '#7ba28a' : '#ccc'),
            backgroundColor: dragActive ? '#f7fffb' : '#ffffff',
            cursor: loading ? 'wait' : 'pointer'
          }}
        >
          {loading ? (
            <div className="loading-state">
              <p>🔍 Analyzing receipt with Gemini...</p>
            </div>
          ) : file ? (
            <div className="preview-state">
              {/* NEW: Display the image preview */}
              <img src={previewUrl} alt="Receipt Preview" className="receipt-preview-img" />
              <p>✅ <strong>Ready to Scan:</strong> {file.name}</p>
              <p className="change-text">(Click to change image)</p>
            </div>
          ) : (
            <div className="empty-state">
              <p className="icon">📂</p>
              <p>Drag and drop receipt image here</p>
              <p className="sub-text">or click to browse files</p>
            </div>
          )}
          
          <input 
            type="file" 
            id="fileInput" 
            accept="image/*" 
            onChange={handleFileChange} 
            style={{ display: 'none' }}
            disabled={loading}
          />
        </div>
        
        {error && <p className="error-message" style={{color: '#d32f2f', fontWeight: 'bold'}}>{error}</p>}
        
        <div className="form-buttons">
            <button onClick={handleScan} disabled={!file || loading} className="scan-button">
                {loading ? 'Processing...' : 'Scan & Add Items'}
            </button>
            <button onClick={() => setAppView('main')} disabled={loading} className="cancel-button">
                Cancel
            </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptScannerPage;