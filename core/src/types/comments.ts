/**
 * Comment types for the Commentary component.
 * This is a simplified interface - the full types are in studio's $lib/types/comments.
 */

export type CommentUser = {
	id: string;
	name: string;
	avatarUrl: string | null;
	createdAt: Date;
};

export type CommentHistory = {
	text: string | null;
	userId: string;
	createdAt: Date;
	user: CommentUser;
};

export type Comment = {
	id: string;
	text: string | null;
	projectId: string;
	pageId: string;
	pageSlug: string | null;
	componentId: string;
	userId: string;
	resolvedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
	history: CommentHistory[];
};

export type CommentResponse = {
	success: boolean;
	comment: Comment | null;
	error?: string;
};
