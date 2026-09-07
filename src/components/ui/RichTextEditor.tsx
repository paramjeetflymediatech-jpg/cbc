'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  minHeight?: number;
}

declare global {
  interface Window {
    ClassicEditor?: any;
  }
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write content here...',
  minHeight = 220,
}: RichTextEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    // Load CKEditor 5 Classic Build via CDN
    const loadCKEditor = async () => {
      if (typeof window === 'undefined') return;

      if (!window.ClassicEditor) {
        await new Promise<void>((resolve, reject) => {
          const existingScript = document.getElementById('ckeditor-script');
          if (existingScript) {
            existingScript.addEventListener('load', () => resolve());
            return;
          }

          const script = document.createElement('script');
          script.id = 'ckeditor-script';
          script.src = 'https://cdn.ckeditor.com/ckeditor5/41.2.1/classic/ckeditor.js';
          script.async = true;
          script.onload = () => resolve();
          script.onerror = (err) => reject(err);
          document.body.appendChild(script);
        });
      }

      if (!isMounted || !containerRef.current) return;

      try {
        // Destroy existing instance if any
        if (editorInstanceRef.current) {
          await editorInstanceRef.current.destroy();
          editorInstanceRef.current = null;
        }

        const editor = await window.ClassicEditor.create(containerRef.current, {
          placeholder,
          toolbar: [
            'heading',
            '|',
            'bold',
            'italic',
            'underline',
            'strikethrough',
            '|',
            'bulletedList',
            'numberedList',
            '|',
            'outdent',
            'indent',
            '|',
            'link',
            'blockQuote',
            'insertTable',
            '|',
            'undo',
            'redo',
          ],
          table: {
            contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'],
          },
        });

        if (!isMounted) {
          editor.destroy();
          return;
        }

        editorInstanceRef.current = editor;

        // Set initial value
        if (value) {
          isUpdatingRef.current = true;
          editor.setData(value);
          isUpdatingRef.current = false;
        }

        // Listen for user changes
        editor.model.document.on('change:data', () => {
          if (isUpdatingRef.current) return;
          const data = editor.getData();
          onChange(data);
        });

        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize CKEditor:', error);
        setLoading(false);
      }
    };

    loadCKEditor();

    return () => {
      isMounted = false;
      if (editorInstanceRef.current) {
        editorInstanceRef.current.destroy().catch(() => {});
        editorInstanceRef.current = null;
      }
    };
  }, []);

  // Update editor data when value prop changes externally (e.g., when editing another item or resetting)
  useEffect(() => {
    if (editorInstanceRef.current && !loading) {
      const currentData = editorInstanceRef.current.getData();
      const normalizedProp = value || '';
      if (currentData !== normalizedProp) {
        isUpdatingRef.current = true;
        editorInstanceRef.current.setData(normalizedProp);
        isUpdatingRef.current = false;
      }
    }
  }, [value, loading]);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-white shadow-xs border border-gray-200 focus-within:border-[#fd1d74] transition-all">
      {loading && (
        <div
          style={{ minHeight }}
          className="flex items-center justify-center bg-gray-50 text-gray-500 text-xs font-semibold space-x-2"
        >
          <Loader2 className="w-4 h-4 animate-spin text-[#b02151]" />
          <span>Loading CKEditor...</span>
        </div>
      )}

      <div className={loading ? 'hidden' : 'block'}>
        <div ref={containerRef} />
      </div>

      <style jsx global>{`
        .ck-editor__editable_inline {
          min-height: ${minHeight}px !important;
          max-height: 500px !important;
          padding: 1rem 1.25rem !important;
          font-size: 0.875rem !important;
          line-height: 1.625 !important;
          color: #111827 !important;
        }
        .ck-toolbar {
          border-top: none !important;
          border-left: none !important;
          border-right: none !important;
          border-bottom: 1px solid #e5e7eb !important;
          background: #f9fafb !important;
          padding: 0.375rem 0.5rem !important;
          border-top-left-radius: 1rem !important;
          border-top-right-radius: 1rem !important;
        }
        .ck.ck-editor__main > .ck-editor__editable {
          border: none !important;
          box-shadow: none !important;
        }
        .ck.ck-editor__editable:not(.ck-editor__nested-editable).ck-focused {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }
        .ck.ck-button:hover {
          background: #fce7f3 !important;
          color: #b02151 !important;
        }
        .ck.ck-button.ck-on {
          background: #fbcfe8 !important;
          color: #9d174d !important;
        }
      `}</style>
    </div>
  );
}
