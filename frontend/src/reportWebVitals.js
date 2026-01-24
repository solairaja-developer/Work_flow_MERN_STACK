// This file can be safely removed or simplified since web-vitals is not essential
const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // Try to import web-vitals, but don't crash if it fails
    try {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(onPerfEntry);
        getFID(onPerfEntry);
        getFCP(onPerfEntry);
        getLCP(onPerfEntry);
        getTTFB(onPerfEntry);
      }).catch(() => {
        console.log('web-vitals not available, skipping performance metrics');
      });
    } catch (error) {
      console.log('Error loading web-vitals:', error);
    }
  }
};

export default reportWebVitals;