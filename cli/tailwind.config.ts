// Typography plugin customizations require JavaScript config in Tailwind v4
// Basic theme variables can be done in app.css, but prose styling needs this approach
/** @type {import('tailwindcss').Config} */
module.exports = {
	theme: {
		extend: {
			typography: {
				DEFAULT: {
					css: {
						'max-width': 'none',
						'-webkit-font-smoothing': 'antialiased',
						color: 'var(--color-foreground)',
						'p, ul, ol': {
							'margin-block-end': '1.2em',
							'margin-block-start': '0em'
						},
						img: {
							margin: '0 auto',
							height: 'auto',
							'max-width': '100%',
							'border-radius': '0.5rem'
						},
						a: {
							'text-decoration': 'underline',
							transition: 'all 0.2s',
							'&:hover': {
								'text-decoration-thickness': '2px'
							}
						},
						ol: {
							'list-style-type': 'decimal',
							'padding-left': '1.5rem',
							'margin-bottom': '0',
							'&::marker': {
								color: 'var(--color-muted-foreground)'
							},
							li: {
								margin: '0',
								paddingInlineStart: '0',
								'& + li': {
									marginTop: '0.25rem'
								},
								'&::marker': {
									color: 'var(--color-muted-foreground)'
								}
							}
						},
						ul: {
							'list-style-type': 'disc',
							'padding-left': '1.5rem',
							li: {
								margin: '0',
								paddingInlineStart: '0',
								'& + li': {
									marginTop: '0.25rem'
								},
								'&::marker': {
									color: 'var(--color-muted-foreground)'
								}
							},
							ul: {
								'list-style-type': 'circle',
								'margin-top': '0.25rem',
								'margin-bottom': '0',
								ul: {
									'list-style-type': 'square'
								}
							},
							ol: {
								'list-style-type': 'lower-alpha',
								'margin-top': '0.25rem',
								'margin-bottom': '0',
								ol: {
									'list-style-type': 'lower-roman'
								}
							}
						},
						li: {
							margin: '0',
							paddingInlineStart: '0',
							'& + li': {
								marginTop: '0.25rem'
							}
						},
						':is(ul, ol) li + li': {
							marginTop: 'calc(var(--spacing) * 1)'
						},
						'h1, h2, h3, h4, h5, h6': {
							scrollMarginTop: '3.5rem',
							breakInside: 'avoid',
							fontFamily: "var(--theme-font-heading, var(--theme-font-body, 'Geist', sans-serif))",
							color: 'var(--color-foreground)'
						},
						h1: {
							marginTop: '1.25rem',
							marginBottom: '0.75rem',
							fontSize: "calc(var(--theme-font-scale, 1) * 1.5rem)",
							lineHeight: "calc(var(--theme-font-scale, 1) * 2rem)",
							fontWeight: '700',
							letterSpacing: '0.025em'
						},
						h2: {
							'margin-top': '0.75rem',
							'margin-bottom': '0.25rem',
							'font-size': "calc(var(--theme-font-scale, 1) * 1.25rem)",
							'line-height': "calc(var(--theme-font-scale, 1) * 1.75rem)",
							'font-weight': '600'
						},
						h3: {
							'margin-top': '0.5rem',
							'margin-bottom': '0.25rem',
							'font-size': "calc(var(--theme-font-scale, 1) * 1rem)",
							'line-height': "calc(var(--theme-font-scale, 1) * 1.5rem)",
							'font-weight': '600'
						},
						h4: {
							'margin-top': '0.25rem',
							'font-size': "calc(var(--theme-font-scale, 1) * 0.875rem)",
							'line-height': "calc(var(--theme-font-scale, 1) * 1.25rem)",
							'font-weight': '600'
						},
						h5: {
							'margin-top': '0.25rem',
							'font-size': "calc(var(--theme-font-scale, 1) * 0.75rem)",
							'line-height': "calc(var(--theme-font-scale, 1) * 1rem)",
							'font-weight': '600'
						},
						h6: {
							'margin-top': '0.25rem',
							'font-size': "calc(var(--theme-font-scale, 1) * 0.75rem)",
							'line-height': "calc(var(--theme-font-scale, 1) * 1rem)"
						},
						hr: {
							height: '1px',
							'margin-top': '2rem',
							'margin-bottom': '2rem',
							'max-width': '36rem',
							'margin-left': 'auto',
							'margin-right': 'auto',
							'background-color': 'var(--color-border)',
							border: '0'
						},
						code: {
							'font-size': '0.875em',
							'font-weight': 'normal',
							'background-color': 'var(--color-muted)',
							border: '1px solid var(--color-border)',
							'border-radius': '0.25rem',
							padding: '0.125rem 0.25rem',
							'user-select': 'all'
						},
						blockquote: {
							'background-color': 'var(--color-muted)',
							'border-left': '4px solid var(--color-border)',
							'padding-left': '0.75rem',
							'margin-top': '2rem',
							'margin-bottom': '2rem',
							'padding-top': '0.5rem',
							'padding-bottom': '0.5rem',
							'*': {
								color: 'var(--color-muted-foreground)'
							},
							p: {
								'&:first-of-type::before': { content: 'none' },
								'&:last-of-type::after': { content: 'none' },
								'&:first-child': {
									'margin-block-start': '0'
								},
								'&:last-child': {
									'margin-block-end': '0'
								}
							},
							blockquote: {
								'margin-top': '0',
								'margin-bottom': '0'
							}
						}
					}
				}
			}
		}
	}
};
