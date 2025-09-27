import { Race, ScheduledEvent, Inventory, HealthData } from '@/types/nutrition';
import { Platform } from 'react-native';

export interface BackupData {
  timestamp: string;
  race: Race | null;
  events: ScheduledEvent[];
  inventory: Inventory;
  health: HealthData;
  consecutiveSkips: number;
  version: string;
}

export interface BackupConfig {
  enabled: boolean;
  intervalMinutes: number;
  maxBackups: number;
  autoExport: boolean;
  webhookUrl?: string;
  emailRecipient?: string;
}

const DEFAULT_CONFIG: BackupConfig = {
  enabled: true,
  intervalMinutes: 30,
  maxBackups: 48, // 24 timer med backup hver 30. min
  autoExport: true,
};

class BackupService {
  private config: BackupConfig = DEFAULT_CONFIG;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private backupHistory: BackupData[] = [];

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    // I en ekte app ville vi laste fra AsyncStorage
    // For nå bruker vi default config
    this.config = { ...DEFAULT_CONFIG };
  }

  public updateConfig(newConfig: Partial<BackupConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.restart();
  }

  public start(getData: () => {
    race: Race | null;
    events: ScheduledEvent[];
    inventory: Inventory;
    health: HealthData;
    consecutiveSkips: number;
  }) {
    if (!this.config.enabled) return;

    this.stop(); // Stop existing interval

    this.intervalId = setInterval(() => {
      this.createBackup(getData);
    }, this.config.intervalMinutes * 60 * 1000);

    console.log(`🔄 Backup service startet - backup hver ${this.config.intervalMinutes} minutt`);
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ Backup service stoppet');
    }
  }

  public restart() {
    // Restart vil bli kalt fra komponenten som har tilgang til getData
    console.log('🔄 Backup service restart påkrevd');
  }

  private async createBackup(getData: () => {
    race: Race | null;
    events: ScheduledEvent[];
    inventory: Inventory;
    health: HealthData;
    consecutiveSkips: number;
  }) {
    try {
      if (!getData || typeof getData !== 'function') {
        console.error('❌ Ugyldig getData funksjon');
        return;
      }
      
      const data = getData();
      const backup: BackupData = {
        timestamp: new Date().toISOString(),
        ...data,
        version: '1.0.0',
      };

      // Legg til i lokal historie
      this.backupHistory.unshift(backup);
      
      // Behold kun de siste X backups
      if (this.backupHistory.length > this.config.maxBackups) {
        this.backupHistory = this.backupHistory.slice(0, this.config.maxBackups);
      }

      console.log(`💾 Backup opprettet: ${backup.timestamp}`);

      // Send backup til ekstern tjeneste hvis konfigurert
      if (this.config.webhookUrl) {
        await this.sendToWebhook(backup);
      }

      // Eksporter til Excel hvis aktivert
      if (this.config.autoExport) {
        await this.exportToExcel(backup);
      }

      // Send e-post hvis konfigurert
      if (this.config.emailRecipient) {
        await this.sendEmailBackup(backup);
      }

    } catch (error) {
      console.error('❌ Feil ved opprettelse av backup:', error);
    }
  }

  private async sendToWebhook(backup: BackupData) {
    try {
      if (!this.config.webhookUrl) return;

      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'ultra_crew_backup',
          data: backup,
        }),
      });

      if (response.ok) {
        console.log('📤 Backup sendt til webhook');
      } else {
        console.error('❌ Feil ved sending til webhook:', response.status);
      }
    } catch (error) {
      console.error('❌ Webhook feil:', error);
    }
  }

  private async exportToExcel(backup: BackupData) {
    try {
      const excelData = this.convertToExcelFormat(backup);
      
      if (Platform.OS === 'web') {
        // For web - last ned som CSV
        this.downloadCSV(excelData, `ultra_crew_backup_${backup.timestamp.replace(/[:.]/g, '-')}.csv`);
      } else {
        // For mobil - kunne integrere med en cloud storage tjeneste
        console.log('📊 Excel export (mobil) - ville lagre til cloud storage');
      }
    } catch (error) {
      console.error('❌ Excel export feil:', error);
    }
  }

  private convertToExcelFormat(backup: BackupData) {
    const rows: string[][] = [];
    
    // Header
    rows.push(['Tidspunkt', 'Type', 'Status', 'Planlagt tid', 'Faktisk tid', 'Elementer', 'Notater']);
    
    // Events data
    backup.events.forEach(event => {
      const items = event.actualItems || event.items;
      const itemsText = items.map(item => `${item.type} ${item.quantity}${item.unit}`).join(', ');
      
      rows.push([
        backup.timestamp,
        'Hendelse',
        event.status,
        event.plannedTime.toString(),
        event.completedAt?.toString() || '',
        itemsText,
        event.note || '',
      ]);
    });

    // Inventory data
    rows.push(['', '', '', '', '', '', '']);
    rows.push(['LAGER', '', '', '', '', '', '']);
    Object.entries(backup.inventory).forEach(([key, value]) => {
      rows.push([backup.timestamp, 'Lager', key, '', '', value.toString(), '']);
    });

    // Health data
    rows.push(['', '', '', '', '', '', '']);
    rows.push(['HELSE', '', '', '', '', '', '']);
    Object.entries(backup.health.symptoms).forEach(([symptom, active]) => {
      if (active) {
        rows.push([backup.timestamp, 'Symptom', symptom, '', '', 'Aktiv', '']);
      }
    });

    return rows;
  }

  private downloadCSV(data: string[][], filename: string) {
    if (Platform.OS !== 'web') return;

    const csvContent = data.map(row => 
      row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('📥 CSV lastet ned:', filename);
    }
  }

  private async sendEmailBackup(backup: BackupData) {
    try {
      if (!backup || !backup.timestamp) {
        console.error('❌ Ugyldig backup data for e-post');
        return;
      }
      
      // Dette ville kreve en backend-tjeneste for å sende e-post
      // For nå logger vi bare at det ville blitt sendt
      console.log(`📧 E-post backup ville blitt sendt til: ${this.config.emailRecipient}`);
      
      // I en ekte implementasjon:
      // await fetch('/api/send-backup-email', {
      //   method: 'POST',
      //   body: JSON.stringify({ backup, recipient: this.config.emailRecipient })
      // });
    } catch (error) {
      console.error('❌ E-post backup feil:', error);
    }
  }

  public async manualBackup(getData: () => {
    race: Race | null;
    events: ScheduledEvent[];
    inventory: Inventory;
    health: HealthData;
    consecutiveSkips: number;
  }) {
    console.log('🔄 Manuell backup startet...');
    await this.createBackup(getData);
  }

  public getBackupHistory(): BackupData[] {
    return [...this.backupHistory];
  }

  public getLastBackupTime(): Date | null {
    if (this.backupHistory.length === 0) return null;
    return new Date(this.backupHistory[0].timestamp);
  }

  public getConfig(): BackupConfig {
    return { ...this.config };
  }

  public async restoreFromBackup(backup: BackupData): Promise<{
    race: Race | null;
    events: ScheduledEvent[];
    inventory: Inventory;
    health: HealthData;
    consecutiveSkips: number;
  }> {
    console.log('🔄 Gjenoppretter fra backup:', backup.timestamp);
    
    return {
      race: backup.race,
      events: backup.events,
      inventory: backup.inventory,
      health: backup.health,
      consecutiveSkips: backup.consecutiveSkips,
    };
  }

  public isRunning(): boolean {
    return this.intervalId !== null;
  }

  public getStatus(): {
    running: boolean;
    lastBackup: Date | null;
    nextBackup: Date | null;
    totalBackups: number;
    config: BackupConfig;
  } {
    const lastBackup = this.getLastBackupTime();
    const nextBackup = lastBackup && this.isRunning() 
      ? new Date(lastBackup.getTime() + (this.config.intervalMinutes * 60 * 1000))
      : null;

    return {
      running: this.isRunning(),
      lastBackup,
      nextBackup,
      totalBackups: this.backupHistory.length,
      config: this.getConfig(),
    };
  }
}

export const backupService = new BackupService();