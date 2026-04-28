import React from 'react';
import { StyleSheet, View, Image } from 'react-native';

interface LogoProps {
  size?: number;
}

export const Logo = ({ size = 24 }: LogoProps) => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/logo_main.jpg')}
        style={{ width: size * 6, height: size * 2.4 }}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
