export function initDB(): Promise<void>;
export function query(query: string): import("apache-arrow").Table | null;
export function setParquetURL(url: string): void;
export function arrowTableToJSON(table: import("apache-arrow").Table): any[];