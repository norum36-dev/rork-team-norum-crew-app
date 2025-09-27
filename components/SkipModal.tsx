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
import { X } from 'lucide-react-native';

interface SkipModalProps {
  visible: boolean;
  onClose: () => void;
  onSkip: (reason: string) => void;
}

export function SkipModal({ visible, onClose, onSkip }: SkipModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const predefinedReasons = [
    'Mageproblemer',
    'Tempo',
    'Utstyr',
    'Kvalme',
    'Ikke tørst',
    'Glemt',
  ];

  const handleReasonSelect = (reason: string) => {
    if (reason === 'Annet') {
      setShowCustomInput(true);
      setSelectedReason(null);
    } else {
      setSelectedReason(reason);
      setShowCustomInput(false);
      setCustomReason('');
    }
  };

  const handleSkip = () => {
    const reason = showCustomInput ? customReason.trim() : selectedReason;
    
    if (!reason || reason.length === 0) {
      return;
    }

    if (reason.length > 100) {
      return;
    }

    onSkip(reason);
    handleClose();
  };

  const handleClose = () => {
    setSelectedReason(null);
    setCustomReason('');
    setShowCustomInput(false);
    onClose();
  };

  const canSkip = showCustomInput 
    ? customReason.trim().length > 0 && customReason.trim().length <= 100
    : selectedReason !== null;

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
            <Text style={styles.modalTitle}>Skippe hendelse</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalSubtitle}>Velg årsak:</Text>
            
            {predefinedReasons.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonButton,
                  selectedReason === reason && styles.reasonButtonSelected
                ]}
                onPress={() => handleReasonSelect(reason)}
              >
                <Text style={[
                  styles.reasonButtonText,
                  selectedReason === reason && styles.reasonButtonTextSelected
                ]}>
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[
                styles.reasonButton,
                showCustomInput && styles.reasonButtonSelected
              ]}
              onPress={() => handleReasonSelect('Annet')}
            >
              <Text style={[
                styles.reasonButtonText,
                showCustomInput && styles.reasonButtonTextSelected
              ]}>
                Annet (skriv egen kommentar)
              </Text>
            </TouchableOpacity>

            {showCustomInput && (
              <View style={styles.customInputContainer}>
                <Text style={styles.inputLabel}>Egen kommentar:</Text>
                <TextInput
                  style={styles.customInput}
                  value={customReason}
                  onChangeText={setCustomReason}
                  placeholder="Skriv årsak her..."
                  multiline
                  maxLength={100}
                  textAlignVertical="top"
                />
                <Text style={styles.characterCount}>
                  {customReason.length}/100 tegn
                </Text>
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
                styles.skipButton,
                !canSkip && styles.skipButtonDisabled
              ]}
              onPress={handleSkip}
              disabled={!canSkip}
            >
              <Text style={[
                styles.actionButtonText,
                styles.skipButtonText,
                !canSkip && styles.skipButtonTextDisabled
              ]}>
                Skippe
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
    maxHeight: '80%',
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
    maxHeight: 400,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  reasonButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 8,
  },
  reasonButtonSelected: {
    backgroundColor: '#EBF8FF',
    borderColor: '#3B82F6',
  },
  reasonButtonText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
  reasonButtonTextSelected: {
    color: '#3B82F6',
    fontWeight: '500',
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
  },
  customInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
  },
  characterCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
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
  skipButton: {
    backgroundColor: '#EF4444',
  },
  skipButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  skipButtonText: {
    color: 'white',
  },
  skipButtonTextDisabled: {
    color: '#F3F4F6',
  },
});