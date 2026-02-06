const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:9900/v1";
// Try to get Razorpay key from environment, with fallback
let RAZORPAY_KEY_ID = process.env.REACT_APP_RAZORPAY_KEY_ID;

// Fallback: If not loaded from env, try to use a default test key (for development only)
if (!RAZORPAY_KEY_ID && process.env.NODE_ENV === 'development') {
 
  console.warn('⚠️ Using fallback Razorpay key. Please ensure REACT_APP_RAZORPAY_KEY_ID is set in .env file.');
}

// Debug: Log if Razorpay key is loaded (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('🔑 Razorpay Key ID Status:', {
    loaded: !!RAZORPAY_KEY_ID,
    key: RAZORPAY_KEY_ID ? `${RAZORPAY_KEY_ID.substring(0, 10)}...` : 'NOT SET',
    fromEnv: !!process.env.REACT_APP_RAZORPAY_KEY_ID,
  });
  if (!RAZORPAY_KEY_ID) {
    console.error('❌ REACT_APP_RAZORPAY_KEY_ID is not set. Please:');
    console.error('   1. Check .env file exists in MentorHub-frontend-main folder');
    console.error('   2. Verify it contains: REACT_APP_RAZORPAY_KEY_ID');
    console.error('   3. Restart the React development server (npm start)');
  }
}

export { BASE_URL, RAZORPAY_KEY_ID };
