import { MotherDuckDialect } from './motherduck';
import type { SqlDialect } from './common';

// The MotherDuck dialect minus its literal `name`, so this subclass can declare its own.
const DuckDbDialect = MotherDuckDialect as new () => Omit<MotherDuckDialect, 'name'>;

/**
 * Coupler.io dialect. POST /query runs DuckDB SQL, so this is the MotherDuck
 * (DuckDB) dialect under its own name — the name keys connector-specific
 * behaviour (describe probes, metadata loading).
 */
export class CouplerIoDialect extends DuckDbDialect implements SqlDialect {
	readonly name = 'coupler-io';
}
