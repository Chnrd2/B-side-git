import 'react-native-gesture-handler';

import React from 'react';
import {
  ActivityIndicator,
  Animated,
  LogBox,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

import AddToListModal from './components/AddToListModal';
import AppBackground from './components/AppBackground';
import CreateListModal from './components/CreateListModal';
import CreateReviewScreen from './components/CreateReviewScreen';
import MiniPlayer from './components/MiniPlayer';
import OnboardingScreen from './components/OnboardingScreen';
import RecommendAlbumModal from './components/RecommendAlbumModal';
import ShareReviewCard from './components/ShareReviewCard';
import ShareStoryCard from './components/ShareStoryCard';
import useBSideApp from './hooks/useBSideApp';
import AppNavigator from './navigation/AppNavigator';
import { navigationTheme } from './theme/bsideTheme';

LogBox.ignoreLogs(['expo-notifications: Android Push notifications']);

export default function App() {
  const app = useBSideApp();

  if (app.isLoading) {
    return (
      <View style={styles.splashContainer}>
        <Animated.View style={[styles.splashBadge, { opacity: app.fadeAnim }]}>
          <Text style={styles.splashBadgeText}>B-SIDE</Text>
        </Animated.View>
        <Text style={styles.splashTitle}>Preparando tu lado B</Text>
        <Text style={styles.splashSubtitle}>
          Cargando perfil, listas, actividad y tu última sesión.
        </Text>
        <ActivityIndicator color="#A855F7" size="large" style={styles.splashSpinner} />
      </View>
    );
  }

  if (!app.preferences.hasCompletedOnboarding) {
    return (
      <SafeAreaView style={styles.mainContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#050816" />
        <OnboardingScreen onContinue={() => app.completeOnboarding('guest')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#050816" />

      <NavigationContainer theme={navigationTheme}>
        <View style={styles.mainContainer}>
          <AppBackground user={app.currentUser} />

          <AppNavigator app={app} />

          <MiniPlayer
            currentTrack={app.currentTrack}
            onClose={app.closeTrack}
            onOpenReview={app.openReviewWhileListening}
          />

          <AddToListModal
            visible={Boolean(app.listModalAlbum)}
            lists={app.lists}
            onClose={app.closeAddToList}
            onSelect={app.addAlbumToList}
          />

          <CreateListModal
            visible={app.isCreateListVisible}
            onClose={app.closeCreateListModal}
            onSubmit={app.createList}
            defaultIsPublic={!app.preferences.privateListsByDefault}
          />

          <RecommendAlbumModal
            visible={Boolean(app.recommendedAlbum)}
            album={app.recommendedAlbum}
            chats={app.visibleChats}
            onClose={app.closeRecommendAlbum}
            onSubmit={app.recommendAlbumToFriend}
          />

          <CreateReviewScreen
            visible={app.isCreatingReview}
            initialAlbum={
              app.editingReview
                ? {
                    title: app.editingReview.albumTitle,
                    cover: app.editingReview.cover,
                  }
                : app.reviewAlbum
            }
            initialText={app.editingReview?.text}
            initialRating={app.editingReview?.rating}
            contextType={app.reviewContext?.origin}
            onCancel={app.closeReviewModal}
            onPublish={app.publishReview}
          />

          <ShareReviewCard
            key={[
              app.currentUser.name,
              app.currentUser.avatarUrl,
              app.currentUser.wallpaperUrl,
              app.shareReview.album,
              app.shareReview.text,
            ].join('-')}
            visible={app.isShareVisible}
            onClose={app.closeShareProfile}
            review={app.shareReview}
            user={app.currentUser}
          />

          <ShareStoryCard
            key={[
              app.currentUser.handle,
              app.currentUser.wallpaperUrl,
              ...app.top5.map((album) => album.id),
            ].join('-')}
            visible={app.isStoryVisible}
            onClose={app.closeStoryCard}
            albums={app.top5}
            username={app.currentUser.handle}
            user={app.currentUser}
          />
        </View>
      </NavigationContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#050816' },
  splashContainer: {
    flex: 1,
    backgroundColor: '#050816',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  splashBadge: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(138, 43, 226, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.36)',
  },
  splashBadgeText: {
    color: '#F3E8FF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 3,
  },
  splashTitle: {
    marginTop: 28,
    color: 'white',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  splashSubtitle: {
    marginTop: 10,
    color: '#9CA3AF',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  splashSpinner: {
    marginTop: 24,
  },
});
