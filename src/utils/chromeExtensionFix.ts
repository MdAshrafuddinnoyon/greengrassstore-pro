// Suppress Chrome extension runtime errors
// This prevents "A listener indicated an asynchronous response by returning true" errors
declare const chrome: any;

if (typeof chrome !== 'undefined' && chrome?.runtime) {
  // Add a dummy listener to handle extension messages gracefully
  chrome.runtime.onMessage.addListener(() => {
    // Return false to indicate we handled the message synchronously
    return false;
  });
}

// Also suppress uncaught promise rejections from extension communication
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason?.message?.includes('message channel closed') ||
    event.reason?.message?.includes('asynchronous response')
  ) {
    // Suppress extension-related errors
    event.preventDefault();
  }
});
