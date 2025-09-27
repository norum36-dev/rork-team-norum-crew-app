import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { X, ArrowRight } from 'lucide-react-native';
import { EventItem } from '@/types/nutrition';

interface ReplaceModalProps {
  visible: boolean;
  onClose: () => void;
  onReplace: (newItems: EventItem[], note: string) => void;
  currentItems: EventItem[];
}

interface ReplacementOption {
  id: string;
  name: string;
  description: string;
  transform: (items: EventItem[]) => EventItem[];
  note: string;
}

export function ReplaceModal({ visible, onClose, onReplace, currentItems }: ReplaceModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customItems, setCustomItems] = useState('');
  const [customNote, setCustomNote] = useState('');

  const replacementOptions: ReplacementOption[] = [
    {
      id: 'gel100-to-160',
      name: 'GEL100 → GEL160',
      description: 'Bytt GEL100 til GEL160 (+15g karb)',
      transform: (items) => items.map(item => 
        item.type === 'GEL100' 
          ? { ...item, type: 'GEL160' as const }
          : item
      ),
      note: 'GEL100 → GEL160'
    },
    {
      id: 'gel160-to-100',
      name: 'GEL160 → GEL100',
      description: 'Bytt GEL160 til GEL100 (-15g karb)',
      transform: (items) => items.map(item => 
        item.type === 'GEL160' 
          ? { ...item, type: 'GEL100' as const }
          : item
      ),
      note: 'GEL160 → GEL100'
    },
    {
      id: 'm320-to-yt',
      name: 'M320 → YT',
      description: 'Bytt Maurten 320 til YT (protein + karb)',
      transform: (items) => items.map(item => 
        item.type === 'M320' 
          ? { type: 'YT' as const, quantity: 300, unit: 'ml' as const }
          : item
      ),
      note: 'M320 → YT'
    },
    {
      id: 'yt-to-m320',
      name: 'YT → M320',
      description: 'Bytt YT til Maurten 320',
      transform: (items) => items.map(item => 
        item.type === 'YT' 
          ? { type: 'M320' as const, quantity: 150, unit: 'ml' as const }
          : item
      ),
      note: 'YT → M320'
    },
    {
      id: 'double-gel',
      name: 'Dobbel GEL',
      description: 'Legg til en ekstra GEL (samme type)',
      transform: (items) => {
        const gelItem = items.find(item => item.type === 'GEL100' || item.type === 'GEL160');
        if (gelItem) {
          return [...items, { ...gelItem }];
        }
        return [...items, { type: 'GEL100' as const, quantity: 1, unit: 'piece' as const }];
      },
      note: 'Dobbel GEL'
    },
    {
      id: 'skip-gel',
      name: 'Dropp GEL',
      description: 'Fjern GEL fra hendelsen',
      transform: (items) => items.filter(item => item.type !== 'GEL100' && item.type !== 'GEL160'),
      note: 'Droppet GEL'
    },
    {
      id: 'half-portion',
      name: 'Halv porsjon',
      description: 'Reduser alle mengder til 50%',
      transform: (items) => items.map(item => ({
        ...item,
        quantity: Math.round(item.quantity * 0.5)
      })),
      note: 'Halv porsjon'
    },
  ];

  const handleOptionSelect = (optionId: string) => {
    if (optionId === 'custom') {
      setShowCustomInput(true);
      setSelectedOption(null);
    } else {
      setSelectedOption(optionId);
      setShowCustomInput(false);
      setCustomItems('');
      setCustomNote('');
    }
  };

  const handleReplace = () => {
    if (showCustomInput) {
      if (!customItems.trim() || !customNote.trim()) return;
      
      try {
        // Parse custom items (simplified format: "GEL100:1, M320:150ml")
        const items: EventItem[] = customItems.split(',').map(itemStr => {
          const [typeStr, quantityStr] = itemStr.trim().split(':');
          const type = typeStr.trim() as EventItem['type'];
          const quantity = parseInt(quantityStr) || 1;
          const unit = quantityStr.includes('ml') ? 'ml' as const : 'piece' as const;
          
          return { type, quantity, unit };
        });
        
        onReplace(items, customNote.trim());
      } catch (error) {
        return; // Invalid format
      }
    } else if (selectedOption) {
      const option = replacementOptions.find(opt => opt.id === selectedOption);
      if (option) {
        const newItems = option.transform(currentItems);
        onReplace(newItems, option.note);
      }
    }
    
    handleClose();
  };

  const handleClose = () => {
    setSelectedOption(null);
    setCustomItems('');
    setCustomNote('');
    setShowCustomInput(false);
    onClose();
  };

  const canReplace = showCustomInput 
    ? customItems.trim().length > 0 && customNote.trim().length > 0
    : selectedOption !== null;

  const formatItems = (items: EventItem[]) => {
    return items.map(item => `${item.type} ${item.quantity}${item.unit}`).join(', ');
  };

  const getPreviewItems = () => {
    if (!selectedOption) return null;
    const option = replacementOptions.find(opt => opt.id === selectedOption);
    if (!option) return null;
    return option.transform(currentItems);
  };

  const previewItems = getPreviewItems();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Erstatte hendelse</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.currentItems}>
              <Text style={styles.sectionTitle}>Nåværende:</Text>
              <Text style={styles.itemsText}>{formatItems(currentItems)}</Text>
            </View>

            <Text style={styles.modalSubtitle}>Velg erstatning:</Text>
            
            {replacementOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  selectedOption === option.id && styles.optionButtonSelected
                ]}
                onPress={() => handleOptionSelect(option.id)}
              >
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionName,
                    selectedOption === option.id && styles.optionNameSelected
                  ]}>
                    {option.name}
                  </Text>
                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[
                styles.optionButton,
                showCustomInput && styles.optionButtonSelected
              ]}
              onPress={() => handleOptionSelect('custom')}
            >
              <Text style={[
                styles.optionName,
                showCustomInput && styles.optionNameSelected
              ]}>
                Egendefinert erstatning
              </Text>
            </TouchableOpacity>

            {showCustomInput && (
              <View style={styles.customInputContainer}>
                <Text style={styles.inputLabel}>Nye produkter:</Text>
                <TextInput
                  style={styles.customInput}
                  value={customItems}
                  onChangeText={setCustomItems}
                  placeholder="F.eks: GEL160:1, M320:150ml"
                  multiline
                />
                <Text style={styles.inputHint}>
                  Format: PRODUKT:MENGDE, PRODUKT:MENGDE
                </Text>
                
                <Text style={styles.inputLabel}>Notat:</Text>
                <TextInput
                  style={styles.customInput}
                  value={customNote}
                  onChangeText={setCustomNote}
                  placeholder="Beskriv erstatningen..."
                  maxLength={100}
                />
              </View>
            )}

            {previewItems && (
              <View style={styles.previewContainer}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewLabel}>Forhåndsvisning:</Text>
                  <ArrowRight size={16} color="#6B7280" />
                </View>
                <Text style={styles.previewText}>{formatItems(previewItems)}</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleClose}
            >
              <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                Avbryt
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.replaceButton,
                !canReplace && styles.replaceButtonDisabled
              ]}
              onPress={handleReplace}
              disabled={!canReplace}
            >
              <Text style={[
                styles.actionButtonText,
                styles.replaceButtonText,
                !canReplace && styles.replaceButtonTextDisabled
              ]}>
                Erstatt
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    maxHeight: 500,
  },
  currentItems: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    margin: 20,
    marginBottom: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  itemsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  optionButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 8,
  },
  optionButtonSelected: {
    backgroundColor: '#EBF8FF',
    borderColor: '#3B82F6',
  },
  optionContent: {
    gap: 4,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  optionNameSelected: {
    color: '#3B82F6',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  customInputContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  customInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 40,
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  previewContainer: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#10B981',
    padding: 16,
    margin: 20,
    marginTop: 16,
    borderRadius: 8,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  previewText: {
    fontSize: 14,
    color: '#065F46',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    color: '#374151',
  },
  replaceButton: {
    backgroundColor: '#3B82F6',
  },
  replaceButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  replaceButtonText: {
    color: 'white',
  },
  replaceButtonTextDisabled: {
    color: '#F3F4F6',
  },
});