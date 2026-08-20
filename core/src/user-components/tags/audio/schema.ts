import type { UserComponentSchema } from '../../types';

export const schema = {
	render: 'audio',
	category: 'ui',
	keywords: ['sound', 'music', 'podcast', 'mp3', 'wav', 'media', 'player'],
	description: 'Embed an audio player for mp3, wav, and other audio formats',
	selfClosing: true,
	attributes: {
		url: {
			type: String,
			required: true,
			description: 'URL of the audio file (may include query parameters such as SAS tokens)',
			supportsVariables: true,
			variableContext: 'text'
		},
		type: {
			type: String,
			description:
				'MIME subtype of the audio file (e.g. mpeg, wav, ogg, mp4). Mapped to audio/[type] for the browser.',
			default: 'mpeg'
		},
		title: {
			type: String,
			description: 'Accessible label for the audio player',
			supportsVariables: true,
			variableContext: 'text'
		}
	},
	componentWrapper: {
		display: 'block',
		width: 'full',
		noCard: true,
		flex: {
			grow: 1,
			minWidth: 200
		}
	},
	examples: [
		{
			title: 'Basic Audio Player',
			hero: true,
			example: '{% audio url="https://files.example.com/podcast/episode-01.mp3" /%}'
		},
		{
			title: 'WAV File with Title',
			example:
				'{% audio url="https://files.example.com/recordings/call.wav" type="wav" title="Call Recording" /%}'
		}
	]
} satisfies UserComponentSchema;
