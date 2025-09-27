import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, TextInput, ScrollView, Alert } from 'react-native';
import { useRaceStore } from '@/stores/race-context';
import { Settings, Download, Upload, Clock, Database, Wifi, WifiOff } from 'lucide-react-native';
import { backupService } from '@/utils/backup-service';

export default function BackupSettings() {
  const { backupStatus, updateBackupConfig, manualBackup } = useRaceStore();
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [emailRecipient, setEmailRecipient] = useState<string>('');
  const [intervalMinutes, setIntervalMinutes] = useState<string>(backupStatus.config.intervalMinutes.toString());

  const handleToggleBackup = (enabled: boolean) => {
    updateBackupConfig({ enabled });
  };

  const handleToggleAutoExport = (autoExport: boolean) => {
    updateBackupConfig({ autoExport });
  };

  const handleUpdateInterval = () => {
    const minutes = parseInt(intervalMinutes);
    if (minutes >= 5 && minutes <= 120) {
      updateBackupConfig({ intervalMinutes: minutes });
      Alert.alert('✅ Oppdatert', `Backup-intervall satt til ${minutes} minutter`);
    } else {
      Alert.alert('❌ Feil', 'Intervall må være mellom 5 og 120 minutter');
    }
  };

  const handleUpdateWebhook = () => {
    if (webhookUrl.trim() === '') {
      updateBackupConfig({ webhookUrl: undefined });
      Alert.alert('✅ Oppdatert', 'Webhook URL fjernet');
    } else if (webhookUrl.startsWith('http')) {
      updateBackupConfig({ webhookUrl: webhookUrl.trim() });
      Alert.alert('✅ Oppdatert', 'Webhook URL lagret');
    } else {
      Alert.alert('❌ Feil', 'URL må starte med http:// eller https://');
    }
  };

  const handleUpdateEmail = () => {
    if (emailRecipient.trim() === '') {
      updateBackupConfig({ emailRecipient: undefined });
      Alert.alert('✅ Oppdatert', 'E-post adresse fjernet');
    } else if (emailRecipient.includes('@')) {
      updateBackupConfig({ emailRecipient: emailRecipient.trim() });
      Alert.alert('✅ Oppdatert', 'E-post adresse lagret');
    } else {
      Alert.alert('❌ Feil', 'Ugyldig e-post adresse');
    }
  };

  const handleManualBackup = async () => {
    try {
      await manualBackup();
      Alert.alert('✅ Backup fullført', 'Manuell backup er opprettet');
    } catch (error) {
      Alert.alert('❌ Backup feilet', 'Kunne ikke opprette backup');
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Aldri';
    return date.toLocaleString('nb-NO');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Settings size={24} color="#007AFF" />
        <Text style={styles.title}>Backup Innstillinger</Text>
      </View>

      {/* Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            {backupStatus.running ? (
              <Wifi size={20} color="#34C759" />
            ) : (
              <WifiOff size={20} color="#FF3B30" />
            )}
            <Text style={[styles.statusText, { color: backupStatus.running ? '#34C759' : '#FF3B30' }]}>
              {backupStatus.running ? 'Aktiv' : 'Inaktiv'}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <Clock size={20} color="#8E8E93" />
            <Text style={styles.statusText}>
              Siste backup: {formatDate(backupStatus.lastBackup)}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <Database size={20} color="#8E8E93" />
            <Text style={styles.statusText}>
              Totalt backups: {backupStatus.totalBackups}
            </Text>
          </View>
          
          {backupStatus.nextBackup && (
            <View style={styles.statusRow}>
              <Clock size={20} color="#007AFF" />
              <Text style={styles.statusText}>
                Neste backup: {formatDate(backupStatus.nextBackup)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Grunnleggende innstillinger */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Grunnleggende</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Aktiver automatisk backup</Text>
          <Switch
            value={backupStatus.config.enabled}
            onValueChange={handleToggleBackup}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Automatisk Excel-eksport</Text>
          <Switch
            value={backupStatus.config.autoExport}
            onValueChange={handleToggleAutoExport}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Backup-intervall (minutter)</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={intervalMinutes}
              onChangeText={setIntervalMinutes}
              keyboardType="numeric"
              placeholder="30"
            />
            <TouchableOpacity style={styles.updateButton} onPress={handleUpdateInterval}>
              <Text style={styles.updateButtonText}>Oppdater</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Avanserte innstillinger */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Avansert</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Webhook URL (valgfri)</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={webhookUrl}
              onChangeText={setWebhookUrl}
              placeholder="https://your-webhook.com/backup"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.updateButton} onPress={handleUpdateWebhook}>
              <Text style={styles.updateButtonText}>Lagre</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>E-post for backup (valgfri)</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={emailRecipient}
              onChangeText={setEmailRecipient}
              placeholder="din@epost.no"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.updateButton} onPress={handleUpdateEmail}>
              <Text style={styles.updateButtonText}>Lagre</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Handlinger */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Handlinger</Text>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleManualBackup}>
          <Download size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Opprett backup nå</Text>
        </TouchableOpacity>
      </View>

      {/* Informasjon */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informasjon</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            • Automatisk backup kjører hver {backupStatus.config.intervalMinutes} minutt når løpet er aktivt
          </Text>
          <Text style={styles.infoText}>
            • Backup inkluderer alle hendelser, lager og helseinformasjon
          </Text>
          <Text style={styles.infoText}>
            • Excel-filer lastes ned automatisk på web, lagres i cloud på mobil
          </Text>
          <Text style={styles.infoText}>
            • Webhook sender backup-data til din egen server
          </Text>
          <Text style={styles.infoText}>
            • E-post backup krever backend-tjeneste (ikke implementert ennå)
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginLeft: 12,
  },
  section: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  statusCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 16,
    color: '#000000',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  settingLabel: {
    fontSize: 16,
    color: '#000000',
  },
  inputGroup: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  textInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  updateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#34C759',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
});