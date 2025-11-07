import React, { useRef, useEffect } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { colors } from '../theme';

export const RudrakshaSpinner = ({ size = 56 }: { size?: number }) => {
  const rotate = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const beads = Array.from({ length: 12 });
  const r = size / 2;

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        transform: [
          { rotate: rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
        ],
      }}
    >
      {beads.map((_, i) => {
        const angle = (i * 2 * Math.PI) / beads.length;
        const x = r + (r - 6) * Math.cos(angle) - 6;
        const y = r + (r - 6) * Math.sin(angle) - 6;
        return <View key={i} style={[styles.bead, { left: x, top: y }]} />;
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bead: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.brand.rudraksha,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
});
