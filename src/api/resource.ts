import request from './request'

/**
 * 创建资源准备项目
 */
export function createProject(data: {
    name: string
    scriptContent: string
    userId?: number
}) {
    return request({
        url: '/api/resource/project/create',
        method: 'post',
        data,
    })
}

/**
 * 获取项目列表
 */
export function getProjectList(params: {
    userId?: number
    page?: number
    pageSize?: number
}) {
    return request({
        url: '/api/resource/project/list',
        method: 'get',
        params,
    })
}

/**
 * 获取项目详情
 */
export function getProjectDetail(id: number) {
    return request({
        url: `/api/resource/project/${id}`,
        method: 'get',
    })
}

/**
 * AI提取角色和场景
 */
export function extractCharactersAndScenes(id: number, data: { provider?: string }) {
    return request({
        url: `/api/resource/project/${id}/extract`,
        method: 'post',
        data,
    })
}

/**
 * 更新角色
 */
export function updateCharacter(id: number, data: any) {
    return request({
        url: `/api/resource/character/${id}`,
        method: 'put',
        data,
    })
}

/**
 * 更新场景
 */
export function updateScene(id: number, data: any) {
    return request({
        url: `/api/resource/scene/${id}`,
        method: 'put',
        data,
    })
}

/**
 * 生成角色图像
 */
export function generateCharacterImage(id: number, data: any) {
    return request({
        url: `/api/resource/character/${id}/image`,
        method: 'post',
        data,
    })
}

/**
 * 生成场景图像
 */
export function generateSceneImage(id: number, data: any) {
    return request({
        url: `/api/resource/scene/${id}/image`,
        method: 'post',
        data,
    })
}

/**
 * 生成单角色视频
 */
export function generateCharacterVideo(id: number, data: any) {
    return request({
        url: `/api/resource/character/${id}/video`,
        method: 'post',
        data,
    })
}

/**
 * 保存到资源库
 */
export function saveToLibrary(data: any) {
    return request({
        url: '/api/resource/library/save',
        method: 'post',
        data,
    })
}

/**
 * 获取资源库列表
 */
export function getLibraryList(params: {
    userId?: number
    type?: string
    page?: number
    pageSize?: number
    keyword?: string
}) {
    return request({
        url: '/api/resource/library/list',
        method: 'get',
        params,
    })
}

/**
 * 删除资源库项目
 */
export function deleteLibraryItem(id: number) {
    return request({
        url: `/api/resource/library/${id}`,
        method: 'delete',
    })
}
