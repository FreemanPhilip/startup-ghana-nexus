import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  blockUser as blockUserQuery,
  unblockUser as unblockUserQuery,
  isUserBlocked as isUserBlockedQuery,
} from "@/lib/supabase/queries/messages";

export function useBlockedUsers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const blockUser = useMutation({
    mutationFn: (blockedUserId: string) => blockUserQuery(user!.id, blockedUserId),
  });

  const unblockUser = useMutation({
    mutationFn: (blockedUserId: string) => unblockUserQuery(user!.id, blockedUserId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["blockedUsers"] }),
  });

  const checkIfBlocked = async (otherUserId: string): Promise<boolean> => {
    if (!user) return false;
    return isUserBlockedQuery(user.id, otherUserId);
  };

  return {
    blockUser: blockUser.mutateAsync,
    unblockUser: unblockUser.mutateAsync,
    isUserBlocked: checkIfBlocked,
  };
}
