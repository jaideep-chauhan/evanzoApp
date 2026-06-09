import FastImage from 'react-native-fast-image';

/**
 * Performance Optimization Utilities
 * Reduces loading time for vendor/event ads
 */

/**
 * Prefetch images for visible items
 * Loads images before user scrolls to them
 */
export const prefetchImages = (items, count = 5) => {
  if (!items || items.length === 0) return;

  // Get first 5 items (or specified count)
  const itemsToPrefetch = items.slice(0, count);

  const imageUrls = [];

  itemsToPrefetch.forEach(item => {
    // Collect all image URLs
    if (item.images && Array.isArray(item.images)) {
      item.images.forEach(img => {
        if (typeof img === 'string' && img.startsWith('http')) {
          imageUrls.push({ uri: img, priority: FastImage.priority.high });
        } else if (img?.url) {
          imageUrls.push({ uri: img.url, priority: FastImage.priority.high });
        }
      });
    }

    // Add logo/avatar
    if (item.logo && item.logo.startsWith('http')) {
      imageUrls.push({ uri: item.logo, priority: FastImage.priority.high });
    }
    if (item.avatar && item.avatar.startsWith('http')) {
      imageUrls.push({ uri: item.avatar, priority: FastImage.priority.high });
    }
  });

  // Prefetch in background
  if (imageUrls.length > 0) {
    FastImage.preload(imageUrls);
    console.log(`[Performance] Prefetched ${imageUrls.length} images`);
  }
};

/**
 * Optimize vendor data for faster rendering
 * Removes unnecessary fields, compresses data
 */
export const optimizeVendorData = (vendors) => {
  if (!vendors) return [];

  return vendors.map(vendor => {
    // Keep only essential fields for list view
    return {
      id: vendor.id || vendor._original?.vendor_ad_id,
      name: vendor.name,
      category: vendor.category,
      location: vendor.location,
      rating: vendor.rating,
      // Only keep first 3 images for list view
      images: vendor.images?.slice(0, 3) || [],
      logo: vendor.logo,
      price: vendor.price,
      // Store full data for detail view
      _full: vendor,
    };
  });
};

/**
 * Debounce function for search/scroll
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Check if we should show cached data
 * Reduces perceived loading time
 */
export const shouldUseCachedData = (lastFetchTime, maxAge = 5 * 60 * 1000) => {
  if (!lastFetchTime) return false;
  return (Date.now() - lastFetchTime) < maxAge;
};

/**
 * Lazy load images as user scrolls
 * Only load images for visible items
 */
export const getVisibleIndices = (scrollY, itemHeight, windowHeight) => {
  const firstVisible = Math.floor(scrollY / itemHeight);
  const visibleCount = Math.ceil(windowHeight / itemHeight);
  return {
    start: Math.max(0, firstVisible - 2), // Load 2 before
    end: firstVisible + visibleCount + 2, // Load 2 after
  };
};

/**
 * Image loading strategies
 */
export const ImageLoadingStrategy = {
  // High priority for first screen
  IMMEDIATE: FastImage.priority.high,
  // Normal priority for second screen
  NORMAL: FastImage.priority.normal,
  // Low priority for far items
  LOW: FastImage.priority.low,
};

/**
 * Get image loading priority based on index
 */
export const getImagePriority = (index) => {
  if (index < 3) return ImageLoadingStrategy.IMMEDIATE;
  if (index < 10) return ImageLoadingStrategy.NORMAL;
  return ImageLoadingStrategy.LOW;
};

/**
 * Progressive loading configuration
 */
export const ProgressiveLoadingConfig = {
  // Show skeleton for first load
  showSkeletonOnInitial: true,
  // Show small spinner for pagination
  showSmallSpinnerOnMore: true,
  // Number of skeleton items to show
  skeletonCount: 3,
  // Fade in duration for loaded items
  fadeInDuration: 200,
};

/**
 * Measure render performance
 */
export const measurePerformance = (componentName, callback) => {
  const start = Date.now();
  const result = callback();
  const duration = Date.now() - start;

  if (duration > 16) { // Longer than 1 frame (60fps)
    console.warn(`[Performance] ${componentName} took ${duration}ms (>16ms)`);
  }

  return result;
};

/**
 * Throttle scroll events
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
