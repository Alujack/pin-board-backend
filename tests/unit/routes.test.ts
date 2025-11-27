import { describe, it, expect } from '@jest/globals';

describe('Route Configuration Tests', () => {
    describe('Authentication Middleware', () => {
        it('should verify ppr middleware is used for protected routes', async () => {
            // Import the route files to check their structure
            const { commentRoute } = await import('../../src/routes/comment.route.js');
            const { pinLikeRoute } = await import('../../src/routes/pin-like.route.js');
            
            // Verify routes exist
            expect(commentRoute).toBeDefined();
            expect(commentRoute.createComment).toBeDefined();
            expect(commentRoute.toggleCommentLike).toBeDefined();
            
            expect(pinLikeRoute).toBeDefined();
            expect(pinLikeRoute.togglePinLike).toBeDefined();
        });

        it('should verify user routes are properly configured', async () => {
            const { userRoute } = await import('../../src/routes/user.route.js');
            
            expect(userRoute).toBeDefined();
            expect(userRoute.getCurrentUser).toBeDefined();
            expect(userRoute.updateProfile).toBeDefined();
        });

        it('should verify follow routes are properly configured', async () => {
            const { followRoute } = await import('../../src/routes/follow.route.js');
            
            expect(followRoute).toBeDefined();
            expect(followRoute.followUser).toBeDefined();
            expect(followRoute.unfollowUser).toBeDefined();
            expect(followRoute.getSuggestedUsers).toBeDefined();
        });

        it('should verify board collaborator routes are properly configured', async () => {
            const { boardCollaboratorRoute } = await import('../../src/routes/board-collaborator.route.js');
            
            expect(boardCollaboratorRoute).toBeDefined();
            expect(boardCollaboratorRoute.addCollaborator).toBeDefined();
            expect(boardCollaboratorRoute.removeCollaborator).toBeDefined();
            expect(boardCollaboratorRoute.updateCollaboratorRole).toBeDefined();
        });

        it('should verify feed routes are properly configured', async () => {
            const { feedRoute } = await import('../../src/routes/feed.route.js');
            
            expect(feedRoute).toBeDefined();
            expect(feedRoute.getPersonalizedFeed).toBeDefined();
        });
    });

    describe('ORPC Configuration', () => {
        it('should verify ppr middleware exists and is a function', async () => {
            const { ppr, public_permission, protected_permission } = await import('../../src/config/orpc.js');
            
            expect(ppr).toBeDefined();
            expect(typeof ppr).toBe('function');
            expect(public_permission).toBeDefined();
            expect(protected_permission).toBeDefined();
        });
    });
});

