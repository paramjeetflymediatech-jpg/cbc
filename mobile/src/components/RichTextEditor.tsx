import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
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
  placeholder = 'Write detailed hospital description and patient overview...',
  minHeight = 160,
}) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'html' | 'preview'>('visual');
  const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const inputRef = useRef<any>(null);

  // Link Dialog Modal State
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Helper to wrap or insert tags around current cursor selection
  const wrapTag = (openTag: string, closeTag: string, defaultText: string = 'text') => {
    const text = value || '';
    const start = Math.min(selection.start, selection.end);
    const end = Math.max(selection.start, selection.end);

    let newText = '';
    let newCursorPos = start + openTag.length;

    if (start !== end) {
      // User has selected a substring
      const selectedSub = text.substring(start, end);
      newText = text.substring(0, start) + openTag + selectedSub + closeTag + text.substring(end);
      newCursorPos = start + openTag.length + selectedSub.length + closeTag.length;
    } else {
      // No selection: insert template
      newText = text.substring(0, start) + openTag + defaultText + closeTag + text.substring(start);
      newCursorPos = start + openTag.length + defaultText.length + closeTag.length;
    }

    onChange(newText);
    setSelection({ start: newCursorPos, end: newCursorPos });
  };

  const handleBold = () => wrapTag('<strong>', '</strong>', 'Bold text');
  const handleItalic = () => wrapTag('<em>', '</em>', 'Italic text');
  const handleUnderline = () => wrapTag('<u>', '</u>', 'Underline text');
  const handleH2 = () => wrapTag('<h2>', '</h2>', 'Main Heading');
  const handleH3 = () => wrapTag('<h3>', '</h3>', 'Section Heading');
  const handleParagraph = () => wrapTag('<p>', '</p>', 'Paragraph text');
  const handleQuote = () => wrapTag('<blockquote>', '</blockquote>', 'Quote text');
  
  const handleBulletList = () => {
    const listHtml = '\n<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>\n';
    const text = value || '';
    const start = selection.start;
    const newText = text.substring(0, start) + listHtml + text.substring(start);
    onChange(newText);
  };

  const handleNumberedList = () => {
    const listHtml = '\n<ol>\n  <li>First step</li>\n  <li>Second step</li>\n</ol>\n';
    const text = value || '';
    const start = selection.start;
    const newText = text.substring(0, start) + listHtml + text.substring(start);
    onChange(newText);
  };

  const handleOpenLinkModal = () => {
    const text = value || '';
    const start = Math.min(selection.start, selection.end);
    const end = Math.max(selection.start, selection.end);
    if (start !== end) {
      setLinkText(text.substring(start, end));
    } else {
      setLinkText('');
    }
    setLinkUrl('https://');
    setLinkModalVisible(true);
  };

  const handleInsertLink = () => {
    if (!linkUrl.trim()) {
      Alert.alert('Link Required', 'Please enter a valid link URL.');
      return;
    }
    const label = linkText.trim() || linkUrl.trim();
    const linkHtml = `<a href="${linkUrl.trim()}">${label}</a>`;

    const text = value || '';
    const start = Math.min(selection.start, selection.end);
    const end = Math.max(selection.start, selection.end);

    const newText = text.substring(0, start) + linkHtml + text.substring(end);
    onChange(newText);
    setLinkModalVisible(false);
  };

  const handleClearFormat = () => {
    if (!value) return;
    Alert.alert(
      'Clean Formatting',
      'Convert all HTML tags to clean plain text paragraphs?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clean HTML',
          onPress: () => {
            const stripped = value
              .replace(/<\/(p|div|h[1-6]|blockquote|section)>/gi, '\n\n')
              .replace(/<li[^>]*>/gi, '• ')
              .replace(/<\/li>/gi, '\n')
              .replace(/<br\s*\/?>/gi, '\n')
              .replace(/<[^>]+>/g, '')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/&nbsp;/g, ' ')
              .replace(/\n{3,}/g, '\n\n')
              .trim();
            onChange(stripped);
          },
        },
      ]
    );
  };

  // Render HTML preview with styled blocks
  const renderPreviewContent = () => {
    if (!value || !value.trim()) {
      return <Text style={styles.previewEmptyText}>No content written yet. Tap Editor tab to start writing.</Text>;
    }

    // Split content by major tags or blocks for visual preview
    const raw = value;
    const cleanLines = raw
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

          // Strip remaining tags for standard paragraph
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
      {/* Editor Header / Mode Selector */}
      <View style={styles.headerBar}>
        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeTab, activeTab === 'visual' && styles.modeTabActive]}
            onPress={() => setActiveTab('visual')}
          >
            <Text style={[styles.modeTabText, activeTab === 'visual' && styles.modeTabTextActive]}>
              ✏️ Editor
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, activeTab === 'html' && styles.modeTabActive]}
            onPress={() => setActiveTab('html')}
          >
            <Text style={[styles.modeTabText, activeTab === 'html' && styles.modeTabTextActive]}>
              💻 HTML
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
        </View>

        <TouchableOpacity style={styles.clearBtn} onPress={handleClearFormat}>
          <Text style={styles.clearBtnText}>🧹 Clean</Text>
        </TouchableOpacity>
      </View>

      {/* Rich Formatting Toolbar (Active in Editor & HTML modes) */}
      {activeTab !== 'preview' && (
        <View style={styles.toolbar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbarScroll}>
            <TouchableOpacity style={styles.toolBtn} onPress={handleBold}>
              <Text style={[styles.toolBtnText, { fontWeight: '900' }]}>B</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolBtn} onPress={handleItalic}>
              <Text style={[styles.toolBtnText, { fontStyle: 'italic', fontWeight: '800' }]}>I</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolBtn} onPress={handleUnderline}>
              <Text style={[styles.toolBtnText, { textDecorationLine: 'underline', fontWeight: '800' }]}>U</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.toolBtn} onPress={handleH2}>
              <Text style={styles.toolBtnText}>H2</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolBtn} onPress={handleH3}>
              <Text style={styles.toolBtnText}>H3</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolBtn} onPress={handleParagraph}>
              <Text style={styles.toolBtnText}>P</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.toolBtn} onPress={handleBulletList}>
              <Text style={styles.toolBtnText}>• List</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolBtn} onPress={handleNumberedList}>
              <Text style={styles.toolBtnText}>1. List</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolBtn} onPress={handleQuote}>
              <Text style={styles.toolBtnText}>❝ Quote</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.toolBtn} onPress={handleOpenLinkModal}>
              <Text style={styles.toolBtnText}>🔗 Link</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Editor Body Area */}
      <View style={[styles.bodyContainer, { minHeight }]}>
        {activeTab === 'preview' ? (
          <ScrollView style={styles.previewScroll} showsVerticalScrollIndicator={false}>
            {renderPreviewContent()}
          </ScrollView>
        ) : (
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              { minHeight },
              activeTab === 'html' && styles.htmlInput,
            ]}
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
          />
        )}
      </View>

      {/* Link Dialog Modal */}
      <Modal visible={linkModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Insert Web Link</Text>
            <Text style={styles.modalSub}>Link text will navigate patients to the website destination.</Text>

            <Text style={styles.inputLabel}>Link Display Text</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. View Treatment Details"
              placeholderTextColor={colors.textMuted}
              value={linkText}
              onChangeText={setLinkText}
            />

            <Text style={styles.inputLabel}>Destination URL</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="https://clinicbychoice.com"
              placeholderTextColor={colors.textMuted}
              value={linkUrl}
              onChangeText={setLinkUrl}
              autoCapitalize="none"
              keyboardType="url"
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setLinkModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalInsertBtn}
                onPress={handleInsertLink}
              >
                <Text style={styles.modalInsertBtnText}>Insert Link ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 14,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  modeTabs: {
    flexDirection: 'row',
    gap: 6,
  },
  modeTab: {
    paddingHorizontal: 10,
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
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
  toolbar: {
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 6,
  },
  toolbarScroll: {
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 6,
  },
  toolBtn: {
    backgroundColor: colors.surface,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 2,
  },
  bodyContainer: {
    backgroundColor: colors.surface,
  },
  input: {
    padding: 12,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  htmlInput: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#0F766E',
    backgroundColor: '#F0FDFA',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  modalInsertBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalInsertBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textWhite,
  },
});
