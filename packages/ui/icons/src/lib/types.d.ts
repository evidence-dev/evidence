type AllowedTags = 'path' | 'circle' | 'rect' | 'polygon' | 'polyline' | 'line'
type IconThemeSource = {
	a: { [attribute: string]: string }
} & {
	[tag in AllowedTags]?: { [attribute: string]: string }[]
}
export type IconSource = { default: IconThemeSource } & { [theme: string]: IconThemeSource }

