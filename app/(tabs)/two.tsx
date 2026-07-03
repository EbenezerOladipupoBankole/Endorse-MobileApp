import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, TextInput, FlatList, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Search, Filter, FileText, ChevronRight, MoreHorizontal, Download, Share2, Trash2, Plus, FileUp } from 'lucide-react-native';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = ['All', 'Recent', 'Signed', 'Pending'];

export default function DocumentsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const tint = '#4F46E5';
  const isDark = colorScheme === 'dark';
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessingUI, setIsProcessingUI] = useState(false);
  const isPickingDocument = useRef(false);

  const INITIAL_DOCS = [
    { id: '1', name: 'Service_Agreement_v2.pdf', date: '2024-03-24', size: '1.2 MB', status: 'Signed' },
    { id: '2', name: 'NDA_Draft.docx', date: '2024-03-23', size: '850 KB', status: 'Pending' },
    { id: '3', name: 'Lease_Agreement.pdf', date: '2024-03-21', size: '2.4 MB', status: 'Signed' },
    { id: '4', name: 'Freelance_Contract.pdf', date: '2024-03-18', size: '1.8 MB', status: 'Signed' },
    { id: '5', name: 'Investor_Deck.pdf', date: '2024-03-15', size: '12.4 MB', status: 'Pending' },
  ];

  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setDocuments(INITIAL_DOCS);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'endorsements'),
      where('signerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbDocs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.documentName || 'Untitled.pdf',
          date: data.createdAt ? new Date(data.createdAt).toISOString().split('T')[0] : 'Unknown',
          size: data.size || '1.2 MB',
          status: data.status || 'Pending',
          uri: data.fileUri || data.localUri,
        };
      });
      // Merge Firestore documents with initial static docs
      setDocuments(dbDocs.length > 0 ? [...dbDocs, ...INITIAL_DOCS] : INITIAL_DOCS);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching endorsements in two.tsx:", error);
      setDocuments(INITIAL_DOCS);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || doc.status === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePickDocument = async () => {
    if (isPickingDocument.current) return;
    isPickingDocument.current = true;
    setIsProcessingUI(true);
    
    try {
      const result = await DocumentPicker.getDocumentAsync({ 
        type: 'application/pdf',
        copyToCacheDirectory: true 
      });
      
      if (!result.canceled) {
        router.push({ pathname: '/sign/[id]', params: { id: 'new', name: result.assets[0].name } });
      }
    } catch (err) {
      console.error('Error picking document:', err);
    } finally {
      setTimeout(() => {
        isPickingDocument.current = false;
        setIsProcessingUI(false);
      }, 800);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]}>
        <Text style={[styles.title, { color: isDark ? '#FFF' : '#1E1B4B' }]}>Documents</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={handlePickDocument}>
            <FileUp size={18} color="#4F46E5" />
            <Text style={styles.uploadBtnText}>Upload</Text>
        </TouchableOpacity>
      </View>

      {/* Search Section */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
          <Search size={18} color="#94A3B8" />
          <TextInput
            style={[styles.searchInput, { color: isDark ? '#FFF' : '#1E1B4B' }]}
            placeholder="Search documents..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Filter size={18} color="#94A3B8" />
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContent}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity 
              key={cat} 
              style={[
                styles.categoryChip, 
                selectedCategory === cat && { backgroundColor: tint }
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === cat ? { color: '#FFF' } : { color: isDark ? '#94A3B8' : '#64748B' }
              ]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results List */}
      <FlatList
        data={filteredDocuments}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
           <View style={styles.emptyContainer}>
              <FileText size={48} color="#94A3B8" />
              <Text style={styles.emptyText}>No documents found</Text>
           </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.docCard, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}
            onPress={() => {
              if (item.status === 'Pending') {
                router.push({ 
                  pathname: '/sign/[id]', 
                  params: { id: item.id, name: item.name, uri: (item as any).uri } 
                });
              }
            }}
          >
            <View style={styles.docMainInfo}>
              <View style={[styles.docIcon, { backgroundColor: '#FFFFFF' }]}>
                <FileText size={22} color={item.status === 'Signed' ? '#22C55E' : tint} />
              </View>
              <View style={styles.docText}>
                <Text style={[styles.docName, { color: isDark ? '#FFF' : '#1E1B4B' }]} numberOfLines={1}>{item.name}</Text>
                <View style={styles.metaRow}>
                   <View style={[styles.statusDot, { backgroundColor: item.status === 'Signed' ? '#22C55E' : '#F59E0B' }]} />
                   <Text style={[styles.docMeta, { color: isDark ? '#94A3B8' : '#64748B' }]}>{item.status} • {item.date}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.moreButton}>
                <MoreHorizontal size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handlePickDocument}>
         <LinearGradient colors={['#4F46E5', '#6366F1']} style={styles.fabGradient}>
            <Plus size={28} color="#FFF" />
         </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  uploadBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4F46E5',
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 14,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  categoriesContainer: {
    marginBottom: 24,
  },
  categoriesContent: {
    paddingHorizontal: 24,
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  docCard: {
    padding: 18,
    borderRadius: 18,
    marginBottom: 16,
  },
  docMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'transparent',
  },
  docIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docText: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  docName: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  docMeta: {
    fontSize: 12,
    fontWeight: '700',
  },
  moreButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    gap: 16,
    backgroundColor: 'transparent',
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 32,
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 4,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
