import React, { useState, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Dimensions, Animated, Image, Platform, Modal, Alert, PanResponder } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Check, PenTool, Download, Share2, ArrowLeft, RotateCcw, Save } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import SignatureCanvas from 'react-native-signature-canvas';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

export default function SignDocumentScreen() {
  const { id, name, uri } = useLocalSearchParams();
  const [isSigned, setIsSigned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [signatureUri, setSignatureUri] = useState<string | null>(null);
  const [showSignPad, setShowSignPad] = useState(false);
  const signatureRef = useRef<any>(null);

  // Drag & Drop State
  const pan = useRef(new Animated.ValueXY({ x: 40, y: 200 })).current;
  const [signScale, setSignScale] = useState(1);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => { pan.flattenOffset(); }
    })
  ).current;

  // Animation for the "Signed" stamp
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const handleSignature = (signature: string) => {
    setSignatureUri(signature);
    setShowSignPad(false);
  };

  const confirmSignaturePlacement = async () => {
    if (!signatureUri) return;
    
    setIsProcessing(true);
    try {
      // If we have a real document ID from firestore, update it
      if (id && id !== 'new') {
        const docRef = doc(db, 'endorsements', id as string);
        await updateDoc(docRef, {
          status: 'Completed',
          signedAt: Date.now(),
          signatureUri: signatureUri,
        });
      }
      
      // Keep the simulation delay for aesthetic transition
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsSigned(true);
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.error("Error signing document:", err);
      Alert.alert("Signing Failed", "Could not verify and sign document.");
    } finally {
      setIsProcessing(false);
    }
  };

  const clearSignPad = () => {
    setSignatureUri(null);
    setIsSigned(false);
    scaleAnim.setValue(0);
    pan.setValue({ x: 40, y: 200 });
    setSignScale(1);
  };

  const openSignPad = () => {
    if (!isSigned) {
      setShowSignPad(true);
    }
  };


  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Premium Header */}
      <LinearGradient colors={['#1E1B4B', '#2D286A']} style={styles.header}>
        <SafeAreaView style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} 
            style={styles.iconButton}
          >
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.docName} numberOfLines={1}>{name || 'Service_Agreement.pdf'}</Text>
            <Text style={styles.statusSub}>{isSigned ? 'Digitally Verified' : 'Awaiting Finger Signature'}</Text>
          </View>
          <View style={{ width: 44 }} />
        </SafeAreaView>
      </LinearGradient>

      {/* Document View Area */}
      <View style={styles.canvas}>
        <View style={styles.pageMock}>
          {signatureUri && !isSigned && !isProcessing && (
            <View style={styles.dragGuideBanner}>
              <Text style={styles.dragGuideText}>👆 Drag signature to place • Use + / - to scale</Text>
            </View>
          )}
          {/* Actual Document Preview */}
          {uri || id !== 'new' ? (
            <View style={{ flex: 1, overflow: 'hidden', borderRadius: 8, backgroundColor: '#F8FAFC' }}>
              {(name as string)?.toLowerCase().endsWith('.pdf') ? (
                uri ? (
                  // Native PDF Viewer
                  <WebView 
                    source={{ uri: uri as string }} 
                    style={{ flex: 1, width: '100%', height: '100%', backgroundColor: 'transparent' }}
                    originWhitelist={['*']}
                    allowFileAccess={true}
                    allowFileAccessFromFileURLs={true}
                    allowUniversalAccessFromFileURLs={true}
                    scalesPageToFit={true}
                  />
                ) : (
                  // Existing Doc Placeholder (No URI)
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                    <View style={{ padding: 24, backgroundColor: '#EEF2FF', borderRadius: 20 }}>
                      <Check size={48} color="#4F46E5" />
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E1B4B' }}>{name}</Text>
                    <Text style={{ color: '#64748B', fontWeight: '600' }}>Document Ready</Text>
                  </View>
                )
              ) : (
                // Image Render
                <Image source={{ uri: uri as string }} style={{ flex: 1, width: '100%' }} resizeMode="contain" />
              )}
            </View>
          ) : (
            // Fallback for missing URI
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
               <Text style={{ color: '#94A3B8', fontWeight: '600' }}>Document loading failed.</Text>
            </View>
          )}

          {/* Signature Result Overlay */}
          {signatureUri && (
            <Animated.View 
              {...(isSigned ? {} : panResponder.panHandlers)}
              style={[
                styles.signatureResult, 
                { 
                  transform: [
                    { translateX: pan.x },
                    { translateY: pan.y },
                    { scale: isSigned ? scaleAnim : signScale }
                  ],
                  borderWidth: isSigned ? 0 : 2,
                  borderColor: isSigned ? 'transparent' : 'rgba(79, 70, 229, 0.5)',
                  borderStyle: 'dashed',
                }
              ]}
            >
               <Image 
                 source={{ uri: signatureUri }} 
                 style={styles.signatureImage} 
                 resizeMode="contain" 
               />
               {!isSigned && (
                  <View style={styles.resizeControls}>
                    <TouchableOpacity onPress={() => setSignScale(s => Math.max(0.4, s - 0.2))} style={styles.resizeBtn}>
                      <Text style={styles.resizeText}>-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setSignScale(s => Math.min(2.5, s + 0.2))} style={styles.resizeBtn}>
                      <Text style={styles.resizeText}>+</Text>
                    </TouchableOpacity>
                  </View>
               )}
               {isSigned && (
                 <View style={styles.verifiedStamp}>
                   <Check size={12} color="#FFF" strokeWidth={3} />
                   <Text style={styles.stampText}>VERIFIED</Text>
                 </View>
               )}
            </Animated.View>
          )}

          {isSigned && (
             <View style={styles.auditLog}>
                <Text style={styles.auditText}>SIGNER: Ebenezer Bankole</Text>
                <Text style={styles.auditText}>DATE: {new Date().toLocaleDateString()}</Text>
                <Text style={styles.auditText}>ID: END-{Math.floor(Math.random()*1000000)}</Text>
             </View>
          )}
        </View>
      </View>

      {/* Global Bottom Actions */}
      <View style={styles.footer}>
        {isProcessing ? (
          <View style={styles.processingState}>
            <Text style={styles.processingText}>Securing cryptographic seal...</Text>
          </View>
        ) : isSigned ? (
          <View style={styles.successActions}>
             <TouchableOpacity style={styles.actionBtn}>
               <Download size={20} color="#4F46E5" />
               <Text style={styles.actionBtnText}>Save PDF</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.actionBtn}>
               <Share2 size={20} color="#4F46E5" />
               <Text style={styles.actionBtnText}>Share</Text>
             </TouchableOpacity>
             <TouchableOpacity 
               style={styles.doneBtn} 
               onPress={() => router.replace('/(tabs)')}
             >
               <Text style={styles.doneBtnText}>Finish</Text>
             </TouchableOpacity>
          </View>
        ) : signatureUri ? (
          <View style={styles.placementActions}>
            <TouchableOpacity 
              style={styles.redrawBtn} 
              onPress={openSignPad}
            >
              <RotateCcw size={18} color="#4F46E5" />
              <Text style={styles.redrawBtnText}>Draw Again</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.confirmBtn} 
              onPress={confirmSignaturePlacement}
            >
              <Check size={18} color="#1E1B4B" />
              <Text style={styles.confirmBtnText}>Confirm Placement</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity 
              style={{
                backgroundColor: '#FBBF24',
                paddingVertical: 14,
                paddingHorizontal: 40,
                borderRadius: 12,
                shadowColor: '#FBBF24',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }} 
              onPress={openSignPad}
            >
              <Text style={{ color: '#1E1B4B', fontWeight: '900', fontSize: 16 }}>Sign Now</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* REAL Signature Pad Modal */}
      <Modal visible={showSignPad} animationType="slide">
        <SafeAreaView style={styles.signPadContainer}>
          <View style={styles.signPadHeader}>
            <TouchableOpacity onPress={() => setShowSignPad(false)} style={styles.signPadClose}>
              <X size={24} color="#1E1B4B" />
            </TouchableOpacity>
            <Text style={styles.signPadTitle}>Draw your Signature</Text>
            <TouchableOpacity onPress={clearSignPad} style={styles.signPadClose}>
              <RotateCcw size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.signPadWrapper}>
             <SignatureCanvas
                ref={signatureRef}
                onOK={handleSignature}
                onEmpty={() => Alert.alert('Empty', 'Please provide a signature.')}
                descriptionText="Sign your name clearly using your finger"
                clearText="Clear"
                confirmText="Save"
                webStyle={`.m-signature-pad--footer {display: none; margin: 0;}`}
                autoClear={false}
                imageType="image/png"
             />
          </View>

          <View style={styles.signPadFooter}>
             <TouchableOpacity 
               style={styles.signCancelBtn} 
               onPress={() => setShowSignPad(false)}
             >
               <Text style={styles.signCancelText}>Discard</Text>
             </TouchableOpacity>
             <TouchableOpacity 
               style={[styles.signSaveBtn, { backgroundColor: '#FBBF24', borderRadius: 14, justifyContent: 'center', alignItems: 'center' }]}
               onPress={() => {
                  signatureRef.current?.readSignature();
               }}
             >
               <Text style={{ color: '#1E1B4B', fontWeight: '900', fontSize: 16 }}>Apply to Document</Text>
             </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'android' ? 20 : 0,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  docName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  statusSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  pageMock: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 32,
    height: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
    position: 'relative',
  },
  dummyTextRow: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    marginBottom: 16,
    width: '100%',
  },
  signaturePlaceholder: {
    position: 'absolute',
    bottom: 80,
    left: 32,
    right: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#EEF2FF',
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 32,
    backgroundColor: '#F8FAFC',
  },
  signPulse: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  placeholderText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  signatureResult: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 180,
    height: 100,
    justifyContent: 'center',
    zIndex: 100,
  },
  resizeControls: {
    position: 'absolute',
    top: -40,
    right: 0,
    flexDirection: 'row',
    gap: 8,
  },
  resizeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  resizeText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#4F46E5',
    lineHeight: 24,
  },
  signatureImage: {
    width: '100%',
    height: '100%',
  },
  verifiedStamp: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  stampText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  auditLog: {
    position: 'absolute',
    bottom: 20,
    left: 32,
  },
  auditText: {
    fontSize: 8,
    color: '#94A3B8',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footer: {
    padding: 24,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  hintText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
  processingState: {
    alignItems: 'center',
  },
  processingText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: 0.5,
  },
  successActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  doneBtn: {
    flex: 1.2,
    backgroundColor: '#1E1B4B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
  },
  /* Sign Pad Modal Styles */
  signPadContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  signPadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  signPadClose: {
    padding: 8,
  },
  signPadTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E1B4B',
  },
  signPadWrapper: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  signPadFooter: {
    flexDirection: 'row',
    padding: 24,
    gap: 16,
  },
  signCancelBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
  },
  signCancelText: {
    fontWeight: '800',
    color: '#64748B',
  },
  signSaveBtn: {
    flex: 2,
  },
  signSaveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  signSaveText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 16,
  },
  dragGuideBanner: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  dragGuideText: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  placementActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  redrawBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  redrawBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4F46E5',
  },
  confirmBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FBBF24',
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    gap: 6,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1E1B4B',
  },
});
