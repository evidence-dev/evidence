export type options = {
    referer?: string;
    timeout?: number;
    waitUntil?: "load"|"domcontentloaded"|"networkidle"|"commit";
}

export function supportLocalDev(options? : options) : options|undefined {
    if(options === undefined){
        options = {}
    }
    options.waitUntil = (process.env.CI) ? "load" : "domcontentloaded"
    return options
}