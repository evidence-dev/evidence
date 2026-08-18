/**
 * Auth Proxy Token (APT) types for CLI and Studio
 * Shared between @evidence/core and @evidence/studio
 */

export interface APTIntrospectResponse {
	tokenHash: string;
	organizationId: string;
	userId: string;
	name: string;
	description?: string;
	author: string;
	tokenName: string;
	impersonate: boolean;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	expiration: string;
	role: string;
	language?: string | null;
	hostname?: string | null;
}

export interface APTCreateRequest {
	name?: string;
	description?: string;
	ttl?: number;
	language?: string;
	impersonate?: { email: string; userId: string } | null;
	is_machine_token?: boolean;
	hostname?: string;
}

export interface APTCreateResponse {
	token: string;
}

export interface APTDeleteRequest {
	tokenHash: string;
}
