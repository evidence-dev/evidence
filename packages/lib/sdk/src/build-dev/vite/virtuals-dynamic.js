import { getEvidenceConfig } from '../../configuration/getEvidenceConfig.js';
import { nanoid } from 'nanoid';

export const build = () => `
export const BUILD_ID = import.meta.env.MODE === "development" ? "DEV" : "${nanoid(8)}";
export const BUILD_DATE = new Date(${new Date().getTime()});
`;

export const config = () => {
	const cfg = getEvidenceConfig();
	return `export default ${JSON.stringify(cfg)}`;
};
