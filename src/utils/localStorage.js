// Safe localStorage utilities with JSON parsing
export const safeGetItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    
    // Handle null, undefined, or "undefined" string
    if (!item || item === 'null' || item === 'undefined') {
      return defaultValue;
    }
    
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error parsing localStorage item "${key}":`, error);
    
    // Clean up invalid data
    localStorage.removeItem(key);
    
    return defaultValue;
  }
};

export const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error setting localStorage item "${key}":`, error);
    return false;
  }
};

export const cleanupInvalidData = () => {
  const keysToCheck = ['channelData', 'videosData', 'user_info', 'prefillData'];
  
  keysToCheck.forEach(key => {
    const item = localStorage.getItem(key);
    if (item === 'undefined' || item === 'null') {
      console.log(`Cleaning up invalid localStorage key: ${key}`);
      localStorage.removeItem(key);
    }
  });
};

// Run cleanup on module load
cleanupInvalidData();