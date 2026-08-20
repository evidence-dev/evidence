import { z } from 'zod';
import { setZodMetadata } from './zod-metadata';

/**
 * Shared schema for color_palette property used across chart components.
 * Provides consistent example and description for documentation generation.
 */
export const colorPaletteSchema = setZodMetadata(z.array(z.string()).optional(), {
	example: '["#3b82f6", "#8b5cf6", "#ec4899"]',
	description: 'Array of hex color codes to use for series colors'
});

/**
 * Shared schema for series_colors property used across chart components.
 * Provides consistent example and description for documentation generation.
 */
export const seriesColorsSchema = setZodMetadata(z.record(z.string(), z.string()).optional(), {
	example: `{
    "Series A" = "#3b82f6"
    "Series B" = "#10b981"
    "Series C" = "#f59e0b"
  }`,
	description: 'Map of series names to hex color codes for custom series coloring'
});
