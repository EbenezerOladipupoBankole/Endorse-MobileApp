import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Dimensions, DimensionValue } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EndorseTokens as T } from '../../constants/EndorseTokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  { kind: 'scan', badge: 'Scan', kicker: 'Scan on the go', title: 'Scan any document with your camera.' },
  { kind: 'manage', badge: 'Organize', kicker: 'All in one place', title: 'Organize and manage every file.' },
  { kind: 'sign', badge: 'Signed', kicker: 'Sign & send', title: 'Sign, send and track — instantly.' },
];

const MG_ROWS = [
  { iconBg: '#FFF1C9', iconStroke: '#B8871E', w1: '68%', w2: '40%', tag: 'Signed', tagBg: '#FFF1C9', tagFg: '#A9781A' },
  { iconBg: '#E7F0FA', iconStroke: '#0E68B4', w1: '54%', w2: '46%', tag: 'Draft', tagBg: '#E7F0FA', tagFg: '#0E68B4' },
  { iconBg: '#E7F3EC', iconStroke: '#2E9E5B', w1: '72%', w2: '34%', tag: 'Sent', tagBg: '#E7F3EC', tagFg: '#2E9E5B' },
];

function ScanHero() {
  return (
    <View style={heroStyles.centerWrapper}>
      <View style={{ transform: [{ translateY: -20 }] }}>
        <View style={[heroStyles.scanLayer1, { transform: [{ rotate: '-9deg' }] }]} />
        <View style={[heroStyles.scanLayer2, { transform: [{ rotate: '4deg' }] }]} />
        <View style={[heroStyles.scanTopLayer, { transform: [{ rotate: '-2deg' }] }]}>
          {(['56%', '94%', '86%', '92%', '78%', '88%', '54%'] as DimensionValue[]).map((w, i) => (
            <View key={i} style={[
              heroStyles.scanLine, 
              { width: w, height: i === 0 ? 7 : 6, backgroundColor: i === 0 ? '#C7D3E4' : '#E7ECF3' },
              i < 6 && { marginBottom: i === 0 ? 12 : 10 }
            ]} />
          ))}
        </View>
        
        {/* Frame Brackets */}
        <View style={[heroStyles.bracket, { top: -10, left: -12, borderTopWidth: 3.5, borderLeftWidth: 3.5, borderTopLeftRadius: 7 }]} />
        <View style={[heroStyles.bracket, { top: -10, right: -12, borderTopWidth: 3.5, borderRightWidth: 3.5, borderTopRightRadius: 7 }]} />
        <View style={[heroStyles.bracket, { bottom: -10, left: -12, borderBottomWidth: 3.5, borderLeftWidth: 3.5, borderBottomLeftRadius: 7 }]} />
        <View style={[heroStyles.bracket, { bottom: -10, right: -12, borderBottomWidth: 3.5, borderRightWidth: 3.5, borderBottomRightRadius: 7 }]} />
        
        {/* Scan line */}
        <View style={heroStyles.scanLaser} />
      </View>
    </View>
  );
}

