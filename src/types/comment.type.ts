import z from "zod";

// Create comment request
export const createCommentRequestSchema = z.object({
    content: z.string().min(1).max(500),
    parent_comment: z.string().optional(), // For replies
});

export type CreateCommentRequest = z.infer<typeof createCommentRequestSchema>;

// Update comment request
export const updateCommentRequestSchema = z.object({
    content: z.string().min(1).max(500),
});

export type UpdateCommentRequest = z.infer<typeof updateCommentRequestSchema>;

// Comment query
export const commentQuerySchema = z.object({
    page: z.string().default("1"),
    limit: z.string().default("20"),
    pin: z.string().optional(),
    parent_comment: z.string().optional(),
    sort: z.enum(["newest", "oldest", "popular"]).default("newest"),
});

export type CommentQuery = z.infer<typeof commentQuerySchema>;

// Comment response
export interface CommentResponse {
    _id: string;
    pin: string;
    user: {
        _id: string;
        username: string;
        profile_picture?: string;
    };
    content: string;
    parent_comment?: string;
    likes: string[];
    likesCount: number;
    repliesCount: number;
    isLiked?: boolean;
    is_deleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Comment list response
export interface CommentListResponse {
    success: boolean;
    message: string;
    data: CommentResponse[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

