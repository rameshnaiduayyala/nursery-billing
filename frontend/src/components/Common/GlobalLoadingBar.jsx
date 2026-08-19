import React, { useState, useEffect } from 'react';
import { subscribeLoading } from '../../services/api';

export default function GlobalLoadingBar() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return subscribeLoading((isLoading) => {
      setLoading(isLoading);
    });
  }, []);

  if (!loading) return null;

  return <div className="global-loading-bar" title="Loading data…" />;
}
