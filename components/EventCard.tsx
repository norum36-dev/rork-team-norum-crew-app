import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react-native';
import { ScheduledEvent } from '@/types/nutrition';
import { formatTime, formatTimeUntil, isEventOverdue } from '@/utils/nutrition-calculator';

interface EventCardProps {
  event: ScheduledEvent;
  onComplete: () => void;
  onSkip: () => void;
  onReplace: () => void;
  isNext?: boolean;
}

export function EventCard({ event, onComplete, onSkip, onReplace, isNext }: EventCardProps) {
  const overdue = isEventOverdue(event);
  const timeUntil = formatTimeUntil(event.plannedTime);
  
  const getStatusColor = () => {
    switch (event.status) {
      case 'done': return '#10B981';
      case 'skipped': return '#EF4444';
      case 'replaced': return '#F59E0B';
      default: return overdue ? '#EF4444' : '#6B7280';
    }
  };

  const formatItems = () => {
    return event.items.map(item => {
      if (item.unit === 'ml') {
        return `${item.quantity}ml ${item.type}`;
      }
      return `${item.quantity}× ${item.type}`;
    }).join(' + ');
  };

  return (
    <View style={[
      styles.container,
      isNext && styles.nextEvent,
      overdue && styles.overdueEvent
    ]}>
      <View style={styles.header}>
        <View style={styles.timeContainer}>
          <Clock size={16} color={getStatusColor()} />
          <Text style={[styles.time, { color: getStatusColor() }]}>
            {formatTime(event.plannedTime)}
          </Text>
          {timeUntil !== 'NÅ' && (
            <Text style={styles.timeUntil}>({timeUntil})</Text>
          )}
        </View>
        {event.status !== 'due' && (
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>
              {event.status.toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.items}>{formatItems()}</Text>
      
      {event.note && (
        <Text style={styles.note}>{event.note}</Text>
      )}

      {event.status === 'due' && (
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.completeButton]}
            onPress={onComplete}
          >
            <CheckCircle size={20} color="white" />
            <Text style={styles.actionButtonText}>Levert</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.skipButton]}
            onPress={onSkip}
          >
            <XCircle size={20} color="white" />
            <Text style={styles.actionButtonText}>Skippet</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.replaceButton]}
            onPress={onReplace}
          >
            <RefreshCw size={20} color="white" />
            <Text style={styles.actionButtonText}>Erstattet</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextEvent: {
    borderWidth: 2,
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  overdueEvent: {
    borderWidth: 2,
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  time: {
    fontSize: 18,
    fontWeight: '600',
  },
  timeUntil: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  items: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 22,
  },
  note: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  completeButton: {
    backgroundColor: '#10B981',
  },
  skipButton: {
    backgroundColor: '#EF4444',
  },
  replaceButton: {
    backgroundColor: '#F59E0B',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});