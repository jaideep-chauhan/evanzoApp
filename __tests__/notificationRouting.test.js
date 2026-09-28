/**
 * Where does tapping each notification go?
 *
 * Payloads mirror what the backend sends (evanzo-BE notification.service.js):
 * - "push":  the FCM data map — every value is a string, action_data is a
 *            JSON string, and the custom `data` fields are spread at the top.
 * - "inbox": a notifications row from GET /notifications (data/action_data
 *            are JSON strings, possibly double-encoded).
 */
jest.mock('@react-native-firebase/messaging', () => () => ({}));
jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {},
  AndroidImportance: {HIGH: 4, DEFAULT: 3},
  AndroidStyle: {MESSAGING: 1},
  EventType: {PRESS: 1},
}));
jest.mock('@react-native-async-storage/async-storage', () => ({}));
jest.mock('../src/services/api', () => ({}));
jest.mock('../src/services/navigationService', () => ({navigationRef: {current: null}}));
jest.mock('../src/utils/secureStorage', () => ({secureStorage: {}}));

const notificationService = require('../src/services/notificationService').default;
// Push data is all strings, inbox rows keep numbers — screens accept either,
// so compare ids as strings.
const route = (n) => {
  const r = notificationService.getNotificationRoute(n);
  return r.params
    ? {...r, params: Object.fromEntries(Object.entries(r.params).map(([k, v]) => [k, typeof v === 'number' ? String(v) : v]))}
    : r;
};

// FCM data map as built by createNotification (values stringified).
const push = (type, actionType, data, actionData = data) => ({
  notification_id: '1',
  type,
  action_type: actionType,
  action_data: JSON.stringify(actionData),
  created_at: '0',
  ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
});

// Inbox row: data/action_data stored as (double-encoded) JSON strings.
const inbox = (type, actionType, data, actionData = data) => ({
  notification_id: 1,
  type,
  action_type: actionType,
  title: 'x',
  data: JSON.stringify(data),
  action_data: JSON.stringify(actionData),
});

describe.each([
  ['push', push],
  ['inbox', inbox],
])('%s notification', (_, make) => {
  test('new chat message opens that chat with the sender', () => {
    expect(
      route(make('message', 'open_chat', {chat_id: 12, sender_id: 66, sender_name: 'Aditya'}, {chat_id: 12})),
    ).toEqual({
      name: 'ChatScreen',
      params: {chatId: '12', chatName: 'Aditya', recipientId: '66'},
    });
  });

  test('new gig opportunity opens the gig', () => {
    expect(route(make('event_reminder', 'view_event_ad', {event_ad_id: 7}))).toEqual({
      name: 'EventDetailView',
      params: {eventId: '7'},
    });
  });

  test('response to my gig ad opens the gig', () => {
    expect(
      route(make('ad_response', 'view_response', {event_ad_id: 7, response_id: 3})),
    ).toEqual({name: 'EventDetailView', params: {eventId: '7'}});
  });

  test('inquiry on my vendor ad opens the ad', () => {
    expect(route(make('ad_response', 'view_inquiry', {vendor_ad_id: 5}))).toEqual({
      name: 'VendorAddDetail',
      params: {vendorId: '5'},
    });
  });

  test('new review opens my own profile on the Reviews tab', () => {
    notificationService.setCurrentUserId('42');
    expect(route(make('review', 'view_review', {review_id: 9, rating: 5}, {review_id: 9, vendor_ad_id: 5}))).toEqual({
      name: 'UserProfile',
      params: {userId: '42', initialTab: 'reviews'},
    });
    // Old notifications only carry review_id — same destination.
    expect(route(make('review', 'view_review', {review_id: 9}))).toEqual({
      name: 'UserProfile',
      params: {userId: '42', initialTab: 'reviews'},
    });
    notificationService.setCurrentUserId(null);
  });

  test('review while signed-out state is unknown falls back to the ad / Profile', () => {
    expect(
      route(make('review', 'view_review', {review_id: 9, rating: 5}, {review_id: 9, vendor_ad_id: 5})),
    ).toEqual({name: 'VendorAddDetail', params: {vendorId: '5'}});
    expect(route(make('review', 'view_review', {review_id: 9}))).toEqual({
      name: 'Main',
      params: {screen: 'Profile'},
    });
  });

  test('vendor ad approved opens the ad', () => {
    expect(route(make('system', 'ad_approved', {vendor_ad_id: 5}))).toEqual({
      name: 'VendorAddDetail',
      params: {vendorId: '5'},
    });
  });

  test('gig ad approved opens the gig', () => {
    expect(route(make('system', 'ad_approved', {event_ad_id: 7}))).toEqual({
      name: 'EventDetailView',
      params: {eventId: '7'},
    });
  });

  test('ad rejected opens Profile', () => {
    expect(route(make('system', 'ad_rejected', {vendor_ad_id: 5}))).toEqual({
      name: 'Main',
      params: {screen: 'Profile'},
    });
  });

  test('gig tomorrow reminder opens the gig', () => {
    expect(route(make('event_reminder', 'gig_date_reminder', {event_ad_id: 7}))).toEqual({
      name: 'EventDetailView',
      params: {eventId: '7'},
    });
  });

  test('gig date passed opens Profile', () => {
    expect(route(make('event_reminder', 'gig_expired', {event_ad_id: 7}))).toEqual({
      name: 'Main',
      params: {screen: 'Profile'},
    });
  });

  test('message about an ad still opens the chat', () => {
    expect(
      route(make('message', 'open_chat', {chat_id: 12, sender_id: 66, sender_name: 'A', ad_title: 'Baby Bump Photography'}, {chat_id: 12})),
    ).toEqual({name: 'ChatScreen', params: {chatId: '12', chatName: 'A', recipientId: '66'}});
  });

  test('login alert opens Login History', () => {
    expect(route(make('system', 'login_alert', {device: 'Pixel'}, {}))).toEqual({name: 'LoginHistory'});
  });

  test('support ticket opens Help & Support', () => {
    expect(route(make('system', 'new_support_ticket', {ticketId: 1}, {}))).toEqual({name: 'HelpSupport'});
  });

  test('plain system/promotion notification opens the inbox', () => {
    expect(route(make('system', '', {}))).toEqual({name: 'NotificationInbox'});
    expect(route(make('promotion', 'open_offer', {}))).toEqual({name: 'NotificationInbox'});
  });
});
