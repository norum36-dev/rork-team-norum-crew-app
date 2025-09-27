import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRaceStore } from '@/stores/race-context';
import { AlertTriangle, HeartPulse, Activity, CheckCircle } from 'lucide-react-native';
import { HealthData } from '@/types/nutrition';

type SymptomKey = keyof HealthData['symptoms'];

const SYMPTOM_LABELS: Record<string, string> = {
  // Sykdom symptomer
  thirst: 'Tørste',
  darkUrine: 'Mørk urin',
  dizziness: 'Svimmel',
  weightLoss: 'Stor vektnedgang',
  intenseThirst: 'Intens tørste',
  weightGain: 'Vektoppgang/ødem',
  nausea: 'Kvalme',
  headache: 'Hodepine',
  warmSkin: 'Varm hud',
  confusion: 'Forvirring',
  rapidPulse: 'Rask puls',
  shivering: 'Skjelving',
  coldWetSkin: 'Kald/våt hud',
  sluggish: 'Sløv',
  trembling: 'Skjelving',
  coldSweats: 'Kaldsvett',
  emptyFeeling: 'Tom følelse',
  vomiting: 'Oppkast',
  diarrhea: 'Diaré',
  extremeMusclePain: 'Ekstrem muskelsmerte',
  muscleSwelling: 'Muskelhevelse',
  wheezing: 'Piping',
  chestTightness: 'Tetthet i brystet',
  blurredVision: 'Tåkesyn',
  seeingThings: 'Ser ting som ikke er der',
  microsleep: 'Mikrosøvn',
  // Skade symptomer
  hotSpot: 'Hot spot',
  fluidBubble: 'Væskeboble',
  redSoresSkin: 'Rød/sår hud',
  whiteWrinkledSkin: 'Hvit/rynket hud',
  skinCracks: 'Sprekker i huden',
  nailPressure: 'Trykk under negl',
  acutePainSwelling: 'Akutt smerte/hevelse',
  deformity: 'Deformitet',
  severePain: 'Sterk smerte',
  gradualPain: 'Gradvis smerte',
  suddenMuscleSpasm: 'Plutselig muskelspasme',
};

interface HealthRecommendation {
  condition: string;
  symptoms: string[];
  actions: string[];
  severity: 'low' | 'medium' | 'high';
}

