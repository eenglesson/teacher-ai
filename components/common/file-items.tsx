'use client';

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { X } from 'lucide-react';

import { useState } from 'react';

type FileItemProps = {
  file: File;
  onRemove: (file: File) => void;
};

export function FileItem({ file, onRemove }: FileItemProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleRemove = () => {
    setIsRemoving(true);
    onRemove(file);
  };

  return (
    <div className='relative mr-2 mb-0 flex items-center'>
      <HoverCard
        open={file.type.includes('image') ? isOpen : false}
        onOpenChange={setIsOpen}
      >
        <HoverCardTrigger className='w-full'>
          <div className='bg-background hover:bg-accent border-input flex w-full items-center gap-3 rounded-2xl border p-2  transition-colors'>
            <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-md'>
              {file.type.includes('image') ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className='h-full w-full object-cover rounded-md'
                />
              ) : (
                <div className='bg-accent-foreground flex h-full w-full items-center justify-center rounded-md'>
                  <div className='text-center text-xs text-gray-400'>
                    {file.name.split('.').pop()?.toUpperCase()}
                  </div>
                </div>
              )}
            </div>
            <div className='flex flex-col overflow-hidden'>
              <span className='truncate text-xs font-medium'>{file.name}</span>
              <span className='text-xs text-gray-500'>
                {(file.size / 1024).toFixed(2)}kB
              </span>
            </div>
          </div>
        </HoverCardTrigger>
        <HoverCardContent side='top'>
          <div className='text-xs font-medium truncate'>{file.name}</div>
          <div className='text-xs text-gray-500 mb-2'>
            {(file.size / 1024).toFixed(2)} kB
          </div>
          <img
            src={URL.createObjectURL(file)}
            alt={file.name}
            className='h-full w-full object-cover rounded-md'
          />
        </HoverCardContent>
      </HoverCard>
      {!isRemoving ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type='button'
              onClick={handleRemove}
              className='border-background absolute top-1 right-1 z-10 inline-flex size-6 translate-x-1/2 -translate-y-1/2 items-center border-[1px] hover:border-muted justify-center rounded-full bg-black text-white shadow-none transition-colors'
              aria-label='Remove file'
            >
              <X className='size-3' />
            </button>
          </TooltipTrigger>
          <TooltipContent>Remove file</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}
