import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, GitPullRequest, Clock, CheckCircle2, MoreHorizontal, Settings2 } from 'lucide-react-native';

const WORKFLOWS = [
  { id: '1', name: 'Standard NDA', steps: 3, status: 'Active', color: '#22C55E' },
  { id: '2', name: 'Contract Review', steps: 5, status: 'Draft', color: '#94A3B8' },
  { id: '3', name: 'Offer Letter', steps: 2, status: 'Active', color: '#22C55E' },
];

export default function WorkflowScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#1E1B4B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workflow</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Settings2 size={22} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroBox}>
          <GitPullRequest size={32} color="#FFF" />
          <View>
            <Text style={styles.heroTitle}>Automated Flows</Text>
            <Text style={styles.heroSub}>Create multi-step approval paths for your documents.</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Active Workflows</Text>

        {WORKFLOWS.map((flow) => (
          <TouchableOpacity key={flow.id} style={styles.flowCard}>
            <View style={styles.flowInfo}>
              <View style={[styles.statusDot, { backgroundColor: flow.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.flowName}>{flow.name}</Text>
                <Text style={styles.flowSteps}>{flow.steps} verification steps</Text>
              </View>
              <View style={styles.actionBadge}>
                 <Text style={styles.actionBadgeText}>{flow.status}</Text>
              </View>
              <MoreHorizontal size={20} color="#CBD5E1" />
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.createBtn}>
           <Text style={styles.createBtnText}>Create New Workflow</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  addBtn: {
    padding: 8,
    marginRight: -8,
  },
  content: {
    padding: 24,
  },
  heroBox: {
    backgroundColor: '#1E1B4B',
    padding: 24,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 32,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    lineHeight: 18,
    maxWidth: 200,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  flowCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  flowInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  flowName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1B4B',
    marginBottom: 2,
  },
  flowSteps: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  actionBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
  },
  createBtn: {
    marginTop: 20,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#E0E7FF',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4F46E5',
  },
});
