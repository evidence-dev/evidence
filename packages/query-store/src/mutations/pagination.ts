import type {Query} from "@uwdata/mosaic-sql";

export const limit = (q: Query, l: number) => q.limit(l)

export const offset = (q: Query, o: number) => q.offset(o)