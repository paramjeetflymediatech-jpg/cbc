'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Eye,
  RemoveFormatting,
  Upload,
  Loader2,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write your blog post content here...',
}: RichTextEditorProps) {
  const [isCodeView, setIsCodeView] = useState(false);
  const [uploading, setUploading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync value into contentEditable when value changes externally (e.g. edit blog load)
  useEffect(() => {
    if (editorRef.current && !isCodeView) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value, isCodeView]);

  const updateContent = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, val: string | undefined = undefined) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, val);
    updateContent();
  };

  const insertImageHtml = (url: string) => {
    if (!url) return;
    const imgHtml = `<img src="${url}" alt="Blog Image" class="blog-inline-img" style="max-width:100%; height:auto; display:block; margin:16px 0; border-radius:12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />`;

    if (isCodeView) {
      onChange((value || '') + '\n' + imgHtml);
      return;
    }

    if (editorRef.current) {
      editorRef.current.focus();
      const inserted = document.execCommand('insertHTML', false, imgHtml);
      if (!inserted) {
        // Fallback: append node directly if execCommand failed
        const div = document.createElement('div');
        div.innerHTML = imgHtml;
        const imgNode = div.firstChild;
        if (imgNode) {
          editorRef.current.appendChild(imgNode);
        }
      }
      updateContent();
    }
  };

  const handleAddLink = () => {
    const url = prompt('Enter web link URL (e.g. https://clinicbychoice.com):');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const handleAddImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      insertImageHtml(url);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'blogs-inline');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        insertImageHtml(data.url);
      } else {
        alert(data.error || 'Failed to upload image');
      }
    } catch {
      alert('Error uploading image file');
    } finally {
      setUploading(false);
      // Reset input value so same file can be re-uploaded if needed
      e.target.value = '';
    }
  };

  const isEditorEmpty = !value || value.trim() === '' || value === '<p><br></p>' || value === '<br>';

  return (
    <div className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm focus-within:border-[#ec2c6c] transition-all">
      {/* Formatting Toolbar */}
      <div className="bg-gray-100/90 border-b border-gray-200 p-2 flex flex-wrap items-center justify-between gap-1.5 select-none">
        <div className="flex flex-wrap items-center gap-1">
          {/* Formatting Buttons */}
          <button
            type="button"
            onClick={() => execCommand('bold')}
            className="p-2 hover:bg-white rounded-lg text-gray-800 hover:text-[#ec2c6c] transition-colors border border-transparent hover:border-gray-200 shadow-2xs"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCommand('italic')}
            className="p-2 hover:bg-white rounded-lg text-gray-800 hover:text-[#ec2c6c] transition-colors border border-transparent hover:border-gray-200 shadow-2xs"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCommand('underline')}
            className="p-2 hover:bg-white rounded-lg text-gray-800 hover:text-[#ec2c6c] transition-colors border border-transparent hover:border-gray-200 shadow-2xs"
            title="Underline (Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-gray-300 mx-1" />

          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<h2>')}
            className="p-2 hover:bg-white rounded-lg text-gray-800 hover:text-[#ec2c6c] transition-colors font-bold text-xs border border-transparent hover:border-gray-200 shadow-2xs"
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<h3>')}
            className="p-2 hover:bg-white rounded-lg text-gray-800 hover:text-[#ec2c6c] transition-colors font-bold text-xs border border-transparent hover:border-gray-200 shadow-2xs"
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<p>')}
            className="px-2.5 py-1.5 hover:bg-white rounded-lg text-gray-800 hover:text-[#ec2c6c] transition-colors font-bold text-xs border border-transparent hover:border-gray-200 shadow-2xs"
            title="Normal Paragraph"
          >
            P
          </button>

          <div className="h-5 w-px bg-gray-300 mx-1" />

          <button
            type="button"
            onClick={() => execCommand('insertUnorderedList')}
            className="p-2 hover:bg-white rounded-lg text-gray-800 hover:text-[#ec2c6c] transition-colors border border-transparent hover:border-gray-200 shadow-2xs"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCommand('insertOrderedList')}
            className="p-2 hover:bg-white rounded-lg text-gray-800 hover:text-[#ec2c6c] transition-colors border border-transparent hover:border-gray-200 shadow-2xs"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCommand('formatBlock', 'blockquote')}
            className="p-2 hover:bg-white rounded-lg text-gray-800 hover:text-[#ec2c6c] transition-colors border border-transparent hover:border-gray-200 shadow-2xs"
            title="Quote Block"
          >
            <Quote className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-gray-300 mx-1" />

          <button
            type="button"
            onClick={handleAddLink}
            className="p-2 hover:bg-white rounded-lg text-gray-800 hover:text-[#ec2c6c] transition-colors border border-transparent hover:border-gray-200 shadow-2xs"
            title="Insert Web Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleAddImage}
            className="p-2 hover:bg-white rounded-lg text-gray-800 hover:text-[#ec2c6c] transition-colors border border-transparent hover:border-gray-200 shadow-2xs"
            title="Insert Image via URL"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <label
            className="p-2 hover:bg-white rounded-lg text-gray-800 hover:text-[#ec2c6c] cursor-pointer transition-colors border border-transparent hover:border-gray-200 shadow-2xs flex items-center space-x-1"
            title="Upload Image File directly into Article Body"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#ec2c6c]" />
            ) : (
              <Upload className="w-4 h-4 text-[#ec2c6c]" />
            )}
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            type="button"
            onClick={() => execCommand('removeFormat')}
            className="p-2 hover:bg-white rounded-lg text-gray-800 hover:text-red-600 transition-colors border border-transparent hover:border-gray-200 shadow-2xs"
            title="Clear Formatting"
          >
            <RemoveFormatting className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Toggle */}
        <button
          type="button"
          onClick={() => setIsCodeView(!isCodeView)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
            isCodeView
              ? 'bg-[#101828] text-white shadow-xs'
              : 'bg-white text-gray-800 hover:bg-gray-200 border border-gray-200'
          }`}
        >
          {isCodeView ? (
            <>
              <Eye className="w-3.5 h-3.5 text-[#ec2c6c]" />
              <span>Visual Editor</span>
            </>
          ) : (
            <>
              <Code className="w-3.5 h-3.5 text-[#ec2c6c]" />
              <span>HTML Source Code</span>
            </>
          )}
        </button>
      </div>

      {/* Editor Body Area */}
      {isCodeView ? (
        <textarea
          rows={16}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="<h2>Heading</h2><p>Write HTML content here...</p>"
          className="w-full p-4 font-mono text-xs text-emerald-400 bg-gray-950 focus:outline-none leading-relaxed"
        />
      ) : (
        <div className="relative min-h-[300px] bg-white text-gray-900">
          {isEditorEmpty && (
            <div className="absolute top-5 left-5 pointer-events-none text-gray-400 text-sm font-medium">
              {placeholder}
            </div>
          )}

          <div
            ref={editorRef}
            contentEditable
            onInput={updateContent}
            onBlur={updateContent}
            className="p-5 min-h-[300px] max-h-[550px] overflow-y-auto focus:outline-none text-gray-900 bg-white text-sm leading-relaxed font-normal
              [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-[#101828] [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:border-b [&_h2]:border-pink-100 [&_h2]:pb-1
              [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[#ec2c6c] [&_h3]:mt-4 [&_h3]:mb-2
              [&_p]:mb-3 [&_p]:text-gray-800 [&_p]:leading-relaxed
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ul]:space-y-1
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 [&_ol]:space-y-1
              [&_blockquote]:border-l-4 [&_blockquote]:border-[#ec2c6c] [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:my-4 [&_blockquote]:italic [&_blockquote]:bg-pink-50/70 [&_blockquote]:rounded-r-xl [&_blockquote]:text-gray-900
              [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-4 [&_img]:shadow-md [&_img]:border [&_img]:border-gray-200 [&_img]:block"
          />
        </div>
      )}
    </div>
  );
}
