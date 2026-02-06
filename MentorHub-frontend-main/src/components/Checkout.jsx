import { RAZORPAY_KEY_ID } from "../const/env.const";

const loadScript = (src) => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

const handlePayment = async (orderId, handler) => {
  // Check if Razorpay key is configured
  // Try multiple ways to get the key
  const razorpayKey = RAZORPAY_KEY_ID || process.env.REACT_APP_RAZORPAY_KEY_ID;
  
  console.log("Razorpay Key Check:", {
    fromConst: RAZORPAY_KEY_ID,
    fromEnv: process.env.REACT_APP_RAZORPAY_KEY_ID,
    finalKey: razorpayKey,
  });

  if (!razorpayKey) {
    alert("Payment gateway is not configured. Please contact administrator.\n\nMake sure:\n1. .env file exists in the frontend folder\n2. REACT_APP_RAZORPAY_KEY_ID is set\n3. React server has been restarted after creating .env");
    console.error("RAZORPAY_KEY_ID is not set in environment variables");
    console.error("Current env vars:", Object.keys(process.env).filter(k => k.startsWith('REACT_APP')));
    return;
  }

  // Load Razorpay checkout script
  const scriptLoaded = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
  
  if (!scriptLoaded) {
    alert("Failed to load payment gateway. Please check your internet connection and try again.");
    return;
  }

  const paymentObject = new window.Razorpay({
    key: razorpayKey,
    order_id: orderId,
    handler: function (response) {
      console.log("Payment successful:", response);
      handler?.(response);
    },
    modal: {
      ondismiss: function() {
        console.log("Payment modal closed");
      }
    },
    prefill: {
      // You can prefill customer details here if available
    },
    theme: {
      color: "#6366f1", // Purple color matching your theme
    },
  });

  paymentObject.on("payment.failed", function (response) {
    console.error("Payment failed:", response.error);
    alert(`Payment failed: ${response.error.description || "Please try again"}`);
  });

  paymentObject.open();
};

export default handlePayment;
