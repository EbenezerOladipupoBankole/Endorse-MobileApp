import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, Image, Platform, StatusBar, Animated, Dimensions, Pressable, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, Search, Filter, User, ChevronRight, PenTool, Fingerprint, Users, Clock, CheckCircle2, ChevronRightIcon, X, LayoutDashboard, FileDigit, Trash2, Settings, FileBox, FileUp, Camera, Copy, FilePlus, Scan, FileStack, RefreshCcw, Bell, Plus, FileText, ArrowUpRight, ShieldCheck, Sparkles, Signature, Briefcase, Workflow, HardDrive } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function DashboardScreen() {
  const { user, profile } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isProcessingUI, setIsProcessingUI] = useState(false);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  
  const isPickingDocument = useRef(false);
  const drawerAnim = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    if (!user) return;

    // Listen to real-time updates for endorsements
    const q = query(
      collection(db, 'endorsements'),
      where('signerId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentDocs(docs);
      setIsLoadingDocs(false);
    }, (error) => {
      console.error("Error listening to endorsements:", error);
      setIsLoadingDocs(false);
    });

    return () => unsubscribe();
  }, [user]);

  const toggleDrawer = () => {
    if (isDrawerOpen) {
      Animated.timing(drawerAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsDrawerOpen(false));
    } else {
      setIsDrawerOpen(true);
      Animated.timing(drawerAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePickDocument = async () => {
    if (isPickingDocument.current) return;
    isPickingDocument.current = true;
    setIsProcessingUI(true);
    
    setIsSignModalOpen(false);
    await new Promise(resolve => setTimeout(resolve, 600));

    try {
      const result = await DocumentPicker.getDocumentAsync({ 
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true 
      });
      
      if (!result.canceled) {
        router.push({ 
          pathname: '/sign/[id]', 
          params: { id: 'new', name: result.assets[0].name, uri: result.assets[0].uri } 
        });
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

  const handleScanDocument = async () => {
    setIsSignModalOpen(false);
    router.push('/scanner');
  };

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleDrawer} style={styles.headerIcon}>
            <Menu size={24} color="#1E1B4B" strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={styles.logoContainer} />
          <TouchableOpacity 
            style={styles.headerIcon}
            onPress={() => Alert.alert('Notifications', 'You have no new notifications.')}
          >
            <Bell size={22} color="#1E1B4B" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Welcome & Stats */}
          <View style={styles.welcomeRow}>
            <View>
              <Text style={styles.greeting}>Good morning,</Text>
              <Text style={styles.userName}>{profile?.firstName || 'User'}</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileBtn}
              onPress={() => router.push('/(tabs)/three')}
            >
              <User size={18} color="#4F46E5" />
            </TouchableOpacity>
          </View>

          {/* Signature Focused Quick Actions */}
          <View style={styles.quickActionsWrapper}>
             <TouchableOpacity 
               style={styles.mainActionCard}
               onPress={() => setIsSignModalOpen(true)}
               activeOpacity={0.8}
             >
                <View style={styles.mainActionContent}>
                  <View style={styles.mainActionHeader}>
                     <View style={styles.iconBackgroundLight}>
                        <Signature size={24} color="#4F46E5" />
                     </View>
                     <View style={styles.mainActionTextContainer}>
                       <Text style={styles.mainActionTitle}>Request Signature</Text>
                       <Text style={styles.mainActionSubtitle}>Upload a new document to sign or send to others.</Text>
                     </View>
                  </View>
                  <View style={styles.mainActionFooter}>
                     <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '600' }}>Supports PDF, Word, Image</Text>
                     <View style={styles.mainActionButton}>
                       <Plus size={16} color="#FFFFFF" />
                       <Text style={styles.mainActionButtonText}>Start</Text>
                     </View>
                  </View>
                </View>
             </TouchableOpacity>

             <View style={styles.secondaryActionsRow}>
               <TouchableOpacity 
                 style={styles.secondaryActionCard}
                 onPress={handleScanDocument}
                 activeOpacity={0.7}
               >
                  <View style={styles.secondaryActionIconWrapper}>
                     <Scan size={24} color="#1E1B4B" />
                  </View>
                  <Text style={styles.secondaryActionLabel}>Scan Doc</Text>
               </TouchableOpacity>

               <TouchableOpacity 
                 style={styles.secondaryActionCard} 
                 activeOpacity={0.7} 
                 onPress={() => router.push('/(tabs)/templates')}
               >
                  <View style={styles.secondaryActionIconWrapper}>
                     <FileBox size={24} color="#4F46E5" />
                  </View>
                  <Text style={styles.secondaryActionLabel}>Templates</Text>
               </TouchableOpacity>
               
               <TouchableOpacity 
                 style={styles.secondaryActionCard} 
                 activeOpacity={0.7}
                 onPress={() => Alert.alert('In Person Signing', 'This feature will allow a person next to you to sign a document directly on your device. Coming soon!')}
               >
                  <View style={styles.secondaryActionIconWrapper}>
                     <Users size={24} color="#1E1B4B" />
                  </View>
                  <Text style={styles.secondaryActionLabel}>In Person</Text>
               </TouchableOpacity>
             </View>
          </View>

          {/* Recent Documents Focused Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent activity</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/two')}>
               <Text style={styles.seeAllText}>View all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.docList}>
             {isLoadingDocs ? (
               <ActivityIndicator color="#4F46E5" style={{ marginVertical: 20 }} />
             ) : recentDocs.length > 0 ? (
               recentDocs.map((doc) => (
                 <DocumentRow 
                   key={doc.id}
                   name={doc.documentName} 
                   status={doc.status} 
                   date={getTimeAgo(doc.createdAt)} 
                   color={doc.status === 'Completed' ? '#22C55E' : '#F59E0B'}
                   onPress={() => router.push({ pathname: '/sign/[id]', params: { id: doc.id, name: doc.documentName } })}
                 />
               ))
             ) : (
               <View style={styles.emptyState}>
                 <FileText size={40} color="#CBD5E1" />
                 <Text style={styles.emptyText}>No recent activity yet</Text>
               </View>
             )}
          </View>

          {/* Business Suite / Management Tools */}
          <View style={styles.utilitySection}>
             <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Business Suite</Text>
             </View>
             <View style={styles.utilityGrid}>
                <UtilityItem 
                  icon={Briefcase} 
                  label="Teams" 
                  sub="Manage collaborators" 
                  onPress={() => router.push('/teams')} 
                />
                <UtilityItem 
                  icon={Workflow} 
                  label="Workflow" 
                  sub="Automated approvals" 
                  onPress={() => router.push('/workflow')} 
                />
                <UtilityItem 
                  icon={HardDrive} 
                  label="Vault" 
                  sub="Encrypted storage" 
                  onPress={() => router.push('/vault')} 
                />
                <UtilityItem 
                  icon={Settings} 
                  label="Config" 
                  sub="System preference" 
                  onPress={() => router.push('/(tabs)/three')} 
                />
             </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

      </SafeAreaView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.9}
        onPress={() => setIsSignModalOpen(true)}
      >
        <Plus size={32} color="#FFF" />
      </TouchableOpacity>

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <Pressable style={styles.drawerOverlay} onPress={toggleDrawer}>
          <Animated.View style={[styles.drawerContent, { transform: [{ translateX: drawerAnim }] }]}>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={styles.drawerHeader} />
              <View style={styles.drawerProfileSection}>
                 <View style={styles.drawerAvatar}>
                    <Text style={styles.avatarText}>
                      {(auth.currentUser?.displayName || 'User').split(' ').map(n => n[0]).join('').toUpperCase()}
                    </Text>
                 </View>
                 <View>
                    <Text style={styles.drawerProfileName}>{auth.currentUser?.displayName || 'User'}</Text>
                    <Text style={styles.drawerProfileEmail}>{auth.currentUser?.email || 'user@endorse.com'}</Text>
                 </View>
              </View>
              <View style={styles.drawerBody}>
                <DrawerItem icon={LayoutDashboard} label="Dashboard" onPress={toggleDrawer} accent />
                <DrawerItem icon={FileDigit} label="Documents" onPress={() => { toggleDrawer(); router.push('/(tabs)/two'); }} />
                <DrawerItem icon={FileBox} label="Templates" onPress={() => { toggleDrawer(); router.push('/(tabs)/templates'); }} />
                <DrawerItem icon={Trash2} label="Trash" onPress={toggleDrawer} />
                <View style={styles.drawerDivider} />
                <DrawerItem icon={Settings} label="Settings" onPress={() => { toggleDrawer(); router.push('/(tabs)/three'); }} />
              </View>
            </SafeAreaView>
          </Animated.View>
        </Pressable>
      )}

      {/* Sign Request Modal */}
      <Modal visible={isSignModalOpen} transparent animationType="slide">
         <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
               <View style={styles.modalBar} />
               <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Document</Text>
                  <TouchableOpacity onPress={() => setIsSignModalOpen(false)} style={styles.modalClose}>
                    <X size={20} color="#1E1B4B" />
                  </TouchableOpacity>
               </View>
               <View style={styles.modalBody}>
                  <SignOption 
                    icon={FileUp} 
                    label="Upload File" 
                    desc={isProcessingUI ? "Initializing folder..." : "Choose a PDF from your device storage"} 
                    onPress={handlePickDocument} 
                    disabled={isProcessingUI}
                  />
                  <SignOption 
                    icon={Camera} 
                    label="Scan Paper" 
                    desc={isProcessingUI ? "Opening camera..." : "Take a high-quality scan with your camera"} 
                    onPress={handleScanDocument} 
                    disabled={isProcessingUI}
                  />
                  <SignOption 
                    icon={Copy} 
                    label="From Template" 
                    desc="Fast-track with a pre-formatted template" 
                    onPress={() => { setIsSignModalOpen(false); Alert.alert('Coming Soon', 'Templates feature is currently in development.'); }} 
                    disabled={isProcessingUI}
                  />
               </View>
            </View>
         </View>
      </Modal>
    </View>
  );
}

