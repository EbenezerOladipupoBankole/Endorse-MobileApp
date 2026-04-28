import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Image } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, HardDrive, ShieldCheck, Search, Filter, Lock, Unlock, ChevronRight } from 'lucide-react-native';

const VAULT_ITEMS = [
  { id: '1', name: 'Private_Key_Backup.pdf', date: 'Mar 24, 2026', size: '1.2 MB', encrypted: true },
  { id: '2', name: 'Identity_Passport.jpg', date: 'Mar 22, 2026', size: '2.4 MB', encrypted: true },
  { id: '3', name: 'Bank_Statement_Q1.pdf', date: 'Mar 15, 2026', size: '4.8 MB', encrypted: true },
];

export default function VaultScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>The Vault</Text>
        <TouchableOpacity style={styles.searchBtn}>
          <Search size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.vaultStatus}>
          <View style={styles.vaultIconContainer}>
            <Lock size={40} color="#10B981" />
          </View>
          <Text style={styles.vaultTitle}>Storage Secured</Text>
          <Text style={styles.vaultSub}>AES-256 military-grade encryption active for all documents stored in this vault.</Text>
        </View>

        <View style={styles.statsRow}>
           <View style={styles.statBox}>
              <Text style={styles.statVal}>8.4 GB</Text>
              <Text style={styles.statLabel}>Free space</Text>
           </View>
           <View style={styles.statDivider} />
           <View style={styles.statBox}>
              <Text style={styles.statVal}>24</Text>
              <Text style={styles.statLabel}>Total files</Text>
           </View>
        </View>

        <View style={styles.listHeader}>
           <Text style={styles.sectionTitle}>Secret Documents</Text>
           <TouchableOpacity>
             <Filter size={18} color="#94A3B8" />
           </TouchableOpacity>
        </View>

        {VAULT_ITEMS.map((item) => (
          <TouchableOpacity key={item.id} style={styles.vaultCard}>
            <View style={styles.fileIcon}>
               <ShieldCheck size={20} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fileName}>{item.name}</Text>
              <Text style={styles.fileMeta}>{item.date} • {item.size}</Text>
            </View>
            <ChevronRight size={18} color="#D1D5DB" />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.unlockBtn}>
           <Text style={styles.unlockBtnText}>Add to Vault</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Dark Slate
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  searchBtn: {
    padding: 8,
    marginRight: -8,
  },
  content: {
    padding: 24,
  },
  vaultStatus: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  vaultIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  vaultTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 12,
  },
  vaultSub: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    marginBottom: 40,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#334155',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  vaultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 16,
  },
  fileIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  fileMeta: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  unlockBtn: {
    marginTop: 20,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
  },
});
