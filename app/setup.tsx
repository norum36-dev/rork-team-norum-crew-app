import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Calendar, Clock, Settings, CheckCircle } from 'lucide-react-native';
import { useRaceStore } from '@/stores/race-context';

export default function SetupScreen() {
  const { race, initializeRace, updateRaceSettings } = useRaceStore();
  const insets = useSafeAreaInsets();
  
  // Initialize with existing race settings if available
  const [startDate, setStartDate] = useState(() => {
    if (race) {
      return race.startTime.toISOString().split('T')[0];
    }
    return '2025-10-18';
  });
  const [startTime, setStartTime] = useState(() => {
    if (race) {
      return race.startTime.toTimeString().slice(0, 5);
    }
    return '10:00';
  });
  const [duration, setDuration] = useState(() => {
    if (race) {
      return race.durationHours.toString();
    }
    return '24';
  });
  const [phPowder, setPhPowder] = useState(() => race?.toggles.phPowder ?? false);
  const [ytMode, setYtMode] = useState<'OFF' | 'A' | 'B' | 'C' | 'D'>(() => race?.toggles.ytMode ?? 'OFF');
  const [confirmed, setConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleStartRace = () => {
    setErrorMessage('');
    
    if (!confirmed) {
      setErrorMessage('Du må bekrefte næringsplanen før du kan starte løpet.');
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}:00+02:00`);
    const durationHours = parseInt(duration);

    if (isNaN(durationHours) || durationHours < 1 || durationHours > 48) {
      setErrorMessage('Varighet må være mellom 1 og 48 timer.');
      return;
    }

    if (startDateTime < new Date()) {
      setErrorMessage('Starttiden kan ikke være i fortiden.');
      return;
    }

    // Initialize or update race with new settings
    if (race) {
      updateRaceSettings({
        startTime: startDateTime,
        durationHours,
        toggles: { phPowder, ytMode }
      });
    } else {
      initializeRace({
        startTime: startDateTime,
        durationHours,
        toggles: { phPowder, ytMode }
      });
    }

    // Use push instead of replace to allow going back
    router.push('/(tabs)/now');
  };

  const ytModeDescriptions = {
    OFF: 'Ingen YT-alternativ',
    A: 'Legg til YT hver 3. time (≈105,7g karb/t, 10g protein/t, 550ml/t)',
    B: 'Bytt ut M320 med YT hver 3. time (≈97,7g karb/t, 10g protein/t, 500ml/t)',
    C: 'Bytt ut GEL100 med YT hver 3. time (≈97,3g karb/t, 10g protein/t, 550ml/t)',
    D: 'Bytt ut GEL160 med YT hver 3. time (≈92,3g karb/t, 10g protein/t, 550ml/t)',
  };

  const baselineStats = phPowder 
    ? { carbs: 98, sodium: 499, fluid: 450 }
    : { carbs: 89, sodium: 499, fluid: 450 };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Settings size={32} color="#3B82F6" />
          <Text style={styles.title}>Ultra Crew Setup</Text>
          <Text style={styles.subtitle}>Konfigurer løpet ditt</Text>
        </View>

        {/* Start Time Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Starttidspunkt</Text>
          </View>
          
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Dato</Text>
              <TextInput
                style={styles.input}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Tid</Text>
              <TextInput
                style={styles.input}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="HH:MM"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Varighet (timer)</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              placeholder="24"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Nutrition Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Næringsinnstillinger</Text>
          </View>

          {/* PH Powder Toggle */}
          <TouchableOpacity
            style={[styles.toggleButton, phPowder && styles.toggleButtonActive]}
            onPress={() => setPhPowder(!phPowder)}
          >
            <Text style={[styles.toggleText, phPowder && styles.toggleTextActive]}>
              {phPowder ? '✓ PH Pulver (+9g karb/t)' : 'PH Tabletter (standard)'}
            </Text>
          </TouchableOpacity>

          {/* YT Mode Selection */}
          <Text style={styles.subsectionTitle}>YT-alternativ</Text>
          {Object.entries(ytModeDescriptions).map(([mode, description]) => (
            <TouchableOpacity
              key={mode}
              style={[styles.radioButton, ytMode === mode && styles.radioButtonActive]}
              onPress={() => setYtMode(mode as typeof ytMode)}
            >
              <View style={[styles.radioCircle, ytMode === mode && styles.radioCircleActive]}>
                {ytMode === mode && <View style={styles.radioInner} />}
              </View>
              <View style={styles.radioContent}>
                <Text style={[styles.radioTitle, ytMode === mode && styles.radioTitleActive]}>
                  {mode === 'OFF' ? 'Ingen YT' : `YT Alternativ ${mode}`}
                </Text>
                <Text style={styles.radioDescription}>{description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Nutrition Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Forventet næring per time</Text>
          <View style={styles.nutritionSummary}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{baselineStats.carbs}g</Text>
              <Text style={styles.nutritionLabel}>Karbohydrater</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{baselineStats.sodium}mg</Text>
              <Text style={styles.nutritionLabel}>Natrium</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{baselineStats.fluid}ml</Text>
              <Text style={styles.nutritionLabel}>Væske</Text>
            </View>
          </View>
        </View>

        {/* Confirmation */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.confirmButton, confirmed && styles.confirmButtonActive]}
            onPress={() => setConfirmed(!confirmed)}
          >
            <CheckCircle size={20} color={confirmed ? '#10B981' : '#6B7280'} />
            <Text style={[styles.confirmText, confirmed && styles.confirmTextActive]}>
              Jeg bekrefter næringsplanen og er klar til å starte
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Message */}
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Start Button */}
        <TouchableOpacity
          style={[styles.startButton, confirmed && styles.startButtonEnabled]}
          onPress={handleStartRace}
          disabled={!confirmed}
        >
          <Text style={[styles.startButtonText, confirmed && styles.startButtonTextEnabled]}>
            Start løp
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  toggleButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  toggleButtonActive: {
    backgroundColor: '#EBF8FF',
    borderColor: '#3B82F6',
  },
  toggleText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  toggleTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  radioButtonActive: {
    backgroundColor: '#EBF8FF',
    borderColor: '#3B82F6',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: '#3B82F6',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  radioContent: {
    flex: 1,
  },
  radioTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  radioTitleActive: {
    color: '#3B82F6',
  },
  radioDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  nutritionSummary: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    justifyContent: 'space-around',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  confirmButtonActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  confirmText: {
    fontSize: 16,
    color: '#6B7280',
    flex: 1,
  },
  confirmTextActive: {
    color: '#10B981',
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: '#9CA3AF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  startButtonEnabled: {
    backgroundColor: '#3B82F6',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  startButtonTextEnabled: {
    color: 'white',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
});