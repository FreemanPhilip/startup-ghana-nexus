
-- Allow users to delete their own messages
CREATE POLICY "Users can delete own messages"
ON public.messages
FOR DELETE
USING (auth.uid() = sender_id);

-- Allow conversation participants to delete conversations
CREATE POLICY "Users can delete own conversations"
ON public.conversations
FOR DELETE
USING (auth.uid() = participant_one OR auth.uid() = participant_two);
