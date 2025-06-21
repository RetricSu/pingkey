import { HashArtProvider, ArtProviderConfig } from './types';
import { P5GenerativeProvider } from './opts/p5-generative';

export class HashArtProviderRegistry {
  private providers = new Map<string, HashArtProvider>();
  private providerConfigs = new Map<string, ArtProviderConfig>();
  
  constructor() {
    this.init();
  }
  
  private init() {
    // 注册默认的 providers
    this.registerProvider(new P5GenerativeProvider(), {
      id: 'p5-generative',
      name: 'P5.js Generative Art',
      description: 'Complex layered generative art',
      default: true,
      enabled: true
    });
  }
  
  registerProvider(provider: HashArtProvider, config: ArtProviderConfig) {
    this.providers.set(provider.id, provider);
    this.providerConfigs.set(provider.id, config);
  }
  
  getProvider(id: string): HashArtProvider | undefined {
    return this.providers.get(id);
  }
  
  getProviderConfig(id: string): ArtProviderConfig | undefined {
    return this.providerConfigs.get(id);
  }
  
  getAllProviders(): Array<{ provider: HashArtProvider; config: ArtProviderConfig }> {
    return Array.from(this.providers.entries()).map(([id, provider]) => ({
      provider,
      config: this.providerConfigs.get(id)!
    }));
  }
  
  getEnabledProviders(): Array<{ provider: HashArtProvider; config: ArtProviderConfig }> {
    return this.getAllProviders().filter(({ config }) => config.enabled);
  }
  
  getDefaultProvider(): HashArtProvider | undefined {
    const defaultConfig = Array.from(this.providerConfigs.values()).find(config => config.default);
    return defaultConfig ? this.providers.get(defaultConfig.id) : undefined;
  }
  
  updateProviderConfig(id: string, updates: Partial<ArtProviderConfig>) {
    const config = this.providerConfigs.get(id);
    if (config) {
      this.providerConfigs.set(id, { ...config, ...updates });
    }
  }
}

// 单例实例
export const hashArtProviderRegistry = new HashArtProviderRegistry(); 
