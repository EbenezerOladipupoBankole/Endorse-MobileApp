import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Plus, User, Mail, ChevronRight, Shield } from 'lucide-react-native';

const TEAM_MEMBERS = [
  { id: '1', name: 'Ebenezer Bankole', email: 'ebenezer@endorse.com', role: 'Admin', initial: 'EB' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah.j@company.com', role: 'Editor', initial: 'SJ' },
  { id: '3', name: 'Michael Chen', email: 'm.chen@design.co', role: 'Viewer', initial: 'MC' },
];

export default function TeamsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#1E1B4B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Teams</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Plus size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <Shield size={24} color="#4F46E5" />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Team Workspace</Text>
            <Text style={styles.infoSub}>Manage your collaborators and their permissions in one place.</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Members ({TEAM_MEMBERS.length})</Text>
        
        {TEAM_MEMBERS.map((member) => (
          <TouchableOpacity key={member.id} style={styles.memberRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{member.initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberEmail}>{member.email}</Text>
            </View>
            <View style={styles.roleTag}>
              <Text style={styles.roleText}>{member.role}</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
        ))}
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
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    padding: 20,
    borderRadius: 20,
    gap: 16,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4338CA',
    marginBottom: 4,
  },
  infoSub: {
    fontSize: 13,
    color: '#6366F1',
    lineHeight: 18,
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
  memberName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1B4B',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  roleTag: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
});
