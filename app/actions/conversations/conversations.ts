'use server';

import { createClient } from '@/lib/supabase/server';
import { Database } from '@/database.types';
import { revalidatePath } from 'next/cache';
import grokEndPoint from '../../api/grok';

// Type aliases for convenience
type Conversation = Database['public']['Tables']['ai_conversations']['Row'];
type ConversationInsert =
  Database['public']['Tables']['ai_conversations']['Insert'];
type ConversationUpdate =
  Database['public']['Tables']['ai_conversations']['Update'];

export async function createConversation(
  title?: string
): Promise<Conversation> {
  const supabase = await createClient();
  const { data: authUser } = await supabase.auth.getUser();

  if (!authUser || !authUser.user) {
    throw new Error('Unauthorized');
  }

  const insertData: ConversationInsert = {
    teacher_id: authUser.user.id,
    title: title || 'New Conversation',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('ai_conversations')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create conversation: ${error.message}`);
  }

  revalidatePath('/dashboard');
  return data;
}

export async function getUserConversations(): Promise<Conversation[]> {
  const supabase = await createClient();
  const { data: authUser } = await supabase.auth.getUser();

  if (!authUser || !authUser.user) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('teacher_id', authUser.user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get conversations: ${error.message}`);
  }

  return data;
}

export async function generateAndUpdateConversationTitle(
  conversationId: string,
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    // Take the first user message to understand the conversation context
    const firstUserMessage =
      messages.find((msg) => msg.role === 'user')?.content || '';

    if (!firstUserMessage) {
      return 'Educational Conversation';
    }

    const response = await grokEndPoint.chat.completions.create({
      model: 'grok-3-mini-latest',
      messages: [
        {
          role: 'system',
          content: `Generate a short, clear title (3-6 words) based on the user's first message. make personal and professional.`,
        },
        {
          role: 'user',
          content: `Generate a title for this educational request: "${firstUserMessage}"`,
        },
      ],
      max_tokens: 30,
      temperature: 0.4,
    });

    const title =
      response.choices[0]?.message?.content?.trim() ||
      'Educational Conversation';

    // Update the conversation with the generated title
    await updateConversationTitle(conversationId, title);

    return title;
  } catch (error) {
    console.error('Failed to generate conversation title:', error);
    return 'Educational Conversation';
  }
}

export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<Conversation> {
  const supabase = await createClient();
  const { data: authUser } = await supabase.auth.getUser();

  if (!authUser || !authUser.user) {
    throw new Error('Unauthorized');
  }

  const updateData: ConversationUpdate = {
    title,
    // Don't update updated_at when just changing title - only when messages are added
  };

  const { data, error } = await supabase
    .from('ai_conversations')
    .update(updateData)
    .eq('id', conversationId)
    .eq('teacher_id', authUser.user.id) // Ensure user owns the conversation
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update conversation title: ${error.message}`);
  }

  revalidatePath('/dashboard');
  return data;
}

export async function deleteConversation(
  conversationId: string
): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const { data: authUser } = await supabase.auth.getUser();

  if (!authUser || !authUser.user) {
    throw new Error('Unauthorized');
  }

  // First delete all messages in the conversation
  const { error: messagesError } = await supabase
    .from('ai_messages')
    .delete()
    .eq('conversation_id', conversationId);

  if (messagesError) {
    throw new Error(`Failed to delete messages: ${messagesError.message}`);
  }

  // Then delete the conversation (with ownership check)
  const { error: conversationError } = await supabase
    .from('ai_conversations')
    .delete()
    .eq('id', conversationId)
    .eq('teacher_id', authUser.user.id); // Ensure user owns the conversation

  if (conversationError) {
    throw new Error(
      `Failed to delete conversation: ${conversationError.message}`
    );
  }

  revalidatePath('/dashboard');
  return { success: true };
}

export async function createConversationWithFirstMessage(
  message: string,
  title?: string
): Promise<{ conversationId: string; conversation: Conversation }> {
  const supabase = await createClient();
  const { data: authUser } = await supabase.auth.getUser();

  if (!authUser || !authUser.user) {
    throw new Error('Unauthorized');
  }

  // Create the conversation first
  const insertData: ConversationInsert = {
    teacher_id: authUser.user.id,
    title: title || 'New Conversation',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: conversation, error: conversationError } = await supabase
    .from('ai_conversations')
    .insert(insertData)
    .select()
    .single();

  if (conversationError) {
    throw new Error(
      `Failed to create conversation: ${conversationError.message}`
    );
  }

  // Add the first user message
  const { error: messageError } = await supabase.from('ai_messages').insert({
    conversation_id: conversation.id,
    content: message,
    sender: 'user',
    created_at: new Date().toISOString(),
  });

  if (messageError) {
    throw new Error(`Failed to create first message: ${messageError.message}`);
  }

  revalidatePath('/dashboard');
  revalidatePath(`/chat/${conversation.id}`);

  return {
    conversationId: conversation.id,
    conversation,
  };
}

export async function getConversationById(
  conversationId: string
): Promise<Conversation | null> {
  const supabase = await createClient();
  const { data: authUser } = await supabase.auth.getUser();

  if (!authUser || !authUser.user) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('id', conversationId)
    .eq('teacher_id', authUser.user.id)
    .single();

  if (error) {
    return null;
  }

  return data;
}
