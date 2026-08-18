/**
 * Project settings interface - minimal interface used by @evidence/core components.
 * Studio's full ProjectSettings type will satisfy this interface.
 */

import { z } from 'zod';

/**
 * Page settings schema - used for default page settings in project.
 * Uses passthrough to allow additional properties defined by Studio.
 */
export const pageSettingsSchema = z
	.object({
		chart_color_palette: z.string().nullable().optional(),
		chart_series_colors: z.record(z.string()).nullable().optional(),
		cards: z.boolean().optional(),
		page_width: z.enum(['article', 'full']).optional(),
		table_of_contents: z.boolean().optional()
	})
	.passthrough();

export type PageSettings = z.infer<typeof pageSettingsSchema>;

/**
 * Theme overrides schema.
 */
export const themeOverridesSchema = z
	.object({
		// Add specific theme properties as needed
	})
	.passthrough();

/**
 * Project settings schema - properties accessed by @evidence/core components.
 * Uses passthrough to allow additional properties defined by Studio.
 */
export const projectSettingsSchema = z
	.object({
		default_page_settings: pageSettingsSchema.optional(),
		theme: themeOverridesSchema.optional(),
		first_day_of_week: z.enum(['sunday', 'monday']).optional().default('sunday'),
		default_date_range_end: z
			.discriminatedUnion('type', [
				z.object({ type: z.literal('today') }),
				z.object({ type: z.literal('relative'), daysAgo: z.number().int().min(0) }),
				z.object({ type: z.literal('custom_sql'), sql: z.string() })
			])
			.optional(),
		// Computed property set by Studio
		computedDefaultDateRangeEnd: z.string().optional(),
		sidebar_position: z.number().nullable().optional(),
		icon: z.string().nullable().optional(),
		// GitHub settings (optional)
		github_enabled: z.boolean().optional(),
		github_repo_owner: z.string().optional(),
		github_repo_name: z.string().optional(),
		github_default_branch: z.string().optional()
	})
	.passthrough();

export type ProjectSettings = z.infer<typeof projectSettingsSchema>;

/**
 * Default project settings - minimal defaults used when projectSettings is not provided.
 * Consumers (Studio, CLI) should override with their own DEFAULT_PROJECT_SETTINGS if needed.
 */
export const DEFAULT_PROJECT_SETTINGS = {
	first_day_of_week: 'sunday' as const
} satisfies Partial<ProjectSettings>;

/**
 * Default page settings.
 */
export const DEFAULT_PAGE_SETTINGS: PageSettings = {};