function ManageHero() {
  return (
    <View style={heroStyles.centerWrapper}>
      <View style={[heroStyles.manageCard, { transform: [{ translateY: -20 }] }]}>
        <View style={heroStyles.manageSearch}>
          <Svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <Circle cx="7" cy="7" r="5.2" stroke="#9AA7BC" strokeWidth="1.6"/>
            <Path d="M11 11l3.2 3.2" stroke="#9AA7BC" strokeWidth="1.6" strokeLinecap="round"/>
          </Svg>
          <View style={heroStyles.manageSearchLine} />
        </View>
        {MG_ROWS.map((r, i) => (
          <View key={i} style={[heroStyles.manageRow, i < MG_ROWS.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#EEF2F7' }]}>
            <View style={[heroStyles.manageIconBox, { backgroundColor: r.iconBg }]}>
              <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <Path d="M4 1.5h5L13 5.5V14a.5.5 0 0 1-.5.5h-8A.5.5 0 0 1 4 14V2a.5.5 0 0 1 .5-.5Z" stroke={r.iconStroke} strokeWidth="1.3"/>
                <Path d="M9 1.5V5.5H13" stroke={r.iconStroke} strokeWidth="1.3" strokeLinejoin="round"/>
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <View style={[heroStyles.manageRowLine1, { width: r.w1 as DimensionValue }]} />
              <View style={[heroStyles.manageRowLine2, { width: r.w2 as DimensionValue }]} />
            </View>
            <View style={[heroStyles.manageTag, { backgroundColor: r.tagBg }]}>
              <Text style={[heroStyles.manageTagText, { color: r.tagFg }]}>{r.tag}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function SignHero() {
  return (
    <View style={heroStyles.centerWrapper}>
      <View style={{ transform: [{ translateY: -20 }] }}>
        <View style={[heroStyles.signLayer1, { transform: [{ rotate: '5deg' }] }]} />
        <View style={[heroStyles.signTopLayer, { transform: [{ rotate: '-3deg' }] }]}>
          <View style={[heroStyles.signLine, { width: '60%', height: 7, backgroundColor: '#C7D3E4', marginBottom: 12 }]} />
          <View style={[heroStyles.signLine, { width: '92%' }]} />
          <View style={[heroStyles.signLine, { width: '84%' }]} />
          <View style={[heroStyles.signLine, { width: '90%', marginBottom: 22 }]} />
          
          <Text style={heroStyles.signKickerText}>SIGNATURE</Text>
          <Svg width="130" height="34" viewBox="0 0 118 30" fill="none">
            <Path d="M3 21c7-13 12-16 15-9s4 15 8 12 5-18 9-16 3 17 8 15 8-16 13-13 6 12 11 9 9-11 14-6 10 5 18 2" stroke="#1D3358" strokeWidth="2.6" strokeLinecap="round"/>
          </Svg>
          <View style={heroStyles.signBaseline} />
        </View>
        
        <View style={[heroStyles.signBadge, { transform: [{ rotate: '-8deg' }] }]}>
          <Svg width="26" height="20" viewBox="0 0 26 20" fill="none">
            <Path d="M2 11l7 7L24 2" stroke="#14213D" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"/>
          </Svg>
        </View>
      </View>
    </View>
  );
}

function OnboardHero({ kind }: { kind: string }) {
  if (kind === 'scan') return <ScanHero />;
  if (kind === 'manage') return <ManageHero />;
  return <SignHero />;
}

function HeroBadge({ kind, label }: { kind: string, label: string }) {
  const Icon = () => {
    if (kind === 'scan') return (
      <Svg width="13" height="13" viewBox="0 0 14 14" fill="none">
        <Rect x="1" y="3" width="12" height="9" rx="1.6" stroke="#14213D" strokeWidth="1.4"/>
        <Path d="M4.5 3 5.4 1.4h3.2L9.5 3" stroke="#14213D" strokeWidth="1.4" strokeLinejoin="round"/>
        <Circle cx="7" cy="7.4" r="2.2" stroke="#14213D" strokeWidth="1.4"/>
      </Svg>
    );
    if (kind === 'sign') return (
      <Svg width="12" height="10" viewBox="0 0 11 9" fill="none">
        <Path d="M1 4.5 4 8l6-7" stroke="#14213D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    );
    return (
      <Svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <Path d="M1.5 4.5A1.5 1.5 0 0 1 3 3h3l1.4 1.6H13A1.5 1.5 0 0 1 14.5 6v6A1.5 1.5 0 0 1 13 13.5H3A1.5 1.5 0 0 1 1.5 12V4.5Z" stroke="#14213D" strokeWidth="1.4"/>
      </Svg>
    );
  };

  return (
    <View style={styles.badgeContainer}>
      <Icon />
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const sl = SLIDES[step];
  const lastStep = step === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cardContainer}>
        <LinearGradient
          colors={['#1D3358', '#0E1D34']}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Simplified Background patterns using Views/Gradients */}
        <View style={styles.patternLayer}>
          {/* We use basic SVG for the radial dots to approximate the design */}
        </View>
        
        <OnboardHero kind={sl.kind} />
        
        <LinearGradient
          colors={['transparent', 'rgba(8,16,30,0.14)', 'rgba(8,16,30,0.58)', 'rgba(8,16,30,0.94)']}
          locations={[0.16, 0.38, 0.66, 1]}
          style={styles.scrim}
        />
        
        <HeroBadge kind={sl.kind} label={sl.badge} />
        
        <View style={styles.heroTextContent}>
          <Text style={styles.kicker}>{sl.kicker}</Text>
          <Text style={styles.title}>{sl.title}</Text>
        </View>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.progressRow}>
          {[0, 1, 2].map((i) => (
            <View 
              key={i} 
              style={[styles.dot, i === step ? styles.dotActive : null]} 
            />
          ))}
        </View>
        
        {lastStep ? (
          <View style={styles.actionCol}>
            <Pressable style={styles.primaryBtn} onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.primaryBtnText}>Create account</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.secondaryBtnText}>I already have an account</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.actionRow}>
            <Pressable onPress={() => setStep(SLIDES.length - 1)} style={styles.skipBtn} hitSlop={10}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
            <Pressable style={styles.continueBtn} onPress={() => setStep(Math.min(step + 1, SLIDES.length - 1))}>
              <Text style={styles.continueText}>Continue</Text>
              <Svg width="17" height="14" viewBox="0 0 17 14" fill="none">
                <Path d="M1 7h14M10 2l5 5-5 5" stroke={T.colors.navyInk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </Svg>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.colors.white },
  cardContainer: { flex: 1, marginHorizontal: 16, marginTop: 4, borderRadius: 28, overflow: 'hidden', position: 'relative' },
  patternLayer: { position: 'absolute', inset: 0, opacity: 0.1, backgroundColor: 'rgba(248,209,45,0.05)' },
  scrim: { position: 'absolute', inset: 0, zIndex: 1 },
  badgeContainer: { position: 'absolute', top: 18, right: 18, zIndex: 3, backgroundColor: T.colors.yellow, paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6, shadowColor: '#060E1C', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 18, elevation: 5 },
  badgeText: { fontFamily: T.fonts.jakarta.bold, fontSize: 11, color: T.colors.navyInk },
  heroTextContent: { position: 'absolute', bottom: 26, left: 26, right: 26, zIndex: 2 },
  kicker: { fontFamily: T.fonts.jakarta.bold, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: T.colors.yellow, marginBottom: 11 },
  title: { fontFamily: T.fonts.sora.semiBold, fontSize: 29, lineHeight: 34, color: '#F8FAFD', letterSpacing: -0.5, textShadowColor: 'rgba(6,14,28,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 18 },
  footer: { paddingHorizontal: 26, paddingTop: 22, paddingBottom: 26 },
  progressRow: { flexDirection: 'row', gap: 7, marginBottom: 22 },
  dot: { height: 4, width: 7, borderRadius: 3, backgroundColor: '#E1E7F0' },
  dotActive: { width: 26, backgroundColor: T.colors.yellow },
  actionCol: { gap: 11 },
  primaryBtn: { height: 56, borderRadius: 16, backgroundColor: T.colors.yellow, alignItems: 'center', justifyContent: 'center', shadowColor: '#F8D12D', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.34, shadowRadius: 22, elevation: 5 },
  primaryBtnText: { fontFamily: T.fonts.jakarta.bold, fontSize: 16, color: T.colors.navyInk },
  secondaryBtn: { height: 56, borderWidth: 1, borderColor: T.colors.border, borderRadius: 16, backgroundColor: T.colors.white, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { fontFamily: T.fonts.jakarta.semiBold, fontSize: 16, color: T.colors.ink },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skipBtn: { padding: 10 },
  skipText: { fontFamily: T.fonts.jakarta.semiBold, fontSize: 15, color: T.colors.inkSoft },
  continueBtn: { height: 56, paddingHorizontal: 30, borderRadius: 16, backgroundColor: T.colors.yellow, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#F8D12D', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.34, shadowRadius: 22, elevation: 5 },
  continueText: { fontFamily: T.fonts.jakarta.bold, fontSize: 16, color: T.colors.navyInk },
});

const heroStyles = StyleSheet.create({
  centerWrapper: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', zIndex: 0 },
  
  // Scan
  scanLayer1: { position: 'absolute', top: 14, left: -30, width: 150, height: 196, backgroundColor: '#294a76', borderRadius: 13 },
  scanLayer2: { position: 'absolute', top: 8, left: -14, width: 158, height: 200, backgroundColor: '#34588a', borderRadius: 13 },
  scanTopLayer: { position: 'relative', width: 176, backgroundColor: '#FBFCFE', borderRadius: 13, paddingHorizontal: 22, paddingVertical: 24, shadowColor: '#060E1C', shadowOffset: { width: 0, height: 28 }, shadowOpacity: 0.6, shadowRadius: 54, elevation: 10 },
  scanLine: { borderRadius: 3 },
  bracket: { position: 'absolute', width: 30, height: 30, borderColor: '#F8D12D', zIndex: 2 },
  scanLaser: { position: 'absolute', left: -10, right: -10, top: '46%', height: 3, backgroundColor: '#F8D12D', shadowColor: '#F8D12D', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 16, elevation: 8, zIndex: 3 },
  
  // Manage
  manageCard: { width: 236, backgroundColor: '#FBFCFE', borderRadius: 16, padding: 16, shadowColor: '#060E1C', shadowOffset: { width: 0, height: 28 }, shadowOpacity: 0.6, shadowRadius: 54, elevation: 10 },
  manageSearch: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 34, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#EEF3F9', marginBottom: 14 },
  manageSearchLine: { height: 5, width: '44%', borderRadius: 3, backgroundColor: '#CFD8E5' },
  manageRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10, paddingHorizontal: 4 },
  manageIconBox: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  manageRowLine1: { height: 6, borderRadius: 3, backgroundColor: '#CFD8E5', marginBottom: 6 },
  manageRowLine2: { height: 5, borderRadius: 3, backgroundColor: '#E7ECF3' },
  manageTag: { height: 18, paddingHorizontal: 9, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  manageTagText: { fontFamily: T.fonts.jakarta.bold, fontSize: 8.5 },
  
  // Sign
  signLayer1: { position: 'absolute', top: 10, left: -18, width: 160, height: 204, backgroundColor: '#34588a', borderRadius: 13 },
  signTopLayer: { position: 'relative', width: 180, backgroundColor: '#FBFCFE', borderRadius: 13, paddingTop: 22, paddingHorizontal: 20, paddingBottom: 24, shadowColor: '#060E1C', shadowOffset: { width: 0, height: 28 }, shadowOpacity: 0.6, shadowRadius: 54, elevation: 10 },
  signLine: { height: 6, borderRadius: 3, backgroundColor: '#E7ECF3', marginBottom: 10 },
  signKickerText: { fontFamily: T.fonts.jakarta.bold, fontSize: 8, letterSpacing: 1, color: '#9AA7BC', marginBottom: 6 },
  signBaseline: { height: 1.5, backgroundColor: '#C9D3E0', marginTop: 3 },
  signBadge: { position: 'absolute', bottom: -16, right: -18, width: 58, height: 58, borderRadius: 29, backgroundColor: '#F8D12D', alignItems: 'center', justifyContent: 'center', shadowColor: '#060E1C', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 26, elevation: 8, borderWidth: 2.5, borderStyle: 'dashed', borderColor: 'rgba(20,33,61,0.35)' },
});
