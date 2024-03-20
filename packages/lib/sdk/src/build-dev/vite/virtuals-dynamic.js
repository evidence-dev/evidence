import { nanoid } from 'nanoid';
import { getEvidenceConfig } from '../../index.js';

export const build = () => `
export const BUILD_ID = import.meta.env.MODE === "development" ? "DEV" : "${nanoid(8)}";
export const BUILD_DATE = new Date(${new Date().getTime()});
`;

export const config = async () => {
	const cfg = await getEvidenceConfig();
	return `export default ${JSON.stringify(cfg)}`;
};