const HEALTH_RECOMMENDATIONS: HealthRecommendation[] = [
  // SYKDOM
  {
    condition: 'Dehydrering',
    symptoms: ['thirst', 'darkUrine', 'dizziness'],
    actions: [
      'Små slurker elektrolytt',
      'Finn skygge',
      'Hvil i ro'
    ],
    severity: 'high'
  },
  {
    condition: 'Hypernatremi',
    symptoms: ['weightLoss', 'intenseThirst'],
    actions: [
      'Drikk vann/isoton uten ekstra salt',
      'Hvil i ro',
      'Unngå mer salt inntil bedring'
    ],
    severity: 'high'
  },
  {
    condition: 'Hyponatremi',
    symptoms: ['weightGain', 'nausea', 'headache'],
    actions: [
      'Stopp vanninntak',
      'Ta salt eller søk medisinsk hjelp',
      'Overvåk symptomer nøye'
    ],
    severity: 'high'
  },
  {
    condition: 'Varme/heteslag',
    symptoms: ['warmSkin', 'confusion', 'rapidPulse'],
    actions: [
      'Finn skygge umiddelbart',
      'Aktiv kjøling med is/vann',
      '🚨 Ring 113 ved mistanke om heteslag'
    ],
    severity: 'high'
  },
  {
    condition: 'Hypotermi',
    symptoms: ['shivering', 'coldWetSkin', 'sluggish'],
    actions: [
      'Finn ly og ta av våte klær',
      'Varm opp med tepper/varme',
      '🚨 Ring 113 ved moderat+ hypotermi'
    ],
    severity: 'high'
  },
  {
    condition: 'Hypoglykemi',
    symptoms: ['trembling', 'coldSweats', 'emptyFeeling'],
    actions: [
      'Ta rask sukker (dextro/gel)',
      'Følg opp med mat/drikk',
      'Overvåk blodsukker'
    ],
    severity: 'medium'
  },
  {
    condition: 'GI-plager',
    symptoms: ['nausea', 'vomiting', 'diarrhea'],
    actions: [
      'Reduser farten',
      'Ta små slurker isoton',
      'Bytt fuel/næring',
      'Vurder pause'
    ],
    severity: 'medium'
  },
  {
    condition: 'Rhabdomyolyse',
    symptoms: ['extremeMusclePain', 'muscleSwelling', 'darkUrine'],
    actions: [
      '🚨 STOPP aktivitet umiddelbart',
      'Drikk væske',
      '🚨 Ring 113 - medisinsk nødsituasjon'
    ],
    severity: 'high'
  },
  {
    condition: 'Pustebesvær',
    symptoms: ['wheezing', 'chestTightness'],
    actions: [
      'Stopp aktivitet',
      'Bruk inhalator hvis tilgjengelig',
      'Få frisk luft/bruk maske',
      'Søk hjelp ved forverring'
    ],
    severity: 'high'
  },
  {
    condition: 'Kornealødem',
    symptoms: ['blurredVision'],
    actions: [
      'Stopp aktivitet',
      'Lukk øynene',
      'Bruk saltvannsdrypp',
      'Hvil øynene'
    ],
    severity: 'medium'
  },
  {
    condition: 'Søvnmangel/hallusinasjon',
    symptoms: ['seeingThings', 'microsleep'],
    actions: [
      'Ta powernap (15-20 min)',
      'Drikk koffein',
      'Få følge/støtte',
      'Vurder å stoppe hvis alvorlig'
    ],
    severity: 'medium'
  },
  // SKADER
  {
    condition: 'Blemmer',
    symptoms: ['hotSpot', 'fluidBubble'],
    actions: [
      'Rens området',
      'Bruk tape/pute for beskyttelse',
      'Vurder steril tapping hvis nødvendig'
    ],
    severity: 'low'
  },
  {
    condition: 'Gnagsår',
    symptoms: ['redSoresSkin'],
    actions: [
      'Vask og tørk området',
      'Smør med beskyttende krem',
      'Bruk barriere/tape',
      'Skift til tørt tøy'
    ],
    severity: 'low'
  },
  {
    condition: 'Macerasjon føtter',
    symptoms: ['whiteWrinkledSkin', 'skinCracks'],
    actions: [
      'Tørk føttene grundig',
      'Skift til tørre sokker/sko',
      'Bruk fotpudder',
      'Hold føttene tørre'
    ],
    severity: 'low'
  },
  {
    condition: 'Blånagler',
    symptoms: ['nailPressure'],
    actions: [
      'Avlast tåboks/sko',
      'Kjøl området',
      'Vurder medisinsk trepanasjon ved sterke smerter'
    ],
    severity: 'medium'
  },
  {
    condition: 'Overtråkk',
    symptoms: ['acutePainSwelling'],
    actions: [
      'RICE: Hvile - Is - Kompresjon - Elevasjon',
      'Vurder videre behandling',
      'Unngå belastning'
    ],
    severity: 'medium'
  },
  {
    condition: 'Brudd/traume',
    symptoms: ['deformity', 'severePain'],
    actions: [
      'Immobiliser området',
      '🚨 Ring 113 umiddelbart',
      'Ikke flytt på skadestedet'
    ],
    severity: 'high'
  },
  {
    condition: 'Belastningsskade',
    symptoms: ['gradualPain'],
    actions: [
      'Reduser tempo',
      'Bruk is/tape',
      'Ta paracetamol (forsiktighet med NSAID)',
      'Overvåk utvikling'
    ],
    severity: 'low'
  },
  {
    condition: 'Kramper',
    symptoms: ['suddenMuscleSpasm'],
    actions: [
      'Rolig strekk av muskelen',
      'Lett massasje',
      'Drikk elektrolytt/væske',
      'Vurder salt/magnesium'
    ],
    severity: 'low'
  }
];

