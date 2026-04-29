import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Smile,
  Send,
  Paperclip,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const emojis = [
  '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😍','🤩','😘',
  '😎','🤓','🧐','😐','😑','🙄','😔','😴','🤯','😤','😡','👍','👎','👏','🙌',
  '👋','🤝','🙏','💪','❤️','🔥','✨','🎉','🎊','💯'
];

export default function RichTextInput({
  onSend,
  disabled,
  placeholder = "Type a message...",
}) {
  const [value, setValue] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [value]);

  const insertEmoji = (emoji) => {
    setValue((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        onSend(value.trim());
        setValue('');
      }
    }
  };

  const handleSendClick = () => {
    if (value.trim()) {
      onSend(value.trim());
      setValue('');
    }
  };

  return (
    <div className="rounded-[1.25rem] border border-lime-400/15 bg-black overflow-hidden">
      <div className="flex items-end gap-3 px-3 py-3">
        <div className="flex items-center gap-1 pb-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-lime-100/45 hover:text-white hover:bg-[#061006]/80"
            title="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-lime-100/45 hover:text-white hover:bg-[#061006]/80"
                title="Emoji"
              >
                <Smile className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2 bg-[#020806]/90 border-lime-400/15">
              <div className="grid grid-cols-8 gap-1 max-h-64 overflow-y-auto">
                {emojis.map((emoji, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="text-2xl hover:bg-[#061006]/80 rounded p-1 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex-1 min-w-0 rounded-2xl border border-lime-400/15 bg-[#020806]/90 px-4 py-3">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full bg-transparent focus:outline-none resize-none min-h-[24px] max-h-[180px] text-slate-100 placeholder:text-lime-100/45"
            rows={1}
          />
        </div>

        <Button
          type="button"
          onClick={handleSendClick}
          disabled={!value.trim() || disabled}
          className="h-11 w-11 rounded-2xl bg-lime-400 hover:bg-lime-400 p-0 shrink-0"
          size="icon"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      <div className="px-4 pb-3 text-[11px] text-lime-100/45">
        Press Enter to send • Shift + Enter for new line
      </div>
    </div>
  );
}