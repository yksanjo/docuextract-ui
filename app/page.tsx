'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface HealthStatus {
  status: string;
  providers: Record<string, { enabled: boolean; healthy: boolean; pricePerPage: number }>;
}

interface UsageStats {
  pages: number;
  requests: number;
  currentDiscount: number;
  nextTierThreshold: number | null;
}

export default function Dashboard() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/health');
      setHealth(res.data);
    } catch (err) {
      console.error('Failed to fetch health:', err);
    }
  };

  const fetchUsage = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/usage/default');
      setUsage(res.data);
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    }
  };

  const handleExtract = async () => {
    if (!file) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append('document', file);
    
    try {
      const res = await axios.post('http://localhost:3000/api/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
      fetchUsage();
    } catch (err: any) {
      alert('Extraction failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>DocuExtract Dashboard</h1>
      
      {/* Provider Health */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>Provider Status</h2>
        {health && (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {Object.entries(health.providers).map(([name, status]) => (
              <div key={name} style={{ 
                border: '1px solid #ddd', 
                padding: '1rem', 
                borderRadius: '8px',
                background: status.healthy ? '#f0fff4' : '#fff5f5'
              }}>
                <h3>{name}</h3>
                <p>Status: {status.healthy ? '✓ Healthy' : '✗ Unhealthy'}</p>
                <p>Price: ${status.pricePerPage}/page</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Upload Section */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>Extract Document</h2>
        <input 
          type="file" 
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          accept=".pdf,.jpg,.png,.jpeg"
        />
        <button 
          onClick={handleExtract}
          disabled={!file || loading}
          style={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}
        >
          {loading ? 'Extracting...' : 'Extract'}
        </button>
      </section>

      {/* Result */}
      {result && (
        <section style={{ marginBottom: '2rem' }}>
          <h2>Extraction Result</h2>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '1rem', 
            borderRadius: '8px',
            overflow: 'auto',
            maxHeight: '300px'
          }}>
            {JSON.stringify(result.extraction, null, 2)}
          </pre>
          <p><strong>Provider:</strong> {result.routing.provider}</p>
          <p><strong>Cost:</strong> ${result.cost.finalCost.toFixed(4)}</p>
        </section>
      )}
    </div>
  );
}
