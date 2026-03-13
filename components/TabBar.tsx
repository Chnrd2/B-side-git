import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Home, ListMusic, Search, User } from 'lucide-react-native';

import { colors } from '../theme/bsideTheme';

const TAB_CONFIG = {
  FeedTab: { icon: Home },
  SearchTab: { icon: Search },
  ListsTab: { icon: ListMusic },
  ProfileTab: { icon: User },
};

const TabBar = ({ state, navigation }) => {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const isActive = state.index === index;
        const tabConfig = TAB_CONFIG[route.name];

        if (!tabConfig) return null;

        const Icon = tabConfig.icon;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={styles.tab}>
            <Icon
              color={isActive ? colors.primary : '#555'}
              size={isActive ? 28 : 24}
            />
            {isActive && <View style={styles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 85 : 80,
    backgroundColor: 'rgba(10, 10, 10, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 20 : 15,
    zIndex: 9999,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 4,
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 10 : 12,
  },
});

export default TabBar;