const DocumentRow = ({ name, status, date, color }: any) => (
  <TouchableOpacity style={styles.docRow}>
     <View style={[styles.docIcon, { backgroundColor: '#F8FAFC' }]}>
        <FileText size={20} color="#4F46E5" />
     </View>
     <View style={{ flex: 1 }}>
        <Text style={styles.docName} numberOfLines={1}>{name}</Text>
        <View style={styles.docStatusRow}>
           <View style={[styles.statusDot, { backgroundColor: color }]} />
           <Text style={styles.docStatusText}>{status} • {date}</Text>
        </View>
     </View>
     <ChevronRightIcon size={16} color="#CBD5E1" />
  </TouchableOpacity>
);

const UtilityItem = ({ icon: Icon, label, sub, accent, onPress }: any) => (
  <TouchableOpacity 
    style={[styles.utilityItem, accent && styles.utilityItemAccent]} 
    onPress={onPress}
    activeOpacity={0.7}
  >
     <Icon size={22} color={accent ? '#FFF' : '#1E1B4B'} />
     <Text style={[styles.utilityLabel, accent && { color: '#FFF' }]}>{label}</Text>
     <Text style={[styles.utilitySub, accent && { color: 'rgba(255,255,255,0.7)' }]}>{sub}</Text>
  </TouchableOpacity>
);

