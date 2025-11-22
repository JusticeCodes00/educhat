import PubSub from "pubsub-js";
import {
    USER_AUTHENTICATED,
    UPDATED_ACTIVE_TAB,
    UPDATED_SELECTED_BOOK,
    UPDATED_SELECTED_CHAT,
    UPDATED_CONTACTS,
    UPDATED_CHATS,
    UPDATED_ONLINE_USERS,
    UPDATED_UNREAD_MESSAGES,
    UPDATED_BOOKS,
    UPDATED_GROUPS,
    UPDATED_SELECTED_GROUP,
    UPDATED_NOTIFICATIONS,
    UPDATED_NOTIFICATION_COUNT
} from "../utils/topics.js";

const appStore = {
    state: {
        authUser: null,
        activeTab: "chats",
        selectedChat: null,
        chats: [],
        contacts: [],
        selectedBook: null,
        onlineUsers: [],
        unreadMessages: {},
        books: [],
        lastViewedChat: null,
        lastViewedBook: null,
        lastViewedGroup: null,
        groups: [],
        selectedGroup: null,
        notifications: [],
        notificationCount: 0,
    },

    // --- Getters ---

    getLastViewedGroup() {
        return this.state.lastViewedGroup
    },

    getSelectedBook() {
        return this.state.selectedBook;
    },

    getActiveTab() {
        return this.state.activeTab;
    },

    getSelectedChat() {
        return this.state.selectedChat;
    },

    getSelectedBook() {
        return this.state.selectedBook;
    },

    getChats() {
        return this.state.chats;
    },

    getContacts() {
        return this.state.contacts;
    },

    getOnlineUsers() {
        return this.state.onlineUsers;
    },

    getUnreadCount(userId) {
        return this.state.unreadMessages[userId] || 0;
    },

    getBooks() {
        return this.state.books;
    },

    getAuthUser() {
        return this.state.authUser;
    },

    getLastViewedBook(book) {
        return this.state.lastViewedBook;
    },

    getLastViewedChat(chat) {
        return this.state.lastViewedChat;
    },

    getGroups() {
        return this.state.groups
    },

    getSelectedGroup() {
        return this.state.selectedGroup;
    },

    getNotifications() {
        return this.state.notifications;
    },

    getNotificationCount() {
        return this.state.notificationCount;
    },

    // --- Setters ---
    setLastViewedGroup(group) {
        this.state.lastViewedGroup = group;
    },

    setNotifications(data) {
        this.state.notifications = data;
        PubSub.publish(UPDATED_NOTIFICATIONS, this.getNotifications());
    },

    setNotificationCount(count) {
        this.state.notificationCount = count;
        PubSub.publish(UPDATED_NOTIFICATION_COUNT, this.getNotificationCount());
    },

    incrementNotificationCount() {
        this.state.notificationCount++;
        PubSub.publish(UPDATED_NOTIFICATION_COUNT, this.getNotificationCount());
    },

    decrementNotificationCount() {
        if (this.state.notificationCount > 0) {
            this.state.notificationCount--;
            PubSub.publish(UPDATED_NOTIFICATION_COUNT, this.getNotificationCount());
        }
    },

    setGroups(data) {
        this.state.groups = data;
        PubSub.publish(UPDATED_GROUPS, this.getGroups())
    },

    setSelectedGroup(group) {
        this.state.selectedGroup = group;
        PubSub.publish(UPDATED_SELECTED_GROUP, this.getSelectedGroup());
    },

    setLastViewedChat(chat) {
        this.state.lastViewedChat = chat;
    },

    setLastViewedBook(book) {
        this.state.lastViewedBook = book;
    },

    setAuthUser(user) {
        this.state.authUser = user;
        PubSub.publish(USER_AUTHENTICATED, this.getAuthUser());
    },

    setBooks(data) {
        this.state.books = data;
        PubSub.publish(UPDATED_BOOKS, this.getBooks());
    },

    setSelectedBook(book) {
        this.state.selectedBook = book;
        PubSub.publish(UPDATED_SELECTED_BOOK, this.getSelectedBook());
    },

    setActiveTab(tab) {
        this.state.activeTab = tab;
        PubSub.publish(UPDATED_ACTIVE_TAB, this.getActiveTab());
    },

    setChats(chats) {
        this.state.chats = chats;
        PubSub.publish(UPDATED_CHATS, this.getChats());
    },

    setContacts(contacts) {
        this.state.contacts = contacts;
        PubSub.publish(UPDATED_CONTACTS, this.getContacts());
    },

    setOnlineUsers(onlineUsers) {
        this.state.onlineUsers = onlineUsers;
        PubSub.publish(UPDATED_ONLINE_USERS, this.getOnlineUsers());
    },

    setSelectedChat(chat) {
        this.state.selectedChat = chat;
        PubSub.publish(UPDATED_SELECTED_CHAT, this.getSelectedChat());
    },

    setSelectedBook(book) {
        this.state.selectedBook = book;
        PubSub.publish(UPDATED_SELECTED_BOOK, this.getSelectedBook());
    },

    // --- Unread message management ---
    incrementUnread(userId) {
        if (!this.state.unreadMessages[userId]) this.state.unreadMessages[userId] = 0;
        this.state.unreadMessages[userId] += 1;
        PubSub.publish(UPDATED_UNREAD_MESSAGES, userId);
    },

    clearUnread(userId) {
        if (this.state.unreadMessages[userId]) {
            this.state.unreadMessages[userId] = 0;
            PubSub.publish(UPDATED_UNREAD_MESSAGES, userId);
        }
    },

    setUnreadCount(userId, count) {
        this.state.unreadMessages[userId] = count;
        PubSub.publish(UPDATED_UNREAD_MESSAGES, userId);
    },
};

export default appStore;