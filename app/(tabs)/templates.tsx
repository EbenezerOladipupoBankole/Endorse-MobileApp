import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, FlatList, TextInput, View as RNView, Modal } from 'react-native';
import { Text, View } from '@/components/Themed';
import { FileBox, Search, Plus, MoreHorizontal, ChevronRight, PenTool, Copy, Trash2, Edit3, X } from 'lucide-react-native';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const initialTemplates = [
  { id: '1', name: 'NDA_Standard_Template.pdf', owner: 'Self', date: '2026-03-20', usageCount: 12 },
  { id: '2', name: 'Independent_Contractor_Agreement.pdf', owner: 'HR Team', date: '2026-03-15', usageCount: 45 },
  { id: '3', name: 'Sales_Quote_Template.pdf', owner: 'Sales Team', date: '2026-03-10', usageCount: 128 },
  { id: '4', name: 'Employee_Onboarding_Form.pdf', owner: 'HR Team', date: '2026-02-28', usageCount: 30 },
];

export default function TemplatesScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const tint = '#4F46E5';
  const isDark = colorScheme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openActions = (template: any) => {
    setSelectedTemplate(template);
    setIsActionModalOpen(true);
  };

  const TemplateItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.templateCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]} 
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: '/sign/[id]', params: { id: item.id, name: item.name } })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <FileBox size={24} color={tint} />
        </View>
        <TouchableOpacity onPress={() => openActions(item)}>
          <MoreHorizontal size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.templateName} numberOfLines={1}>{item.name}</Text>
      
      <View style={styles.cardFooter}>
         <View style={styles.badge}>
           <Text style={styles.badgeText}>{item.owner}</Text>
         </View>
         <Text style={styles.usageText}>{item.usageCount} uses</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Templates</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/invite')}>
          <Plus size={20} color="#FFF" />
          <Text style={styles.createBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search templates"
            placeholderTextColor="#94A3B8"
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
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <FileBox size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No templates found</Text>
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
              <Text style={styles.modalTitle} numberOfLines={1}>{selectedTemplate?.name}</Text>
              <TouchableOpacity onPress={() => setIsActionModalOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
               <ActionRow icon={PenTool} label="Use as a Template" onPress={() => { setIsActionModalOpen(false); router.push('/invite'); }} />
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

const ActionRow = ({ icon: Icon, label, onPress, color = '#1E1B4B' }: any) => (
  <TouchableOpacity style={styles.actionRow} onPress={onPress}>
    <Icon size={20} color={color} />
    <Text style={[styles.actionLabel, { color }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  createBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  searchSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E1B4B',
  },
  listContent: {
    padding: 16,
  },
  columnWrapper: {
    gap: 16,
    marginBottom: 16,
  },
  templateCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1B4B',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  usageText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600',
  },
  /* Action Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1B4B',
    marginRight: 16,
  },
  modalBody: {
    padding: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
});
