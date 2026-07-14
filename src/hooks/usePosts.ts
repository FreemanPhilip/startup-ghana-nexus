import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchPostsEnriched,
  fetchPostComments,
  insertPost,
  insertPostLike,
  deletePostLike,
  insertPostComment,
  type PostWithDetails,
  type Comment,
} from "@/lib/supabase/queries/posts";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

export type { PostWithDetails, Comment };

export function usePosts(category?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["posts", category, user?.id];

  const { data: posts = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchPostsEnriched(category, user?.id),
  });

  useRealtimeSubscription(
    { table: "posts" },
    () => queryClient.invalidateQueries({ queryKey: ["posts"] })
  );

  const createPost = useMutation({
    mutationFn: (input: {
      content: string;
      category?: string;
      image_url?: string | null;
      image_urls?: string[];
      video_url?: string | null;
      startup_id?: string | null;
    }) =>
      insertPost({
        author_id: user!.id,
        content: input.content,
        category: input.category,
        image_url: input.image_url,
        image_urls: input.image_urls,
        video_url: input.video_url,
        startup_id: input.startup_id,
      }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });

  const toggleLike = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (isLiked) {
        await deletePostLike(postId, user!.id);
      } else {
        await insertPostLike(postId, user!.id);
      }
      return { postId, isLiked };
    },
    onMutate: async ({ postId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<PostWithDetails[]>(queryKey);
      queryClient.setQueryData<PostWithDetails[]>(queryKey, old =>
        old?.map(p =>
          p.id === postId
            ? { ...p, is_liked: !isLiked, likes_count: p.likes_count + (isLiked ? -1 : 1) }
            : p
        ) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(queryKey, context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const addComment = useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      insertPostComment(postId, user!.id, content),
    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<PostWithDetails[]>(queryKey);
      queryClient.setQueryData<PostWithDetails[]>(queryKey, old =>
        old?.map(p => (p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p)) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(queryKey, context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    posts,
    loading: isLoading,
    createPost: createPost.mutate,
    toggleLike: toggleLike.mutate,
    fetchComments: fetchPostComments,
    addComment: addComment.mutate,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  };
}
