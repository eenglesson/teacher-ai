import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@radix-ui/react-tooltip';
import { CheckIcon, Copy } from 'lucide-react';
import { MessageContent } from '@/components/prompt-kit/message';
import { cn } from '@/lib/utils';
import AdaptedQuestionsTable from '@/lib/toolsComponents/AdaptedQuestionsTable';

export type Message = {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  userMessageId?: string;
  isComplete: boolean;
  toolInvocations?: Array<{
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    result?: unknown;
  }>;
};

interface ChatMessagesProps {
  messages: Message[];
}

export default function ChatMessages({ messages }: ChatMessagesProps) {
  return (
    <div className='flex-1 overflow-y-auto w-full mx-auto'>
      {' '}
      {/* Increased max-width for table */}
      {messages.map((msg) => (
        <Message key={msg.id} message={msg} />
      ))}
      <div />
    </div>
  );
}

function Message({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.type === 'user';
  const isComplete = message.isComplete;

  // Check if this message has tool invocations with adaptQuestionsForStudents results
  const hasAdaptedQuestionsResult = message.toolInvocations?.some(
    (tool) => tool.toolName === 'adaptQuestionsForStudents' && tool.result
  );

  const getAdaptedQuestionsData = () => {
    const toolInvocation = message.toolInvocations?.find(
      (tool) => tool.toolName === 'adaptQuestionsForStudents' && tool.result
    );

    if (toolInvocation?.result) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = toolInvocation.result as any;
      return {
        originalQuestions: result.originalQuestions || [],
        students: result.students || [],
        adaptationFocus:
          result.adaptationFocus || 'Student-specific adaptations',
      };
    }

    return null;
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <CardContent
        className={`p-4 rounded-lg ${
          isUser ? 'sm:max-w-[80%] text-white' : 'w-full'
        }`}
      >
        {isUser ? (
          <p className='text-base font-normal bg-accent text-foreground rounded-lg p-3'>
            {message.content}
          </p>
        ) : (
          <div className='space-y-4'>
            {/* Regular message content */}
            <MessageContent
              className={cn(
                'prose dark:prose-invert relative min-w-full bg-transparent p-0',
                'prose-h1:scroll-m-20 prose-h1:text-2xl prose-h1:font-semibold prose-h2:mt-8 prose-h2:scroll-m-20 prose-h2:text-xl prose-h2:mb-3 prose-h2:font-medium prose-h3:scroll-m-20 prose-h3:text-base prose-h3:font-medium prose-h4:scroll-m-20 prose-h5:scroll-m-20 prose-h6:scroll-m-20 prose-strong:font-bold prose-table:block prose-table:overflow-y-auto'
              )}
              markdown={true}
            >
              {message.content}
            </MessageContent>

            {/* Render AdaptedQuestionsTable if tool result exists */}
            {hasAdaptedQuestionsResult &&
              (() => {
                const data = getAdaptedQuestionsData();
                return data ? (
                  <div className='mt-6'>
                    <AdaptedQuestionsTable
                      originalQuestions={data.originalQuestions}
                      students={data.students}
                      adaptationFocus={data.adaptationFocus}
                    />
                  </div>
                ) : null;
              })()}
          </div>
        )}

        <CardFooter
          className={`mt-1 p-0 flex gap-2 ${
            isUser ? 'justify-end' : 'justify-start'
          }`}
        >
          {!isUser && isComplete && (
            <>
              {/* <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='text-muted-foreground rounded-full'
                    onClick={() =>
                      message.userMessageId && onRedo(message.userMessageId)
                    }
                    aria-label='Regenerate response'
                  >
                    <RefreshCcw className='w-4 h-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side='bottom'
                  sideOffset={4}
                  className='bg-accent px-3 py-1 text-sm rounded-full'
                >
                  <p>Regenerate</p>
                </TooltipContent>
              </Tooltip> */}
            </>
          )}
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <Button
                size='icon'
                variant='ghost'
                className='text-muted-foreground rounded-full'
                onClick={() => {
                  navigator.clipboard.writeText(message.content);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1000);
                }}
                aria-label='Copy message'
              >
                {copied ? (
                  <CheckIcon className='w-4 h-4 text-foreground' />
                ) : (
                  <Copy
                    className='w-4 h-4'
                    style={{ transform: 'scaleX(-1)' }}
                  />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side='bottom'
              sideOffset={4}
              className='bg-accent px-3 py-1 text-sm rounded-full'
            >
              <p className='text-foreground'>{copied ? 'Copied!' : 'Copy'}</p>
            </TooltipContent>
          </Tooltip>
        </CardFooter>
      </CardContent>
    </div>
  );
}
