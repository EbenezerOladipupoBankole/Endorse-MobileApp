import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, FlatList, TextInput, View, Text, Modal, Platform } from 'react-native';
import { Search, Plus, MoreHorizontal, FileText, X, PenTool, Copy, Trash2, Edit3, ArrowUpRight } from 'lucide-react-native';
import { router } from 'expo-router';

const REAL_TEMPLATES = [
  { id: 't1', name: 'Non-Disclosure Agreement', category: 'Legal', date: 'Oct 12', uses: 124 },
  { id: 't2', name: 'Independent Contractor', category: 'HR', date: 'Sep 28', uses: 89 },
  { id: 't3', name: 'Standard Sales Contract', category: 'Sales', date: 'Nov 02', uses: 256 },
  { id: 't4', name: 'Employee Onboarding', category: 'HR', date: 'Aug 15', uses: 42 },
  { id: 't5', name: 'Vendor Service Agreement', category: 'Ops', date: 'Oct 05', uses: 18 },
  { id: 't6', name: 'Offer Letter', category: 'HR', date: 'Jan 10', uses: 310 },
];

export default function TemplatesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  const filteredTemplates = REAL_TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openActions = (template: any) => {
    setSelectedTemplate(template);
    setIsActionModalOpen(true);
  };

  const handleUseTemplate = (template: any) => {
    router.push({ pathname: '/sign/[id]', params: { id: template.id, name: template.name } });
  };

  const TemplateItem = ({ item }: { item: typeof REAL_TEMPLATES[0] }) => (
    <TouchableOpacity 
      style={styles.gridCard} 
      activeOpacity={0.7}
      onPress={() => handleUseTemplate(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <FileText size={24} color="#000000" />
        </View>
        <TouchableOpacity style={styles.moreBtn} onPress={() => openActions(item)}>
          <MoreHorizontal size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.templateName} numberOfLines={2}>{item.name}</Text>
      
      <View style={styles.cardFooter}>
        <Text style={styles.categoryText}>{item.category}</Text>
        <Text style={styles.usesText}>{item.uses} uses</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Templates</Text>
          <Text style={styles.subtitle}>Standardize your workflows</Text>
        </View>
        <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/invite')}>
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.createBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search templates..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={filteredTemplates}
        renderItem={({ item }) => <TemplateItem item={item} />}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <FileText size={48} color="#E5E7EB" />
            <Text style={styles.emptyTitle}>No templates found</Text>
          </View>
        }
      />

      {/* Action Modal */}
      <Modal visible={isActionModalOpen} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsActionModalOpen(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>{selectedTemplate?.name}</Text>
                <Text style={styles.modalSubtitle}>{selectedTemplate?.category} Template</Text>
              </View>
              <TouchableOpacity onPress={() => setIsActionModalOpen(false)} style={styles.closeBtn}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
               <ActionRow icon={ArrowUpRight} label="Use this Template" onPress={() => { setIsActionModalOpen(false); handleUseTemplate(selectedTemplate); }} />
               <ActionRow icon={Edit3} label="Edit Layout" onPress={() => setIsActionModalOpen(false)} />
               <ActionRow icon={Copy} label="Duplicate" onPress={() => setIsActionModalOpen(false)} />
               <View style={styles.modalDivider} />
               <ActionRow icon={Trash2} label="Delete Template" color="#EF4444" onPress={() => setIsActionModalOpen(false)} />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const ActionRow = ({ icon: Icon, label, onPress, color = '#000000' }: any) => (
  <TouchableOpacity style={styles.actionRow} onPress={onPress}>
    <Icon size={20} color={color} style={{ marginRight: 16 }} />
    <Text style={[styles.actionLabel, { color }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  searchSection: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreBtn: {
    padding: 4,
    marginRight: -4,
    marginTop: -4,
  },
  templateName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    lineHeight: 20,
    marginBottom: 16,
    height: 40,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  usesText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
  },
  closeBtn: {
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 16,
  },
  modalBody: {
    padding: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
    marginHorizontal: 16,
  },
});

