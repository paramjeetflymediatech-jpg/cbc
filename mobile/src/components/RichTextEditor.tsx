import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../theme/colors';

interface RichTextEditorProps {
  value: string;
  onChange: (htmlContent: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write detailed content here...',
  minHeight = 220,
}) => {
  const [activeTab, setActiveTab] = useState<'ckeditor' | 'toolbar' | 'html' | 'preview'>('ckeditor');
  const [editorReady, setEditorReady] = useState(false);
  const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [hasWebViewError, setHasWebViewError] = useState(false);

  const webViewRef = useRef<any>(null);
  const inputRef = useRef<any>(null);
  const lastValueRef = useRef<string>(value || '');
  const initialValueRef = useRef<string>(value || '');
  const isInternalChangeRef = useRef<boolean>(false);

  const rawContent = value || '';

  // Synchronize incoming EXTERNAL changes to CKEditor
  useEffect(() => {
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }

    if (value !== lastValueRef.current) {
      lastValueRef.current = value || '';
      if (editorReady && webViewRef.current && activeTab === 'ckeditor') {
        const jsCode = `if (window.setEditorData) { window.setEditorData(${JSON.stringify(value || '')}); } true;`;
        webViewRef.current?.injectJavaScript(jsCode);
      }
    }
  }, [value, editorReady, activeTab]);

  const handleMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'ready') {
        setEditorReady(true);
        // Inject the initial value once ready
        const jsCode = `if (window.setEditorData) { window.setEditorData(${JSON.stringify(initialValueRef.current || '')}); } true;`;
        webViewRef.current?.injectJavaScript(jsCode);
      } else if (msg.type === 'change') {
        isInternalChangeRef.current = true;
        lastValueRef.current = msg.data;
        onChange(msg.data);
      }
    } catch {
      // ignore
    }
  };

  // Helper formatting for native toolbar
  const applyTag = (openTag: string, closeTag: string, placeholderText = 'text') => {
    const { start, end } = selection;
    const before = rawContent.slice(0, start);
    const selected = rawContent.slice(start, end);
    const after = rawContent.slice(end);

    const inserted = selected.length > 0 ? selected : placeholderText;
    const newContent = `${before}${openTag}${inserted}${closeTag}${after}`;
    isInternalChangeRef.current = false;
    onChange(newContent);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const applyBlockTag = (tag: string, placeholderText = 'Heading or block text') => {
    const { start, end } = selection;
    const before = rawContent.slice(0, start);
    const selected = rawContent.slice(start, end);
    const after = rawContent.slice(end);

    const text = selected.length > 0 ? selected : placeholderText;
    const prefix = before.endsWith('\n') || before.length === 0 ? '' : '\n';
    const suffix = after.startsWith('\n') || after.length === 0 ? '' : '\n';

    const newContent = `${before}${prefix}<${tag}>${text}</${tag}>${suffix}${after}`;
    isInternalChangeRef.current = false;
    onChange(newContent);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const applyList = (isOrdered: boolean) => {
    const { start, end } = selection;
    const before = rawContent.slice(0, start);
    const selected = rawContent.slice(start, end);
    const after = rawContent.slice(end);

    const listTag = isOrdered ? 'ol' : 'ul';
    const items = selected.length > 0
      ? selected.split('\n').filter(Boolean).map((item) => `  <li>${item.trim()}</li>`).join('\n')
      : `  <li>Feature item 1</li>\n  <li>Feature item 2</li>`;

    const prefix = before.endsWith('\n') || before.length === 0 ? '' : '\n';
    const suffix = after.startsWith('\n') || after.length === 0 ? '' : '\n';

    const newContent = `${before}${prefix}<${listTag}>\n${items}\n</${listTag}>${suffix}${after}`;
    isInternalChangeRef.current = false;
    onChange(newContent);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const clearFormatting = () => {
    const stripped = rawContent.replace(/<[^>]*>?/gm, '');
    isInternalChangeRef.current = false;
    onChange(stripped);
  };

  // Static HTML template for CKEditor 5 (memorized so it NEVER reloads WebView on keystrokes)
  const ckeditorHtml = useMemo(() => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <script src="https://cdn.ckeditor.com/ckeditor5/41.2.1/classic/ckeditor.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      background: #FFFFFF;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      height: 100%;
      width: 100%;
      overflow-x: hidden;
    }
    #editor-container {
      padding: 0;
      min-height: 100%;
    }
    .ck.ck-editor {
      width: 100% !important;
      border: none !important;
    }
    .ck-editor__editable_inline {
      min-height: ${minHeight}px !important;
      padding: 12px 14px !important;
      font-size: 14px !important;
      line-height: 1.6 !important;
      color: #111827 !important;
      background: #FFFFFF !important;
    }
    .ck.ck-toolbar {
      background: #F8FAFC !important;
      border-top: none !important;
      border-left: none !important;
      border-right: none !important;
      border-bottom: 1px solid #E2E8F0 !important;
      padding: 4px 6px !important;
    }
    .ck.ck-toolbar__items {
      flex-wrap: wrap !important;
    }
    .ck.ck-button {
      border-radius: 6px !important;
      padding: 4px 6px !important;
      font-size: 12px !important;
    }
    .ck.ck-button:hover, .ck.ck-button.ck-on {
      background: #FCE7F3 !important;
      color: #BE185D !important;
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
  </style>
</head>
<body>
  <div id="editor-container">
    <div id="editor"></div>
  </div>

  <script>
    var editorInstance = null;
    var isExternalChange = false;

    ClassicEditor.create(document.querySelector('#editor'), {
      placeholder: ${JSON.stringify(placeholder)},
      toolbar: {
        items: [
          'heading', '|',
          'bold', 'italic', 'underline', '|',
          'bulletedList', 'numberedList', '|',
          'blockQuote', 'insertTable', '|',
          'undo', 'redo'
        ],
        shouldNotGroupWhenFull: true
      },
      table: {
        contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
      }
    }).then(function(editor) {
      editorInstance = editor;

      editor.model.document.on('change:data', function() {
        if (isExternalChange) return;
        var data = editor.getData();
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'change', data: data }));
        }
      });

      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
      }
    }).catch(function(error) {
      console.error('CKEditor Init Error:', error);
    });

    window.setEditorData = function(html) {
      if (!editorInstance) return;
      var current = editorInstance.getData();
      if (current !== (html || '')) {
        isExternalChange = true;
        editorInstance.setData(html || '');
        isExternalChange = false;
      }
    };
  </script>
