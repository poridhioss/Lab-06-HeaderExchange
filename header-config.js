// Header binding configurations for different processors
module.exports = {
  // Content type handlers
  imageHandler: {
    queueName: 'cdn.image.requests',
    bindingArgs: {
      'content-type': 'image/jpeg',
      'x-match': 'all'  // Must match all specified headers
    }
  },
  
  videoHandler: {
    queueName: 'cdn.video.requests',
    bindingArgs: {
      'content-type': 'video/mp4',
      'x-match': 'all'
    }
  },

  // User tier handlers
  premiumProcessor: {
    queueName: 'cdn.premium.requests',
    bindingArgs: {
      'user-tier': 'premium',
      'x-match': 'all'
    }
  },

  freeProcessor: {
    queueName: 'cdn.free.requests',
    bindingArgs: {
      'user-tier': 'free',
      'x-match': 'all'
    }
  },

  // Device type handlers
  mobileProcessor: {
    queueName: 'cdn.mobile.requests',
    bindingArgs: {
      'device-type': 'mobile',
      'x-match': 'all'
    }
  },

  desktopProcessor: {
    queueName: 'cdn.desktop.requests',
    bindingArgs: {
      'device-type': 'desktop',
      'x-match': 'all'
    }
  },

  // Regional routers (using x-match: any for flexibility)
  usRegion: {
    queueName: 'cdn.us.requests',
    bindingArgs: {
      'region': 'us',
      'x-match': 'any'  // Matches if at least region header matches
    }
  },

  euRegion: {
    queueName: 'cdn.eu.requests',
    bindingArgs: {
      'region': 'eu',
      'x-match': 'any'
    }
  },

  asiaRegion: {
    queueName: 'cdn.asia.requests',
    bindingArgs: {
      'region': 'asia',
      'x-match': 'any'
    }
  },

  // Sample request templates
  requestTypes: {
    imageRequest: {
      headers: {
        'content-type': 'image/jpeg',
        'region': 'us',
        'user-tier': 'premium',
        'device-type': 'mobile',
        'api-version': 'v2'
      },
      content: {
        url: '/images/product-123.jpg',
        size: '2MB',
        format: 'jpeg'
      }
    },
    
    videoRequest: {
      headers: {
        'content-type': 'video/mp4',
        'region': 'eu',
        'user-tier': 'free',
        'device-type': 'desktop',
        'api-version': 'v1'
      },
      content: {
        url: '/videos/tutorial-456.mp4',
        duration: '5:30',
        quality: '1080p'
      }
    },

    apiRequest: {
      headers: {
        'content-type': 'application/json',
        'region': 'asia',
        'user-tier': 'premium',
        'device-type': 'mobile',
        'api-version': 'v2'
      },
      content: {
        endpoint: '/api/users',
        method: 'GET'
      }
    }
  }
};
