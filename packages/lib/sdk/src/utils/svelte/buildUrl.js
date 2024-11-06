import { config } from '$evidence/config';
/**
 * 
 * @param {string} path 
 * @returns 
 */
export const buildUrl = (path) => {
    if (path.startsWith('http')) return path;
    
    let basePath = config.deployment.basePath;
    if (basePath) {
        if (!basePath?.startsWith('/')) {
            basePath = `/${basePath}`;
        }
        if (basePath.endsWith('/')) {
            basePath = basePath.slice(0, -1);
        }
        return `${basePath}${path}`;
    } else {
        return path
    }
}