export default function HealthScreen() {
  const insets = useSafeAreaInsets();
  const { health, updateHealth } = useRaceStore();
  const [local, setLocal] = useState(health);
  const [recommendations, setRecommendations] = useState<HealthRecommendation[]>([]);
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());

  const toggleSymptom = (key: SymptomKey) => {
    const next = { ...local, symptoms: { ...local.symptoms, [key]: !local.symptoms[key] } };
    setLocal(next);
    updateHealth(next);
  };

  const toggleAction = (actionText: string) => {
    if (!actionText || actionText.trim().length === 0 || actionText.length > 200) return;
    const sanitizedAction = actionText.trim();
    
    const newCompleted = new Set(completedActions);
    if (newCompleted.has(sanitizedAction)) {
      newCompleted.delete(sanitizedAction);
    } else {
      newCompleted.add(sanitizedAction);
    }
    setCompletedActions(newCompleted);
  };

  useEffect(() => {
    const activeSymptoms = (Object.keys(local.symptoms) as SymptomKey[]).filter(
      key => local.symptoms[key]
    );

    const matchingRecommendations = HEALTH_RECOMMENDATIONS.filter(rec => {
      const matchCount = rec.symptoms.filter(symptom => {
        if (!symptom || symptom.trim().length === 0) return false;
        return activeSymptoms.includes(symptom as SymptomKey);
      }).length;
      return matchCount >= 2 || (matchCount >= 1 && rec.symptoms.length <= 2);
    }).sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    setRecommendations(matchingRecommendations);

    // Update flags based on recommendations
    const flags = {
      hypoRisk: matchingRecommendations.some(r => r.condition.includes('Hyponatremi')),
      hyperRisk: matchingRecommendations.some(r => r.condition.includes('Hypernatremi') || r.condition.includes('Dehydrering')),
      giRisk: matchingRecommendations.some(r => r.condition.includes('GI-plager')),
    };

    const updatedHealth = { ...local, flags };
    if (JSON.stringify(updatedHealth.flags) !== JSON.stringify(local.flags)) {
      setLocal(updatedHealth);
      updateHealth(updatedHealth);
    }
  }, [local.symptoms, local.flags, updateHealth]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <HeartPulse size={22} color="#DC2626" />
          <Text style={styles.title}>Helse</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Symptomer</Text>
          <Text style={styles.cardSubtitle}>Velg symptomer du opplever for å få anbefalinger</Text>
          <View style={styles.grid}>
            {Object.keys(SYMPTOM_LABELS).map((key) => {
              const symptomKey = key as SymptomKey;
              const active = local.symptoms[symptomKey];
              const label = SYMPTOM_LABELS[key];
              return (
                <TouchableOpacity 
                  key={key} 
                  style={[styles.symptomPill, active && styles.symptomPillActive]} 
                  onPress={() => toggleSymptom(symptomKey)}
                >
                  <Activity size={16} color={active ? 'white' : '#111827'} />
                  <Text style={[styles.symptomText, active && styles.symptomTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {recommendations.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Anbefalinger</Text>
            <Text style={styles.cardSubtitle}>Basert på valgte symptomer</Text>
            {recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendation}>
                <View style={styles.recommendationHeader}>
                  <AlertTriangle 
                    size={18} 
                    color={rec.severity === 'high' ? '#EF4444' : rec.severity === 'medium' ? '#F59E0B' : '#3B82F6'} 
                  />
                  <Text style={[styles.recommendationTitle, {
                    color: rec.severity === 'high' ? '#EF4444' : rec.severity === 'medium' ? '#F59E0B' : '#3B82F6'
                  }]}>
                    {rec.condition}
                  </Text>
                </View>
                <View style={styles.actionsList}>
                  {rec.actions.map((action, actionIndex) => (
                    <TouchableOpacity 
                      key={actionIndex}
                      style={styles.actionItem}
                      onPress={() => toggleAction(`${rec.condition}-${action}`)}
                    >
                      <CheckCircle 
                        size={16} 
                        color={completedActions.has(`${rec.condition}-${action}`) ? '#10B981' : '#D1D5DB'}
                      />
                      <Text style={[styles.actionText, {
                        textDecorationLine: completedActions.has(`${rec.condition}-${action}`) ? 'line-through' : 'none',
                        color: completedActions.has(`${rec.condition}-${action}`) ? '#6B7280' : '#374151'
                      }]}>
                        {action}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status</Text>
          <View style={styles.flagsRow}>
            <Flag label="Hyponatremi risiko" active={local.flags.hypoRisk} color="#EF4444" />
            <Flag label="Dehydrering risiko" active={local.flags.hyperRisk} color="#F59E0B" />
            <Flag label="GI-problemer" active={local.flags.giRisk} color="#3B82F6" />
          </View>
        </View>

        <Text style={styles.hint}>Endringer lagres automatisk</Text>
      </ScrollView>
    </View>
  );
}

function Flag({ label, active, color }: { label: string; active: boolean; color: string }) {
  return (
    <View style={[styles.flag, { backgroundColor: active ? color : '#F3F4F6' }]}> 
      <AlertTriangle size={14} color={active ? 'white' : '#6B7280'} />
      <Text style={[styles.flagText, { color: active ? 'white' : '#111827' }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  scrollContent: { paddingBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:6, elevation:2 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  symptomPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999 },
  symptomPillActive: { backgroundColor: '#111827' },
  symptomText: { color: '#111827', textTransform: 'capitalize' },
  symptomTextActive: { color: 'white' },
  flagsRow: { flexDirection: 'row', gap: 8 },
  flag: { flexDirection: 'row', gap: 6, alignItems: 'center', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  flagText: { fontWeight: '700' },
  hint: { color: '#6B7280', textAlign: 'center', marginTop: 8 },
  recommendation: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  recommendationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  recommendationTitle: { fontSize: 16, fontWeight: '600' },
  actionsList: { gap: 8 },
  actionItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 4 },
  actionText: { flex: 1, fontSize: 14, lineHeight: 20 },
});