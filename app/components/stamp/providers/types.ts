// Art Provider 核心接口定义
export interface HashArtRenderParams {
  hash: string;
  leadingZeros: number;
  width: number;
  height: number;
  container: HTMLElement;
  theme?: "light" | "dark";
}

export interface HashArtProvider {
  id: string;
  name: string;
  description: string;

  // 核心渲染方法
  render(params: HashArtRenderParams): Promise<void>;

  // 清理资源
  cleanup?(): void;

  // 可选：获取预览图（用于选择器UI）
  getPreview?(params: Omit<HashArtRenderParams, "container">): Promise<string>;
}

// Provider 注册配置
export interface ArtProviderConfig {
  id: string;
  name: string;
  description: string;
  default?: boolean;
  enabled?: boolean;
}