const DrawerItem = ({ icon: Icon, label, onPress, accent }: any) => (
  <TouchableOpacity 
    style={[styles.drawerItem, accent && styles.drawerItemActive]} 
    onPress={onPress}
  >
    <Icon size={20} color={accent ? '#4F46E5' : '#475569'} />
    <Text style={[styles.drawerItemText, accent && { color: '#4F46E5', fontWeight: '800' }]}>{label}</Text>
  </TouchableOpacity>
);

const SignOption = ({ icon: Icon, label, desc, onPress, disabled }: any) => (
  <TouchableOpacity 
    style={[styles.signOptionRow, disabled && { opacity: 0.5 }]} 
    onPress={onPress}
    disabled={disabled}
  >
    <View style={styles.signOptionIcon}>
      <Icon size={22} color="#4F46E5" />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.signLabel}>{label}</Text>
      <Text style={styles.signDesc}>{desc}</Text>
    </View>
    <ArrowUpRight size={18} color="#CBD5E1" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    marginLeft: -20,
    transform: [{ scale: 0.9 }],
  },
  scrollContent: {
    paddingBottom: 100,
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    marginBottom: 32,
  },
  greeting: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1E1B4B',
    letterSpacing: -0.5,
  },
  profileBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#EEF2FF',
  },
  quickActionsWrapper: {
    paddingHorizontal: 24,
    marginBottom: 40,
    gap: 16,
  },
  mainActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  mainActionContent: {
    gap: 16,
  },
  mainActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBackgroundLight: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainActionTextContainer: {
    flex: 1,
  },
  mainActionTitle: {
    color: '#1E1B4B',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  mainActionSubtitle: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  mainActionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  mainActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  mainActionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryActionCard: {
    flex: 1,
    height: 96,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  secondaryActionIconWrapper: {
    marginBottom: 2,
  },
  secondaryActionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E1B4B',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '700',
  },
  docList: {
    paddingHorizontal: 24,
    gap: 12,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 16,
  },
  docIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E1B4B',
    marginBottom: 4,
  },
  docStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  docStatusText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  utilitySection: {
    marginTop: 40,
  },
  utilityGrid: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 8,
  },
  utilityItem: {
    width: (width - 64) / 2,
    height: 140,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  utilityItemAccent: {
    backgroundColor: '#1E1B4B',
  },
  utilityLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E1B4B',
    marginTop: 12,
  },
  utilitySub: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 4,
    lineHeight: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 32,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  modalBar: {
    width: 40,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 12,
  },
  modalBody: {
    gap: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E1B4B',
  },
  modalClose: {
     padding: 8,
  },
  signOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    gap: 16,
  },
  signOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1B4B',
    marginBottom: 2,
  },
  signDesc: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  /* Drawer Styles */
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 1000,
  },
  drawerContent: {
    flex: 1,
    backgroundColor: '#FFF',
    width: width * 0.8,
  },
  drawerHeader: {
    padding: 24,
    paddingTop: 20,
  },
  drawerProfileSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#F8FAFC',
  },
  drawerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1E1B4B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  drawerProfileName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E1B4B',
  },
  drawerProfileEmail: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  drawerBody: {
    flex: 1,
    paddingTop: 32,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 16,
  },
  drawerItemActive: {
     backgroundColor: '#F5F3FF',
  },
  drawerItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  drawerDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
    marginHorizontal: 24,
  },
});
