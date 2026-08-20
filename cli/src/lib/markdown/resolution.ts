/**
 * Gate for the new "from here / from root" reference model in the CLI dev server.
 *
 * Unlike Studio (which gates per-project on whether the branch uses the new
 * project-root structure), the CLI decides based on the running CLI's own
 * version: a new-enough CLI renders with the new resolution model; older CLIs
 * (which predate this code) keep the legacy pages-scoped behavior.
 */

import { VERSION } from '$cli/args';
import { compareVersions } from '$cli/version-check';

/**
 * First CLI version that ships project-root reference resolution. Bump together
 * with the release that introduces the new directory structure support.
 */
export const RELATIVE_RESOLUTION_MIN_CLI_VERSION = '0.4.6';

/** Whether this CLI build resolves references with the new "from here / from root" model. */
export function cliUsesRelativeResolution(): boolean {
	return compareVersions(VERSION, RELATIVE_RESOLUTION_MIN_CLI_VERSION) >= 0;
}
