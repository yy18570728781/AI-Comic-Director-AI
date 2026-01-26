import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { getModelList } from '@/api/model';

// 模型配置（需要持久化）
export interface ModelConfig {
    imageModel: string;
    videoModel: string;
}

// 默认模型配置
export const DEFAULT_MODEL_CONFIG: ModelConfig = {
    imageModel: 'wanx',
    videoModel: 'wan2.6-i2v-flash',
};

// 模型选项接口
export interface ModelOption {
    value: string;
    label: string;
    description: string;
    type: 'image' | 'video';
}

// 模型列表状态（纯内存，不持久化）
interface ModelListState {
    imageModels: ModelOption[];
    videoModels: ModelOption[];
    loading: boolean;
    error: string | null;
    loadModels: () => Promise<void>;
}

// 模型选择状态
export interface ModelState extends ModelConfig, ModelListState {
    setImageModel: (model: string) => void;
    setVideoModel: (model: string) => void;
    resetModelConfig: () => void;
}

export const useModelStore = create<ModelState>()(
    persist(
        (set, get) => ({
            ...DEFAULT_MODEL_CONFIG,
            imageModels: [],
            videoModels: [],
            loading: false,
            error: null,

            // 加载模型列表（纯内存存储，页面刷新后重新获取）
            loadModels: async () => {
                const { imageModels, videoModels } = get();
                // 如果内存中已有数据，不再重复加载
                if (imageModels.length > 0 && videoModels.length > 0) {
                    return;
                }

                set({ loading: true, error: null });
                try {
                    const res = await getModelList();
                    if (res.success && res.data) {
                        set({
                            imageModels: res.data.imageModels || [],
                            videoModels: res.data.videoModels || [],
                            loading: false,
                        });
                    } else {
                        set({ loading: false, error: '获取模型列表失败' });
                    }
                } catch (error: any) {
                    set({ loading: false, error: error.message || '获取模型列表失败' });
                }
            },

            setImageModel: (imageModel) =>
                set({ imageModel }),

            setVideoModel: (videoModel) =>
                set({ videoModel }),

            resetModelConfig: () =>
                set({ ...DEFAULT_MODEL_CONFIG }),
        }),
        {
            name: 'model-config-storage', // 只持久化这个配置对象
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                // 只持久化用户选择的模型，模型列表不持久化
                imageModel: state.imageModel,
                videoModel: state.videoModel,
            }),
        }
    )
);
