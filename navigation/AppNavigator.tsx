import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AlbumDetailScreen from '../components/AlbumDetailScreen';
import ArtistProfileScreen from '../components/ArtistProfileScreen';
import AuthPreviewScreen from '../components/AuthPreviewScreen';
import ChatScreen from '../components/ChatScreen';
import FeedScreen from '../components/FeedScreen';
import InboxScreen from '../components/InboxScreen';
import LegalCenterScreen from '../components/LegalCenterScreen';
import LegalDocumentScreen from '../components/LegalDocumentScreen';
import ListDetailScreen from '../components/ListDetailScreen';
import ListsScreen from '../components/ListsScreen';
import NotificationsCenterScreen from '../components/NotificationsCenterScreen';
import PlansScreen from '../components/PlansScreen';
import PrivacyCenterScreen from '../components/PrivacyCenterScreen';
import ProfileScreen from '../components/ProfileScreen';
import ProductFoundationScreen from '../components/ProductFoundationScreen';
import SearchScreen from '../components/SearchScreen';
import SecurityCenterScreen from '../components/SecurityCenterScreen';
import TabBar from '../components/TabBar';
import { getLegalDocumentById } from '../data/legalDocuments';
import { colors } from '../theme/bsideTheme';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.background },
};

function MainTabs({ app }) {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}>
      <Tab.Screen name="FeedTab">
        {({ navigation }) => (
          <FeedScreen
            reviews={app.feedReviews}
            currentUserHandle={`@${app.currentUser.handle}`}
            currentTrack={app.currentTrack}
            friendActivity={app.friendActivity}
            hasUnreadMessages={app.hasUnreadMessages}
            hasUnreadNotifications={app.hasUnreadNotifications}
            onDeleteReview={app.deleteReview}
            onViewProfile={(userHandle) => {
              if (app.isCurrentUserHandle(userHandle)) {
                navigation.navigate('ProfileTab');
                return;
              }

              navigation.getParent()?.navigate('UserProfile', { userHandle });
            }}
            onToggleScratch={app.toggleScratch}
            onToggleLikeReview={app.toggleReviewLike}
            onAddReviewComment={app.addReviewComment}
            onOpenInbox={() => navigation.getParent()?.navigate('Inbox')}
            onOpenReviewWhileListening={app.openReviewWhileListening}
            onSelectAlbum={(album) =>
              navigation.getParent()?.navigate('AlbumDetail', { album })
            }
            onOpenNotifications={() => {
              app.markNotificationsAsRead();
              navigation.getParent()?.navigate('Notifications');
            }}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="SearchTab">
        {({ navigation }) => (
          <SearchScreen
            interestingAlbums={app.interestingAlbums}
            interestingArtists={app.interestingArtists}
            oracleRecommendations={app.oracleRecommendations}
            oracleSource={app.oracleSource}
            oracleMessage={app.oracleMessage}
            isOracleBusy={app.isOracleBusy}
            hasFloatingPlayer={Boolean(app.currentTrack)}
            onSelectAlbum={(album) =>
              navigation.getParent()?.navigate('AlbumDetail', { album })
            }
            onPlaySong={app.playTrack}
            onRunOracle={app.runMusicOracle}
            onOpenArtist={(artist) =>
              navigation.getParent()?.navigate('ArtistProfile', artist)
            }
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="ListsTab">
        {({ navigation }) => (
          <ListsScreen
            lists={app.lists}
            wishlist={app.wishlistList}
            onOpenList={(list) =>
              navigation.getParent()?.navigate('ListDetail', {
                listId: list.id,
              })
            }
            onOpenWishlist={() =>
              navigation.getParent()?.navigate('ListDetail', {
                listId: 'wishlist',
              })
            }
            onCreateList={app.openCreateListModal}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="ProfileTab">
        {({ navigation }) => (
          <ProfileScreen
            user={app.currentUser}
            reviews={app.visibleReviews}
            top5={app.top5}
            currentTrack={app.currentTrack}
            preferences={app.preferences}
            onPlaySong={app.playTrack}
            onDeleteReview={app.deleteReview}
            onEditReview={app.openEditReview}
            onShareProfile={app.openShareProfile}
            onOpenStory={app.openStoryCard}
            onOpenFoundation={() =>
              navigation.getParent()?.navigate('ProductFoundation')
            }
            onOpenPrivacy={() => navigation.getParent()?.navigate('PrivacyCenter')}
            onSaveProfile={app.saveProfile}
            onSignOut={app.signOutBackendAccount}
            sessionMode={app.preferences.sessionMode}
            isProfileSaving={app.isProfileSaving}
            followersCount={app.currentUser.followersCount}
            followingCount={app.currentUser.followingCount}
            listeningStreak={app.listeningStreak}
            recentListening={app.recentListening}
            achievementSummary={app.achievementSummary}
            onOpenReviewWhileListening={app.openReviewWhileListening}
            interestingUsers={app.interestingUsers}
            onViewSuggestedProfile={(userHandle) => {
              if (app.isCurrentUserHandle(userHandle)) {
                navigation.navigate('ProfileTab');
                return;
              }

              navigation.getParent()?.navigate('UserProfile', { userHandle });
            }}
            isPublic={false}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function AppNavigator({ app }) {
  return (
    <RootStack.Navigator screenOptions={screenOptions}>
      <RootStack.Screen name="MainTabs">
        {() => <MainTabs app={app} />}
      </RootStack.Screen>

      <RootStack.Screen name="AlbumDetail">
        {({ route, navigation }) => (
          <AlbumDetailScreen
            album={route.params.album}
            isPinned={app.top5.some((item) => item.id === route.params.album.id)}
            isSavedForLater={app.isAlbumInWishlist(route.params.album)}
            onClose={() => navigation.goBack()}
            onPinToTop5={() => app.pinToTop5(route.params.album)}
            onWriteReview={() => app.openCreateReview(route.params.album)}
            onAddToList={() => app.openAddToList(route.params.album)}
            onSaveForLater={() => app.addAlbumToWishlist(route.params.album)}
            onPlaySong={app.playTrack}
            onShareAlbum={(album) =>
              app.handleShareAlbum(album, () => navigation.goBack())
            }
            onOpenArtist={(artist) =>
              navigation.navigate('ArtistProfile', {
                artistName: artist.artist,
                artistId: artist.artistId,
                artistUrl: artist.artistUrl,
                source: artist.source,
              })
            }
          />
        )}
      </RootStack.Screen>

      <RootStack.Screen name="ArtistProfile">
        {({ route, navigation }) => (
          <ArtistProfileScreen
            artistName={route.params.artistName || route.params.artist}
            artistId={route.params.artistId}
            artistUrl={route.params.artistUrl}
            artistSnapshot={app.getArtistSnapshot(
              route.params.artistName || route.params.artist
            )}
            onBack={() => navigation.goBack()}
            onSelectAlbum={(album) => navigation.navigate('AlbumDetail', { album })}
            onPlaySong={app.playTrack}
            onOpenArtist={(artist) =>
              navigation.replace('ArtistProfile', {
                artistName: artist.artist,
                artistId: artist.artistId,
                artistUrl: artist.artistUrl,
                source: artist.source,
              })
            }
            onViewProfile={(userHandle) => {
              if (app.isCurrentUserHandle(userHandle)) {
                navigation.navigate('MainTabs', { screen: 'ProfileTab' });
                return;
              }

              navigation.navigate('UserProfile', { userHandle });
            }}
          />
        )}
      </RootStack.Screen>

      <RootStack.Screen name="ListDetail">
        {({ route, navigation }) => (
          <ListDetailScreen
            list={app.getListById(route.params.listId)}
            onClose={() => navigation.goBack()}
            onNavigateToSearch={() =>
              navigation.navigate('MainTabs', { screen: 'SearchTab' })
            }
            onPlaySong={app.playTrack}
            onUpdateListOrder={app.updateListOrder}
            onRemoveItem={app.removeListItem}
            onShuffleList={app.shuffleList}
            onToggleVisibility={app.toggleListVisibility}
            onExportToSpotify={app.exportListToSpotify}
            isSpotifyConnected={Boolean(app.spotifySession?.accessToken)}
            isSpotifyExportBusy={app.isSpotifyExportBusy}
          />
        )}
      </RootStack.Screen>

      <RootStack.Screen name="Inbox">
        {({ navigation }) => (
          <InboxScreen
            chats={app.visibleChats}
            onClose={() => navigation.goBack()}
            onOpenChat={(chat) => {
              app.markChatAsRead(chat.id);
              navigation.navigate('Chat', { chatId: chat.id });
            }}
          />
        )}
      </RootStack.Screen>

      <RootStack.Screen name="Chat">
        {({ route, navigation }) => (
          <ChatScreen
            chat={app.getChatById(route.params.chatId)}
            onSendMessage={app.sendChatMessage}
            onUpdateTheme={app.updateChatTheme}
            onOpenAlbum={(album) =>
              navigation.navigate('AlbumDetail', { album })
            }
            onOpenProfile={(userHandle) => {
              if (app.isCurrentUserHandle(userHandle)) {
                navigation.navigate('MainTabs', { screen: 'ProfileTab' });
                return;
              }

              navigation.navigate('UserProfile', { userHandle });
            }}
            onClose={() => navigation.goBack()}
          />
        )}
      </RootStack.Screen>

      <RootStack.Screen name="Notifications">
        {({ navigation }) => (
          <NotificationsCenterScreen
            notifications={app.notifications}
            onBack={() => navigation.goBack()}
            onMarkAllRead={app.markNotificationsAsRead}
            onDismiss={app.dismissNotification}
          />
        )}
      </RootStack.Screen>

      <RootStack.Screen name="UserProfile">
        {({ route, navigation }) => {
          const viewedUser = app.getUserByHandle(route.params.userHandle);

          return (
            <ProfileScreen
              user={viewedUser}
              reviews={app.visibleReviews}
              top5={viewedUser?.top5 || []}
              currentTrack={app.currentTrack}
              preferences={app.preferences}
              onPlaySong={app.playTrack}
              onDeleteReview={app.deleteReview}
              onEditReview={app.openEditReview}
              onShareProfile={app.openShareProfile}
              onOpenStory={app.openStoryCard}
              onOpenFoundation={() => navigation.navigate('ProductFoundation')}
              onOpenPrivacy={() => navigation.navigate('PrivacyCenter')}
              onSaveProfile={app.saveProfile}
              onToggleFollow={app.toggleFollowUser}
              onBlockUser={app.blockUser}
              onUnblockUser={app.unblockUser}
              onReportUser={app.reportUser}
              onBack={() => navigation.goBack()}
              sessionMode={app.preferences.sessionMode}
              isProfileSaving={app.isProfileSaving}
              isFollowing={app.isFollowingHandle(route.params.userHandle)}
              isBlocked={app.isBlockedHandle(route.params.userHandle)}
              followersCount={viewedUser?.followersCount || 0}
              followingCount={viewedUser?.followingCount || 0}
              listeningStreak={app.listeningStreak}
              recentListening={[]}
              achievementSummary={null}
              onOpenReviewWhileListening={app.openReviewWhileListening}
              interestingUsers={app.interestingUsers}
              profileCompatibility={app.getCompatibilityForHandle(
                route.params.userHandle
              )}
              onViewSuggestedProfile={(userHandle) => {
                if (app.isCurrentUserHandle(userHandle)) {
                  navigation.navigate('MainTabs', { screen: 'ProfileTab' });
                  return;
                }

                navigation.replace('UserProfile', { userHandle });
              }}
              isPublic={true}
            />
          );
        }}
      </RootStack.Screen>

      <RootStack.Screen name="ProductFoundation">
        {({ navigation }) => (
          <ProductFoundationScreen
            currentUser={app.currentUser}
            preferences={app.preferences}
            notifications={app.notifications}
            spotifySession={app.spotifySession}
            spotifyStatus={app.spotifyStatus}
            spotifyPlaybackStatus={app.spotifyPlaybackStatus}
            musicOracleStatus={app.musicOracleStatus}
            achievementSummary={app.achievementSummary}
            pushSupportStatus={app.pushSupportStatus}
            pushPermissionStatus={app.pushPermissionStatus}
            onBack={() => navigation.goBack()}
            onResetExperience={() => {
              navigation.goBack();
              app.restartExperience();
            }}
            onUpdatePreferences={app.updatePreferences}
            onOpenAuth={() => navigation.navigate('AuthPreview')}
            onOpenSecurity={() => navigation.navigate('SecurityCenter')}
            onOpenLegal={() => navigation.navigate('LegalCenter')}
            onOpenPlans={() => navigation.navigate('Plans')}
            onConnectSpotify={app.connectSpotifyAccount}
          />
        )}
      </RootStack.Screen>

      <RootStack.Screen name="AuthPreview">
        {({ navigation }) => (
          <AuthPreviewScreen
            currentUser={app.currentUser}
            preferences={app.preferences}
            authSession={app.authSession}
            authMessage={app.authMessage}
            isAuthBusy={app.isAuthBusy}
            onBack={() => navigation.goBack()}
            onSave={app.saveAuthPreview}
            onRegisterRealAccount={app.registerRealAccount}
            onSignInRealAccount={app.signInRealAccount}
            onSendMagicLink={app.sendMagicLinkAccess}
            onSignOut={app.signOutBackendAccount}
            onSyncSession={app.refreshAuthenticatedUser}
          />
        )}
      </RootStack.Screen>

      <RootStack.Screen name="SecurityCenter">
        {({ navigation }) => (
          <SecurityCenterScreen
            preferences={app.preferences}
            onBack={() => navigation.goBack()}
            onUpdatePreferences={app.updatePreferences}
          />
        )}
      </RootStack.Screen>

      <RootStack.Screen name="PrivacyCenter">
        {({ navigation }) => (
          <PrivacyCenterScreen
            preferences={app.preferences}
            onBack={() => navigation.goBack()}
            onUpdatePreferences={app.updatePreferences}
          />
        )}
      </RootStack.Screen>

      <RootStack.Screen name="LegalCenter">
        {({ navigation }) => (
          <LegalCenterScreen
            onBack={() => navigation.goBack()}
            onOpenDocument={(documentId) =>
              navigation.navigate('LegalDocument', { documentId })
            }
          />
        )}
      </RootStack.Screen>

      <RootStack.Screen name="LegalDocument">
        {({ route, navigation }) => (
          <LegalDocumentScreen
            document={getLegalDocumentById(route.params.documentId)}
            onBack={() => navigation.goBack()}
          />
        )}
      </RootStack.Screen>

      <RootStack.Screen name="Plans">
        {({ navigation }) => (
          <PlansScreen
            currentPlan={app.currentUser.plan}
            onBack={() => navigation.goBack()}
            onSelectPlan={app.setFreemiumPlan}
          />
        )}
      </RootStack.Screen>
    </RootStack.Navigator>
  );
}