</body>
</html>
`, [minHeight, placeholder]);

  // Render Preview for Preview tab
  const renderPreview = () => {
    if (!rawContent.trim()) {
      return (
        <Text style={styles.previewEmptyText}>
          No content written yet. Switch to CKEditor tab to write content.
        </Text>
      );
    }

    const cleanLines = rawContent
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n§§H2§§$1§§END§§\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n§§H3§§$1§§END§§\n')
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '\n§§QUOTE§§$1§§END§§\n')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?(p|ul|ol|div|span|section)[^>]*>/gi, '\n')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');

    const blocks = cleanLines.split('\n').filter((l) => l.trim().length > 0);

    return (
      <View style={styles.previewContainer}>
        {blocks.map((block, idx) => {
          if (block.includes('§§H2§§')) {
            const heading = block.replace('§§H2§§', '').replace('§§END§§', '').replace(/<[^>]+>/g, '');
            return (
              <Text key={idx} style={styles.previewH2}>
                {heading}
              </Text>
            );
          }
          if (block.includes('§§H3§§')) {
            const heading = block.replace('§§H3§§', '').replace('§§END§§', '').replace(/<[^>]+>/g, '');
            return (
              <Text key={idx} style={styles.previewH3}>
                {heading}
              </Text>
            );
          }
          if (block.includes('§§QUOTE§§')) {
            const quote = block.replace('§§QUOTE§§', '').replace('§§END§§', '').replace(/<[^>]+>/g, '');
            return (
              <View key={idx} style={styles.previewQuoteBox}>
                <Text style={styles.previewQuoteText}>"{quote}"</Text>
              </View>
            );
          }

          const cleanParagraph = block.replace(/<[^>]+>/g, '').trim();
          if (!cleanParagraph) return null;

          return (
            <Text key={idx} style={styles.previewParagraph}>
              {cleanParagraph}
            </Text>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Bar with Tabs */}
      <View style={styles.headerBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeTab, activeTab === 'ckeditor' && styles.modeTabActive]}
            onPress={() => setActiveTab('ckeditor')}
          >
            <Text style={[styles.modeTabText, activeTab === 'ckeditor' && styles.modeTabTextActive]}>
              ✨ CKEditor 5
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, activeTab === 'toolbar' && styles.modeTabActive]}
            onPress={() => setActiveTab('toolbar')}
          >
            <Text style={[styles.modeTabText, activeTab === 'toolbar' && styles.modeTabTextActive]}>
              🛠️ Quick Format
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, activeTab === 'html' && styles.modeTabActive]}
            onPress={() => setActiveTab('html')}
          >
            <Text style={[styles.modeTabText, activeTab === 'html' && styles.modeTabTextActive]}>
              💻 HTML Code
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, activeTab === 'preview' && styles.modeTabActive]}
            onPress={() => setActiveTab('preview')}
          >
            <Text style={[styles.modeTabText, activeTab === 'preview' && styles.modeTabTextActive]}>
              👁️ Preview
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.brandBadge}>
          <Text style={styles.brandBadgeText}>CKEDITOR</Text>
        </View>
      </View>

      {/* Quick Formatting Toolbar when on toolbar tab */}
      {activeTab === 'toolbar' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolbarContent}
          style={styles.toolbarScroll}
        >
          <TouchableOpacity style={styles.toolBtn} onPress={() => applyTag('<strong>', '</strong>', 'bold text')}>
            <Text style={[styles.toolBtnText, { fontWeight: '900' }]}>B</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolBtn} onPress={() => applyTag('<em>', '</em>', 'italic text')}>
            <Text style={[styles.toolBtnText, { fontStyle: 'italic', fontFamily: 'serif' }]}>I</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolBtn} onPress={() => applyTag('<u>', '</u>', 'underlined text')}>
            <Text style={[styles.toolBtnText, { textDecorationLine: 'underline' }]}>U</Text>
          </TouchableOpacity>
          <View style={styles.toolDivider} />
          <TouchableOpacity style={styles.toolBtn} onPress={() => applyBlockTag('h2', 'Section Heading')}>
            <Text style={[styles.toolBtnText, { fontWeight: '800' }]}>H2</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolBtn} onPress={() => applyBlockTag('h3', 'Sub Heading')}>
            <Text style={[styles.toolBtnText, { fontWeight: '700' }]}>H3</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolBtn} onPress={() => applyBlockTag('p', 'Paragraph content')}>
            <Text style={styles.toolBtnText}>P</Text>
          </TouchableOpacity>
          <View style={styles.toolDivider} />
          <TouchableOpacity style={styles.toolBtn} onPress={() => applyList(false)}>
            <Text style={styles.toolBtnText}>• List</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolBtn} onPress={() => applyList(true)}>
            <Text style={styles.toolBtnText}>1. List</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolBtn} onPress={() => applyBlockTag('blockquote', 'Quote text')}>
            <Text style={styles.toolBtnText}>“ Quote</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolBtn} onPress={() => applyTag('<code>', '</code>', 'code')}>
            <Text style={[styles.toolBtnText, { fontFamily: 'Courier' }]}>&lt;/&gt;</Text>
          </TouchableOpacity>
          <View style={styles.toolDivider} />
          <TouchableOpacity style={styles.toolBtn} onPress={clearFormatting}>
            <Text style={[styles.toolBtnText, { color: '#EF4444' }]}>🧹 Strip</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Editor Body */}
      <View style={[styles.bodyContainer, { height: minHeight + 110 }]}>
        {activeTab === 'ckeditor' && !hasWebViewError && (
          <View style={styles.webViewWrapper}>
            {!editorReady && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Loading CKEditor 5...</Text>
              </View>
            )}
            <WebView
              ref={webViewRef}
              originWhitelist={['*']}
              source={{ html: ckeditorHtml }}
              onMessage={handleMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              scrollEnabled={true}
              keyboardDisplayRequiresUserAction={false}
              automaticallyAdjustContentInsets={false}
              onError={() => setHasWebViewError(true)}
              style={[styles.webView, !editorReady && { opacity: 0 }]}
            />
          </View>
        )}

        {(activeTab === 'toolbar' || (activeTab === 'ckeditor' && hasWebViewError)) && (
          <TextInput
            ref={inputRef}
            style={[styles.editorInput, { height: minHeight + 100 }]}
            value={rawContent}
            onChangeText={(t) => {
              isInternalChangeRef.current = false;
              onChange(t);
            }}
            onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />
        )}

        {activeTab === 'html' && (
          <TextInput
            style={[styles.htmlInput, { height: minHeight + 100 }]}
            value={rawContent}
            onChangeText={(t) => {
              isInternalChangeRef.current = false;
              onChange(t);
            }}
            placeholder="<p>Write HTML code here...</p>"
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />
        )}

        {activeTab === 'preview' && (
          <ScrollView
            style={[styles.previewScroll, { height: minHeight + 100 }]}
            showsVerticalScrollIndicator={false}
          >
            {renderPreview()}
          </ScrollView>
        )}
      </View>

      {/* Footer Info */}
      <View style={styles.footerBar}>
        <Text style={styles.footerText}>
          {rawContent.length} chars • CKEditor 5 Enabled
        </Text>
        <Text style={styles.footerHint}>
          Lead Package Feature Editor
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 14,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    gap: 8,
  },
  modeTabs: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  modeTab: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  modeTabTextActive: {
    color: colors.textWhite,
  },
  brandBadge: {
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  brandBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  toolbarScroll: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  toolbarContent: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  toolBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  toolDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 3,
  },
  bodyContainer: {
    backgroundColor: colors.surface,
  },
  webViewWrapper: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  editorInput: {
    padding: 12,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    backgroundColor: '#FFFFFF',
  },
  htmlInput: {
    padding: 12,
    fontFamily: 'Courier',
    fontSize: 13,
    color: '#0F766E',
    backgroundColor: '#F0FDFA',
    lineHeight: 19,
  },
  previewScroll: {
    padding: 14,
  },
  previewEmptyText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  previewContainer: {
    gap: 8,
    paddingBottom: 16,
  },
  previewH2: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 6,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    paddingBottom: 2,
  },
  previewH3: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
  },
  previewParagraph: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  previewQuoteBox: {
    borderLeftWidth: 3,
    borderColor: colors.primary,
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginVertical: 4,
  },
  previewQuoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#9F1239',
  },
  footerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderColor: colors.borderLight,
  },
  footerText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  footerHint: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },
});
