// 艺术 Provider 配置
// 这个文件用于管理不同的艺术生成器，你可以在这里：
// 1. 启用/禁用特定的 provider
// 2. 设置默认的 provider
// 3. 配置 provider 的参数

export interface ArtProviderUserConfig {
  // 用户偏好设置
  defaultProvider?: string;
  
  // Provider 特定配置
  providerSettings?: {
    [providerId: string]: {
      enabled?: boolean;
      settings?: Record<string, any>;
    };
  };
}

// 默认配置
export const defaultArtProviderConfig: ArtProviderUserConfig = {
  defaultProvider: 'p5-generative',
  providerSettings: {
    'p5-generative': {
      enabled: true,
      settings: {
        // 可以在这里添加 P5 特定的配置
        quality: 'high', // 'low', 'medium', 'high'
        animation: false, // 是否启用动画
      }
    },
    'canvas-minimal': {
      enabled: true,
      settings: {
        style: 'geometric', // 'geometric', 'organic', 'mixed'
        colorMode: 'auto', // 'auto', 'vibrant', 'muted'
      }
    }
  }
};

// 从本地存储加载配置
export function loadArtProviderConfig(): ArtProviderUserConfig {
  if (typeof window === 'undefined') {
    return defaultArtProviderConfig;
  }
  
  try {
    const stored = localStorage.getItem('art-provider-config');
    if (stored) {
      const config = JSON.parse(stored);
      return { ...defaultArtProviderConfig, ...config };
    }
  } catch (error) {
    console.warn('Failed to load art provider config:', error);
  }
  
  return defaultArtProviderConfig;
}

// 保存配置到本地存储
export function saveArtProviderConfig(config: ArtProviderUserConfig): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('art-provider-config', JSON.stringify(config));
  } catch (error) {
    console.warn('Failed to save art provider config:', error);
  }
}

// 应用配置到 registry
export function applyConfigToRegistry(config: ArtProviderUserConfig) {
  const { hashArtProviderRegistry } = require('../components/stamp/providers/registry');
  
  Object.entries(config.providerSettings || {}).forEach(([providerId, settings]) => {
    if (settings.enabled !== undefined) {
      hashArtProviderRegistry.updateProviderConfig(providerId, {
        enabled: settings.enabled
      });
    }
  });
  
  // 设置默认 provider
  if (config.defaultProvider) {
    // 先清除所有默认设置
    hashArtProviderRegistry.getAllProviders().forEach(({ provider }) => {
      hashArtProviderRegistry.updateProviderConfig(provider.id, {
        default: false
      });
    });
    
    // 设置新的默认值
    hashArtProviderRegistry.updateProviderConfig(config.defaultProvider, {
      default: true
    });
  }
} 
