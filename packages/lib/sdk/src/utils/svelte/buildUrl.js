import { config } from '$evidence/config';
/**
 * Adjusts a path to include the configured base path
 * Ignores undefined, and absolute URLs
 * @param {string} path 
 * @example buildUrl('http://localhost:3000/test') // 'http://localhost:3000/test'
 * @example buildUrl('/test') // '/base/test'
 * @example buildUrl(undefined) // undefined
 * 
 * @returns 
 */
export const buildUrl = (path) => {
    if (path === undefined) return path;
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