import avatar from "../images/avatar.png";
import appStore from "../utils/appStore.js";
import { axiosInstance } from "../utils/axios.js";
import { icons, createIcons, MessageSquarePlus, MessagesSquare, Send, Image, BookOpen, LogOut, Inbox, Search, X, SquareMenu, MessageCircle, Bell, SearchX, User, Users } from "lucide";
import PubSub from "pubsub-js";
import { toast } from "./toast.js";
import { socket } from "../utils/socket.js";

import {
    USER_AUTHENTICATED,
    UPDATED_ACTIVE_TAB,
    UPDATED_CONTACTS,
    UPDATED_CHATS,
    UPDATED_ONLINE_USERS,
    UPDATED_SELECTED_CHAT,
    UPDATED_UNREAD_MESSAGES,
    UPDATED_BOOKS,
    UPDATED_SELECTED_BOOK,
    SHOW_HOME,
    UPDATED_GROUPS,
    UPDATED_SELECTED_GROUP,
    UPDATED_NOTIFICATION_COUNT,
} from "../utils/topics.js";

export default class MainView {
    constructor(parent = document.body) {
        // render as soon as an instance is created
        this.render(parent)
    }

    /* ===============================
     *  MAIN ENTRY POINT
     * =============================== */
    async render(parent) {
        try {
            PubSub.subscribe(USER_AUTHENTICATED, () => this.onUserAuthenticated(parent));

            const res = await axiosInstance("/auth/me");
            appStore.setAuthUser(res.data.user);
            
            
        } catch (err) {
            
            PubSub.publish(SHOW_HOME);
        }
    }

    /* ===============================
     *  AUTH & INITIALIZATION
     * =============================== */
    async onUserAuthenticated(parent) {
        setTimeout(() => toast.success("Logged in successfully"), 1000);

        const { fullname, role, profilePic, level } = appStore.getAuthUser();
        const wrapper = document.createElement("div");
        wrapper.classList.add("main-view");
        wrapper.innerHTML = this.templateMain({ fullname, role, profilePic, level });

        parent.appendChild(wrapper);

        const mainContentElem = wrapper.querySelector(".main-content");
        this.showWelcomeMessage(mainContentElem);

        createIcons({ icons });

        socket.emit("user_online", appStore.getAuthUser()._id);

        await this.loadUnreadCounts();
        await this.loadNotifications(); // ADD THIS

        this.initUIListeners(wrapper);
    }

    showWelcomeMessage(mainContentElem) {
        const role = appStore.getAuthUser().role;
        const fullname = appStore.getAuthUser().fullname;

        mainContentElem.innerHTML = `
        <div class="welcome-message">
            <i data-lucide="message-square-plus"></i>
            <h2>Welcome, ${fullname}!</h2>
            <p>Select a ${role === 'Lecturer' ? 'student' : 'lecturer'} to start chatting or browse books</p>
            <div class="welcome-actions">
                <div class="welcome-tip">
                    <i data-lucide="messages-square"></i>
                    <span>Click on any contact to start a conversation</span>
                </div>
                <div class="welcome-tip">
                    <i data-lucide="book-open"></i>
                    <span>Browse the Books tab to ${role === 'Lecturer' ? 'upload or manage' : 'request'} books</span>
                </div>
            </div>
        </div>
`;
    }

    /* ===============================
     *  TEMPLATE GENERATION
     * =============================== */
    templateMain({ fullname, role, profilePic, level }) {
        return `
        <div class="mobile-header">
            <i data-lucide="square-menu"></i>
        </div>
      <aside class="sidebar">
        <div class="profile-section">
          <div class="profile-container">
            <div class="profile">
              <img src="${profilePic || avatar}" alt="Profile Picture" class="profile-pic" />
              <span class="hover-text">Update Profile</span>
              <input type="file" accept="image/*" />
            </div>
            <div class="profile-info">
              <h2>${fullname}</h2>
              <small>Role: ${role}</small>${level ? "</br>" : ""}
              <small>${level ? "Level: " + level : ""}</small>
            </div>
          </div>
          <div class="profile-actions">
            <button class="notification-btn">
              <i data-lucide="bell"></i>
              <span class="notification-badge">0</span>
            </button>
            <button class="logout-btn">
            <i data-lucide="log-out"></i>
            </button>
          </div>
          <!-- Notification Dropdown -->
          <div class="notification-dropdown">
            <div class="notification-header">
              <h3>Notifications</h3>
              <button class="mark-all-read">Mark all as read</button>
            </div>
            <ul class="notification-list">
              <!-- Notifications will be inserted here -->
            </ul>
            <div class="notification-footer">
              <button class="view-all-notifications">View All</button>
            </div>
          </div>
        </div>


        <ul class="tab-section">
          <li class="active">Chats</li>
          <li>Groups</li>
          <li>${role === "Student" ? "Lecturers" : "Students"}</li>
          <li>Books</li>
        </ul>

        <div class="search-section">
          <div class="search-input-container">
            <i data-lucide="search"></i>
            <input type="text" class="search-input" placeholder="Search..." />
            <button class="clear-search" style="display: none;">
              <i data-lucide="x"></i>
            </button>
          </div>
        </div>

        <ul class="nav-action-list"></ul>
        <code>Real-Time messaging system </br> for departmental communication</code>
      </aside>

      <main class="main-content"></main>
    `;
    }

    templateConversation({ fullname, role, profilePic, id }) {
        return `
      <div class="conversation-header">
        <div class="conversation-profile" data-chat-id="${id}">
          <div class="conversation-avatar">
            <img src="${profilePic || avatar}" alt="Avatar" />
          </div>
          <div>
            <h3>${fullname}</h3>
            <small>${role}</small>
          </div>
        </div>
        <button><i data-lucide="X"></i></button>
      </div>

      <ul class="messages"></ul>

      <div>
        <ul class="selected-images"></ul>
        <form class="message-input-container">
          <input class="message-input" name="text" placeholder="Type your message" type="text" />
          <button type="button">
            <i data-lucide="Image"></i>
            <input type="file" accept="image/*" name="image"/>
          </button>
          <button type="submit" disabled>
            <i data-lucide="Send"></i>
          </button>
        </form>
      </div>
    `;
    }

    /* ===============================
     *  UI EVENT LISTENERS
     * =============================== */
    initUIListeners(mainView) {
        const profileSection = mainView.querySelector(".profile-section");
        const profilePicElem = profileSection.querySelector(".profile-pic");
        const logOutButton = mainView.querySelector(".logout-btn");
        const notificationBtn = mainView.querySelector(".notification-btn");
        const notificationDropdown = mainView.querySelector(".notification-dropdown");
        const tabSection = mainView.querySelector(".tab-section");
        const notificationList = mainView.querySelector(".notification-list");
        const navActionList = mainView.querySelector(".nav-action-list");
        const mainContentElem = mainView.querySelector(".main-content");
        const searchInput = mainView.querySelector(".search-input");
        const clearSearchBtn = mainView.querySelector(".clear-search");
        let activeTab = tabSection.querySelector("li");

        // Profile picture update
        profileSection.addEventListener("change", (e) => this.onProfilePicChange(e, profilePicElem));

        // Logout
        logOutButton.addEventListener("click", this.onLogout);

        // Notification bell toggle
        notificationBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            notificationList.innerHTML = "";
            notificationDropdown.classList.toggle("show");
            this.renderNotifications();
        });

        // Close notification drop down
        document.addEventListener("click", (e) => {
            e.stopPropagation();
            const isVisible = document.querySelector(".notification-dropdown.show");
            if (isVisible) notificationDropdown.classList.toggle("show");
            notificationList.innerHTML = "";
        })

        // Mark all as read
        const markAllReadBtn = mainView.querySelector(".mark-all-read");
        markAllReadBtn?.addEventListener("click", () => {
            this.markAllNotificationsRead();
        });

        // Contact/Book/Group selection
        navActionList.addEventListener("click", (e) => {
            const activeTabText = activeTab.textContent.toLowerCase();
            if (activeTabText === 'books') {
                this.onBookSelect(e);
            } else if (activeTabText === 'groups') {
                this.onGroupSelect(e);
            } else {
                this.onChatSelect(e);
            }
        });

        // Tab switching
        tabSection.addEventListener("click", (e) => {
            const clicked = e.target;
            if (clicked.tagName !== "LI") return;

            activeTab.classList.remove("active");
            activeTab = clicked;
            activeTab.classList.add("active");

            // Clear search when switching tabs
            searchInput.value = "";
            clearSearchBtn.style.display = "none";

            appStore.setActiveTab(activeTab.textContent.toLowerCase());
        });

        // Search functionality
        searchInput.addEventListener("input", (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            clearSearchBtn.style.display = searchTerm ? "flex" : "none";
            this.filterList(searchTerm, navActionList, activeTab.textContent.toLowerCase());
        });

        // Clear search button
        clearSearchBtn.addEventListener("click", () => {
            searchInput.value = "";
            clearSearchBtn.style.display = "none";
            this.filterList("", navActionList, activeTab.textContent.toLowerCase());
            searchInput.focus();
        });

        // Mobile sidebar toggle
        const setupMobileMenu = () => {
            const sidebar = mainView.querySelector('.sidebar');
            mainView.addEventListener('click', (e) => {
                const hamburger = e.target.closest('[data-lucide="square-menu"]');
                if (!hamburger) return;

                e.stopPropagation();
                sidebar.classList.toggle('open');

                let overlay = mainView.querySelector('.sidebar-overlay');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.className = 'sidebar-overlay';
                    mainView.appendChild(overlay);
                    overlay.addEventListener('click', () => {
                        sidebar.classList.remove('open');
                        overlay.classList.remove('active');
                    });
                }
                overlay.classList.toggle('active');
            });
        };
        setupMobileMenu();

        // Close sidebar when selecting on mobile
        navActionList.addEventListener('click', (e) => {
            const activeTabText = activeTab.textContent.toLowerCase();
            if (activeTabText === 'books') {
                this.onBookSelect(e);
            } else if (activeTabText === 'groups') {
                this.onGroupSelect(e);
            } else {
                this.onChatSelect(e);
            }

            if (window.innerWidth <= 768) {
                const sidebar = mainView.querySelector('.sidebar');
                sidebar.classList.remove('open');
                const overlay = document.querySelector('.sidebar-overlay');
                if (overlay) overlay.classList.remove('active');
            }
        });

        // Subscriptions
        this.initPubSub(mainContentElem, navActionList);
    }

    /* ===============================
     *  PUBSUB EVENTS
     * =============================== */
    initPubSub(mainContentElem, navActionList) {
        const refreshList = (contacts) => {
            const searchInput = document.querySelector(".search-input");
            const searchTerm = searchInput?.value.toLowerCase().trim() || "";

            navActionList.innerHTML = "";

            // Remove any existing empty states first
            const existingEmpty = navActionList.querySelector(".empty-state");
            if (existingEmpty) {
                existingEmpty.remove();
            }

            if (!contacts || contacts.length === 0) {
                this.showEmptyState(navActionList, appStore.getActiveTab(), appStore.getAuthUser().role);
                return;
            }

            contacts.forEach(({ fullname, role, profilePic, _id }) => {
                const unreadCount = appStore.getUnreadCount(_id);
                const li = document.createElement("li");
                li.classList.add("chat");
                li.dataset.chatId = _id;
                li.innerHTML = `
          <div class="avatar-container">
            <img src="${profilePic || avatar}" alt="User avatar" />
          </div>
          <div class="chat-info">
            <h3>${fullname}</h3>
            <small>${role}</small>
          </div>
          ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : ''}
        `;
                navActionList.appendChild(li);
            });

            socket.emit("get_online_users");

            // Re-apply search filter if there's a search term
            if (searchTerm) {
                this.filterList(searchTerm, navActionList, appStore.getActiveTab());
            }
        };

        PubSub.subscribe(UPDATED_CONTACTS, (_, data) => refreshList(data));
        PubSub.subscribe(UPDATED_CHATS, (_, data) => refreshList(data));

        // Update unread badges when unread messages change
        PubSub.subscribe(UPDATED_UNREAD_MESSAGES, (_, userId) => {
            const chatItem = navActionList.querySelector(`li[data-chat-id="${userId}"]`);
            if (!chatItem) return;

            const existingBadge = chatItem.querySelector('.unread-badge');
            const unreadCount = appStore.getUnreadCount(userId);

            if (unreadCount > 0) {
                if (existingBadge) {
                    existingBadge.textContent = unreadCount;
                } else {
                    const badge = document.createElement('span');
                    badge.className = 'unread-badge';
                    badge.textContent = unreadCount;
                    chatItem.appendChild(badge);
                }
            } else if (existingBadge) {
                existingBadge.remove();
            }
        });

        PubSub.subscribe(UPDATED_ONLINE_USERS, (_, onlineUsers) => {
            navActionList.querySelectorAll("li").forEach((chat) => {
                const avatarContainer = chat.querySelector(".avatar-container");
                if (avatarContainer) {
                    avatarContainer.classList.toggle(
                        "online",
                        onlineUsers.includes(chat.dataset.chatId)
                    );
                }
            });

            // Update conversation header if open
            const conversationAvatar = mainContentElem.querySelector(".conversation-avatar");
            if (conversationAvatar) {
                const chatId = conversationAvatar.closest(".conversation-profile").dataset.chatId;
                conversationAvatar.classList.toggle("online", onlineUsers.includes(chatId));
            }
        });

        PubSub.subscribe(UPDATED_ACTIVE_TAB, (_, tab) => this.onTabSwitch(tab));
        PubSub.subscribe(UPDATED_SELECTED_CHAT, (_, chat) =>
            this.renderConversation(mainContentElem, chat)
        );

        socket.on("update_online_users", (onlineUsers) =>
            appStore.setOnlineUsers(onlineUsers)
        );

        // When a message is received
        socket.on("receive_message", (message) => {
            const selectedChat = appStore.getSelectedChat();
            const senderId = message.sender;

            // If the message is from the currently open chat, display it
            if (selectedChat && senderId === selectedChat._id) {
                const messagesElem = document.querySelector(".messages");
                if (messagesElem) {
                    const li = document.createElement("li");
                    li.classList.add("message", "them");
                    li.innerHTML = `
                ${message.image ? `<div><img src="${message.image}" alt=""/></div>` : ""}
                ${message.text ? `<p class="text">${message.text}</p>` : ""}
            `;

                    messagesElem.querySelector(".typing-indicator")?.remove();
                    messagesElem.appendChild(li);
                    messagesElem.scrollTop = messagesElem.scrollHeight;
                }

                // Mark as read immediately since chat is open
                socket.emit("mark_as_read", {
                    userId: appStore.getAuthUser()._id,
                    contactId: senderId
                });
            } else {
                // Message is from someone else - increment unread count
                appStore.incrementUnread(senderId);
            }
        });

        socket.on("new_notification", async (notification) => {
            console.log("New notification received:", notification);

            // Increment notification count
            appStore.incrementNotificationCount();

            // Reload notifications to get the latest
            await this.loadNotifications();

            // Show toast for message notifications too
            if (notification.type === 'message') {
                // Only show toast if the chat is not currently open
                const selectedChat = appStore.getSelectedChat();
                if (!selectedChat || selectedChat._id !== notification.metadata?.senderId) {
                    toast.info(notification.title);
                }
            } else if (['group_invite', 'book_approved', 'group_message'].includes(notification.type)) {
                toast.info(notification.title);
            }
        });

        const refreshBooksList = (books) => {
            const searchInput = document.querySelector(".search-input");
            const searchTerm = searchInput?.value.toLowerCase().trim() || "";
            const role = appStore.getAuthUser().role;
            const currentUserId = appStore.getAuthUser()._id;

            navActionList.innerHTML = "";

            // Add upload button for lecturers
            if (role === 'Lecturer') {
                const uploadBtn = document.createElement("button");
                uploadBtn.className = "btn-upload-book";
                uploadBtn.innerHTML = '<i data-lucide="plus"></i> Upload New Book';
                uploadBtn.addEventListener("click", () => this.showUploadModal(mainContentElem));
                navActionList.appendChild(uploadBtn);
            }

            // Check if books array is empty
            if (!books || books.length === 0) {
                this.showEmptyState(navActionList, 'books', role);
                return;
            }

            books.forEach((book) => {
                const li = document.createElement("li");
                li.classList.add("book-item");
                li.dataset.bookId = book._id;

                let statusBadge = '';
                if (role === 'Student') {
                    const isApproved = book.allowedStudents?.some(s => {
                        const studentId = typeof s === 'object' ? s._id : s;
                        return studentId === currentUserId;
                    });

                    const isWaiting = book.waitingList?.some(s => {
                        const studentId = typeof s === 'object' ? s._id : s;
                        return studentId === currentUserId;
                    });

                    if (isApproved) {
                        statusBadge = '<span class="status-badge approved">Approved</span>';
                    } else if (isWaiting) {
                        statusBadge = '<span class="status-badge pending">Requested</span>';
                    } else {
                        statusBadge = '<span class="status-badge available">Available</span>';
                    }
                } else if (role === 'Lecturer') {
                    const pendingCount = book.waitingList?.filter(wId => {
                        const waitingId = typeof wId === 'object' ? wId._id : wId;
                        return !book.allowedStudents?.some(aId => {
                            const allowedId = typeof aId === 'object' ? aId._id : aId;
                            return allowedId === waitingId;
                        });
                    }).length || 0;

                    if (pendingCount > 0) {
                        statusBadge = `<span class="unread-badge">${pendingCount}</span>`;
                    }
                }

                li.innerHTML = `
            <div class="book-icon">
                <i data-lucide="book"></i>
            </div>
            <div class="chat-info">
                <h3>${book.title}</h3>
                <small>${book.courseCode} - ${book.level}</small>
            </div>
            ${statusBadge}
        `;
                navActionList.appendChild(li);
            });

            createIcons({ icons });

            // Re-apply search filter if there's a search term
            if (searchTerm) {
                this.filterList(searchTerm, navActionList, 'books');
            }
        };

        const refreshGroupsList = (groups) => {
            const searchInput = document.querySelector(".search-input");
            const searchTerm = searchInput?.value.toLowerCase().trim() || "";
            const role = appStore.getAuthUser().role;

            navActionList.innerHTML = "";

            // Add create group button for lecturers
            if (role === 'Lecturer') {
                const createBtn = document.createElement("button");
                createBtn.className = "btn-upload-book"; // Reuse same style
                createBtn.innerHTML = '<i data-lucide="users-round"></i> Create Group';
                createBtn.addEventListener("click", () => this.showCreateGroupModal());
                navActionList.appendChild(createBtn);
            }

            if (!groups || groups.length === 0) {
                this.showEmptyState(navActionList, 'groups', role);
                return;
            }

            groups.forEach((group) => {
                const li = document.createElement("li");
                li.classList.add("group-item");
                li.dataset.groupId = group._id;

                const isGeneral = group.groupType === 'general';

                li.innerHTML = `
            <div class="book-icon group-icon">
                <i data-lucide="${isGeneral ? 'megaphone' : 'users'}"></i>
            </div>
            <div class="chat-info">
                <h3>${group.name}</h3>
                <small>${group.members?.length || 0} members</small>
            </div>
            ${isGeneral ? '<span class="status-badge approved">General</span>' : ''}
        `;
                navActionList.appendChild(li);
            });

            createIcons({ icons });

            if (searchTerm) {
                this.filterList(searchTerm, navActionList, 'groups');
            }
        };

        // Subscribe to groups updates
        PubSub.subscribe(UPDATED_GROUPS, (_, data) => refreshGroupsList(data));

        // Subscribe to selected group
        PubSub.subscribe(UPDATED_SELECTED_GROUP, (_, group) =>
            this.renderGroupConversation(mainContentElem, group)
        );

        // Subscribe to notifications
        PubSub.subscribe(UPDATED_NOTIFICATION_COUNT, (_, count) => {
            this.updateNotificationBadge(count);
        });

        // Socket events for groups
        socket.on("group_message_received", async ({ groupId, message }) => {
            const selectedGroup = appStore.getSelectedGroup();

            if (selectedGroup && selectedGroup._id === groupId) {
                const messagesElem = document.querySelector(".group-messages");
                if (messagesElem) {
                    const li = document.createElement("li");
                    const isMe = message.sender._id === appStore.getAuthUser()._id;
                    li.classList.add("message", isMe ? "me" : "them");

                    li.innerHTML = `
                ${!isMe ? `<div class="message-sender">${message.sender.fullname}</div>` : ''}
                ${message.image ? `<div><img src="${message.image}" alt=""/></div>` : ""}
                ${message.text ? `<p class="text">${message.text}</p>` : ""}
            `;
                    messagesElem.appendChild(li);
                    messagesElem.scrollTop = messagesElem.scrollHeight;
                }
            }

            // Refresh groups list to update last message
            await this.fetchGroups();
        });

        // Socket event for notifications
        socket.on("new_notification", async (notification) => {
            appStore.incrementNotificationCount();
            await this.loadNotifications();

            // Show toast for important notifications
            if (['group_invite', 'book_approved'].includes(notification.type)) {
                toast.info(notification.title);
            }
        });

        PubSub.subscribe(UPDATED_BOOKS, (_, data) => refreshBooksList(data));

        PubSub.subscribe(UPDATED_SELECTED_BOOK, (_, book) => {
            this.renderBookView(mainContentElem, book)
        });

        // When sender confirms their message sent successfully
        socket.on("message_sent", (message) => {
            const selectedChat = appStore.getSelectedChat();
            if (!selectedChat || message.receiver !== selectedChat._id) return;

            const messagesElem = document.querySelector(".messages");
            if (!messagesElem) return;

            const li = document.createElement("li");
            li.classList.add("message", "me");
            li.innerHTML = `
            ${message.image ? `<div><img src="${message.image}" alt=""/></div>` : ""}
            ${message.text ? `<p class="text">${message.text}</p>` : ""}
            `;
            messagesElem.appendChild(li);
            messagesElem.scrollTop = messagesElem.scrollHeight;
        });

        //  Lecturer gets notified when student requests
        socket.on("book_request_received", async ({ bookId, studentId }) => {
            const role = appStore.getAuthUser().role;
            if (role === 'Lecturer') {
                await this.fetchBooks(); // Refresh list to show new badge

                const selectedBook = appStore.getSelectedBook();
                if (selectedBook && selectedBook._id === bookId) {
                    await this.fetchAndRenderBook(bookId); // Refresh if book is open
                }

                toast.info("New book download request!");
            }
        });

        // Student gets notified when approved/declined
        socket.on("book_status_changed", async ({ bookId, action }) => {
            const role = appStore.getAuthUser().role;
            if (role === 'Student') {
                await this.fetchBooks(); // Refresh list

                const selectedBook = appStore.getSelectedBook();
                if (selectedBook && selectedBook._id === bookId) {
                    await this.fetchAndRenderBook(bookId); // Refresh if book is open
                }

                if (action === 'approved') {
                    toast.success("Your request was approved!");
                } else if (action === 'declined') {
                    toast.info("Your request was declined");
                }
            }
        });

        // Refresh books when anything changes
        socket.on("refresh_books", async ({ bookId }) => {
            await this.fetchBooks();

            const selectedBook = appStore.getSelectedBook();
            if (selectedBook && selectedBook._id === bookId) {
                await this.fetchAndRenderBook(bookId);
            }
        });

        this.fetchChats()
    }

    filterList(searchTerm, navActionList, activeTab) {
        const role = appStore.getAuthUser().role;

        // Remove any search empty states first
        const searchEmpty = navActionList.querySelector(".search-empty");
        if (searchEmpty) {
            searchEmpty.remove();
        }

        // Get all items - UPDATED to include group-item
        const items = navActionList.querySelectorAll("li.chat, li.book-item, li.group-item");

        if (!searchTerm) {
            // Show all items
            items.forEach(item => item.style.display = "");
            return;
        }

        let visibleCount = 0;

        items.forEach(item => {
            const chatInfo = item.querySelector(".chat-info");
            if (!chatInfo) {
                item.style.display = "none";
                return;
            }

            const title = chatInfo.querySelector("h3")?.textContent.toLowerCase() || "";
            const subtitle = chatInfo.querySelector("small")?.textContent.toLowerCase() || "";

            if (title.includes(searchTerm) || subtitle.includes(searchTerm)) {
                item.style.display = "";
                visibleCount++;
            } else {
                item.style.display = "none";
            }
        });

        // Show "no results" message if nothing matches
        if (visibleCount === 0 && items.length > 0) {
            const emptyDiv = document.createElement("div");
            emptyDiv.className = "empty-state search-empty";
            emptyDiv.innerHTML = `
            <i data-lucide="search-x"></i>
            <p>No results found</p>
            <small>Try a different search term</small>
        `;
            navActionList.appendChild(emptyDiv);
            createIcons({ icons });
        }
    }

    showEmptyState(navActionList, activeTab, role) {
        // Remove any existing empty state first
        const existingEmpty = navActionList.querySelector(".empty-state");
        if (existingEmpty) {
            existingEmpty.remove();
        }

        let emptyMessage = "No items available";
        let emptySubtext = "";

        if (activeTab === 'chats') {
            emptyMessage = "No chats yet";
            emptySubtext = '<small>Start a conversation with a contact</small>';
        } else if (activeTab === 'groups') {
            emptyMessage = role === 'Lecturer' ? "No groups created yet" : "No groups joined";
            emptySubtext = role === 'Lecturer'
                ? '<small>Click the button above to create your first group</small>'
                : '<small>Your lecturer will add you to groups</small>';
        } else if (activeTab === 'lecturers') {
            emptyMessage = "No lecturers available";
        } else if (activeTab === 'students') {
            emptyMessage = "No students available";
        } else if (activeTab === 'books') {
            if (role === 'Lecturer') {
                emptyMessage = "No books uploaded yet";
                emptySubtext = '<small>Click the button above to upload your first book</small>';
            } else {
                emptyMessage = "No books available";
                emptySubtext = '<small>Check back later for new uploads</small>';
            }
        }

        const emptyDiv = document.createElement("div");
        emptyDiv.className = "empty-state";
        emptyDiv.innerHTML = `
        <i data-lucide="inbox"></i>
        <p>${emptyMessage}</p>
        ${emptySubtext}
    `;
        navActionList.appendChild(emptyDiv);
        createIcons({ icons });
    }


    /* ===============================
     *  CHAT HANDLING
     * =============================== */

    onChatSelect(e) {
        const li = e.target.closest("li");
        if (!li?.classList.contains("chat")) return;

        const chatId = li.dataset.chatId;

        // Try to find chat in contacts first
        let chat = appStore.getContacts().find((c) => c._id === chatId);

        // If not in contacts, try chats list
        if (!chat) {
            const chats = appStore.getChats();
            chat = chats.find((c) => c._id === chatId);
        }

        // If still not found, return early
        if (!chat) {
            console.error("Chat not found:", chatId);
            toast.error("Unable to load chat");
            return;
        }

        // Clear unread count when opening a chat
        appStore.clearUnread(chat._id);

        // Mark messages as read on the server
        socket.emit("mark_as_read", {
            userId: appStore.getAuthUser()._id,
            contactId: chat._id
        });

        appStore.setSelectedBook(null);
        appStore.setSelectedChat(chat);
        appStore.setLastViewedChat(chat);
    }


    async renderConversation(mainContentElem, selectedChat) {
        mainContentElem.innerHTML = "";

        if (!selectedChat) {
            mainContentElem.innerHTML = `
      <div class="no-conversation">
        <i data-lucide="message-circle"></i>
        <p>You have selected no conversation</p>
      </div>`;
            createIcons({ icons: { MessageCircle, X, SquareMenu, Search, Image, Send, LogOut, Bell, Users } });
            return;
        }

        const { fullname, role, profilePic, _id } = selectedChat;
        const conversationDiv = document.createElement("div");
        conversationDiv.classList.add("conversation");
        conversationDiv.innerHTML = this.templateConversation({ fullname, role, profilePic, id: _id });

        // Add online status to conversation header avatar
        const conversationAvatar = conversationDiv.querySelector(".conversation-avatar");
        const onlineUsers = appStore.getOnlineUsers();
        if (onlineUsers.includes(_id)) {
            conversationAvatar.classList.add("online");
        }

        // Close conversation
        conversationDiv
            .querySelector(".conversation-header button")
            .addEventListener("click", () => {
                appStore.setSelectedChat(null);
                appStore.setLastViewedChat(null);
                mainContentElem.innerHTML = `
              <div class="no-conversation">
                <i data-lucide="message-circle"></i>
                <p>You have selected no conversation</p>
              </div>`;
                createIcons({ icons: { MessageCircle, X, SquareMenu, Search, Image, Send, LogOut, Bell, Users } });
            });


        // Elements
        const messageForm = conversationDiv.querySelector(".message-input-container");
        const selectedImagesElem = conversationDiv.querySelector(".selected-images");
        const messagesElem = conversationDiv.querySelector(".messages");
        const textInput = messageForm.querySelector("input[type='text']");
        const imageInput = messageForm.querySelector("input[type='file']");
        const sendButton = messageForm.querySelector("button[type='submit']");

        let selectedImageData = null;
        const typingIndicator = document.createElement("div");
        typingIndicator.classList.add("typing-indicator");
        typingIndicator.textContent = "";

        messageForm.addEventListener("submit", (e) =>
            this.sendMessage(e, textInput, selectedImageData, messagesElem, selectedImagesElem, () => {
                selectedImageData = null;
            })
        );

        imageInput.addEventListener("change", (e) =>
            this.onImageSelect(e, sendButton, textInput, selectedImagesElem, (imageData) => {
                selectedImageData = imageData;
            }, () => {
                selectedImageData = null;
            })
        );

        textInput.addEventListener("keyup", (e) =>
            this.onTyping(e, selectedImageData, sendButton)
        );

        this.fetchMessages(messagesElem);

        socket.on("typing", ({ senderId, isTyping }) => {
            messagesElem.appendChild(typingIndicator);
            if (!appStore.getSelectedChat() || senderId !== appStore.getSelectedChat()._id) return;
            typingIndicator.textContent = isTyping ? "Typing..." : "";
            messagesElem.scrollTop = messagesElem.scrollHeight;

            if (!isTyping) typingIndicator.remove();
        });

        mainContentElem.appendChild(conversationDiv);
        socket.emit("get_online_users");
        createIcons({
            icons: {
                Search,
                LogOut,
                X,
                SquareMenu,
                Inbox,
                Image, Send,
            }
        });
    }


    /* ===============================
     *  MESSAGE SENDING
     * =============================== */
    onTyping(e, selectedImageData, sendButton) {
        this.toggleSendButton(e.target.value, selectedImageData, sendButton);

        const selectedChat = appStore.getSelectedChat();
        if (!selectedChat) return;

        const sender = appStore.getAuthUser();

        // Emit typing status
        socket.emit("typing", {
            senderId: sender._id,
            receiverId: selectedChat._id,
            isTyping: e.target.value.length > 0
        });
    }

    onImageSelect(e, sendButton, textInput, selectedImagesElem, onImageSelected, onImageRemoved) {
        if (!e.target.closest("input[type='file']")) return;

        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            onImageSelected(imageData);

            selectedImagesElem.innerHTML = `
        <li>
          <span><i data-lucide="X"></i></span>
          <div><img src="${imageData}" alt="" /></div>
        </li>`;
            const li = selectedImagesElem.querySelector("li");

            li.addEventListener("click", (e) => {
                if (!e.target.closest("svg")) return;
                li.remove();
                onImageRemoved();
                if (!textInput.value) {
                    sendButton.disabled = true;
                }
            });

            createIcons({ icons: {X, SquareMenu, Search, Image, Send, LogOut} });
            this.toggleSendButton(textInput.value, imageData, sendButton);
        };
        reader.readAsDataURL(file);
    }

    toggleSendButton(textValue, imageData, button) {
        button.disabled = !(textValue || imageData);
    }

    templateBookView(book, isLecturer) {
        const statusBadge = (student) => {
            const isApproved = book.allowedStudents?.some(s => {
                const studentId = typeof s === 'object' ? s._id : s;
                return studentId === student._id;
            });

            if (isApproved) {
                return '<span class="status-badge approved">✓ Approved</span>';
            }
            return '<span class="status-badge pending">⏳ Pending</span>';
        };

        return `
      <div class="book-view">
        <div class="conversation-header">
          <i data-lucide="square-menu"></i>
          <div class="book-info-header">
            <h2>${book.title}</h2>
            <small>${book.courseCode} - ${book.level}</small>
          </div>
          <button class="close-book"><i data-lucide="X"></i></button>
        </div>

        <div class="book-content">
          <div class="book-details">
            <h3>Book Details</h3>
            <p><strong>Description:</strong> ${book.description || 'No description'}</p>
            <p><strong>Author:</strong> ${book.author?.fullname || 'Unknown'}</p>
            <p><strong>Course Code:</strong> ${book.courseCode}</p>
            <p><strong>Level:</strong> ${book.level}</p>
            <p><strong>Price:</strong> ${book.price > 0 ? `₦${book.price}` : 'Free'}</p>
            <p><strong>Downloads:</strong> ${book.downloads || 0}</p>
          </div>

          ${isLecturer ? `
            <div class="waiting-list-section">
              <h3>Student Requests (${book.waitingList?.length || 0})</h3>
              ${book.waitingList && book.waitingList.length > 0 ? `
                <table class="requests-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Level</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${book.waitingList.map(student => {
            const isApproved = book.allowedStudents?.some(s => {
                const studentId = typeof s === 'object' ? s._id : s;
                return studentId === student._id;
            });

            return `
                        <tr data-student-id="${student._id}" class="${isApproved ? 'approved-row' : ''}">
                            <td>
                                <div class="student-info">
                                    <img src="${student.profilePic || '/default-avatar.png'}" alt="${student.fullname}" />
                                    <span>${student.fullname}</span>
                                </div>
                            </td>
                            <td>${student.level}</td>
                            <td>${statusBadge(student)}</td>
                            <td>
                                ${isApproved ? `
                                    <button class="btn-decline" data-student-id="${student._id}">
                                        <i data-lucide="x"></i> Remove Access
                                    </button>
                                ` : `
                                    <button class="btn-approve" data-student-id="${student._id}">
                                        <i data-lucide="check"></i> Approve
                                    </button>
                                    <button class="btn-decline" data-student-id="${student._id}">
                                        <i data-lucide="x"></i> Decline
                                    </button>
                                `}
                            </td>
                        </tr>
                    `}).join('')}
                  </tbody>
                </table>
              ` : '<p class="no-requests">No pending requests</p>'}
            </div>
          ` : `
            <div class="student-actions">
              ${(() => {
                const currentUserId = appStore.getAuthUser()._id;

                const isApproved = book.allowedStudents?.some(s => {
                    const studentId = typeof s === 'object' ? s._id : s;
                    return studentId === currentUserId;
                });

                const isWaiting = book.waitingList?.some(s => {
                    const studentId = typeof s === 'object' ? s._id : s;
                    return studentId === currentUserId;
                });

                if (isApproved) {
                    return `
                        <button class="btn-download" data-book-id="${book._id}">
                            <i data-lucide="download"></i> Download PDF
                        </button>
                    `;
                } else if (isWaiting) {
                    return `
                        <button class="btn-pending" disabled>
                            <i data-lucide="clock"></i> Pending Approval
                        </button>
                    `;
                } else {
                    return `
                        <button class="btn-request" data-book-id="${book._id}">
                            <i data-lucide="book-down"></i> Request Download
                        </button>
                    `;
                }
            })()}
            </div>
          `}
        </div>
      </div>
    `;
    }

    templateUploadBookModal() {
        return `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Upload New Book</h2>
            <button class="close-modal"><i data-lucide="X"></i></button>
          </div>
          <form class="upload-book-form">
            <div class="form-group">
              <label>Book Title *</label>
              <input type="text" name="title" required />
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea name="description" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label>Course Code *</label>
              <input type="text" name="courseCode" required />
            </div>
            <div class="form-group">
              <label>Level *</label>
              <select name="level" required>
                <option value="">Select Level</option>
                <option value="ND">ND</option>
                <option value="HND">HND</option>
              </select>
            </div>
            <div class="form-group">
              <label>Price (₦)</label>
              <input type="number" name="price" min="0" value="0" />
            </div>
            <div class="form-group">
              <label>PDF File *</label>
              <input type="file" name="pdf" accept=".pdf" required />
            </div>
            <button type="submit" class="btn-submit">
              <i data-lucide="upload"></i> Upload Book
            </button>
          </form>
        </div>
      </div>
    `;
    }

    templateGroupConversation(group) {
        return `
      <div class="conversation-header">
        <div class="conversation-profile" data-group-id="${group._id}">
          <div class="group-avatar">
            <i data-lucide="users"></i>
          </div>
          <div>
            <h3>${group.name}</h3>
            <small>${group.members?.length || 0} members</small>
          </div>
        </div>
        <div class="group-actions">
          ${group.creator === appStore.getAuthUser()._id || appStore.getAuthUser().role === 'Lecturer' ? `
            <button class="btn-group-info">
              <i data-lucide="info"></i>
            </button>
          ` : ''}
          <button class="btn-close-group">
            <i data-lucide="X"></i>
          </button>
        </div>
      </div>

      <ul class="messages group-messages"></ul>

      <div>
        <ul class="selected-images"></ul>
        <form class="message-input-container">
          <input class="message-input" name="text" placeholder="Type your message" type="text" />
          <button type="button">
            <i data-lucide="Image"></i>
            <input type="file" accept="image/*" name="image"/>
          </button>
          <button type="submit" disabled>
            <i data-lucide="Send"></i>
          </button>
        </form>
      </div>
    `;
    }

    // ============================================
    // NEW GROUP CREATION UI - Replace in mainView.js
    // ============================================

    // REMOVE the old templateCreateGroupModal method
    // REPLACE WITH this new one:

    templateCreateGroupModalWithStudents(students) {
        return `
      <div class="modal-overlay">
        <div class="modal-content group-create-modal">
          <div class="modal-header">
            <div class="header-content">
              <div class="icon-wrapper">
                <i data-lucide="users-round"></i>
              </div>
              <div>
                <h2>Create New Group</h2>
                <p class="subtitle">Connect your students in a group conversation</p>
              </div>
            </div>
            <button class="close-modal"><i data-lucide="X"></i></button>
          </div>

          <form class="create-group-form">
            <!-- Step Indicator -->
            <div class="steps-indicator">
              <div class="step active" data-step="1">
                <div class="step-circle">1</div>
                <span>Details</span>
              </div>
              <div class="step-line"></div>
              <div class="step" data-step="2">
                <div class="step-circle">2</div>
                <span>Members</span>
              </div>
              <div class="step-line"></div>
              <div class="step" data-step="3">
                <div class="step-circle">3</div>
                <span>Review</span>
              </div>
            </div>

            <!-- Step 1: Group Details -->
            <div class="form-step active" data-step="1">
              <div class="form-section">
                <h3><i data-lucide="info"></i> Group Information</h3>
                
                <div class="form-group">
                  <label for="group-name">
                    Group Name <span class="required">*</span>
                  </label>
                  <input 
                    type="text" 
                    id="group-name"
                    name="name" 
                    required 
                    placeholder="e.g., Computer Science ND2"
                    maxlength="50"
                  />
                  <small class="char-count">0/50 characters</small>
                </div>

                <div class="form-group">
                  <label for="group-description">
                    Description
                    <span class="optional">(Optional)</span>
                  </label>
                  <textarea 
                    id="group-description"
                    name="description" 
                    rows="4" 
                    placeholder="What is this group for? Add any important information..."
                    maxlength="200"
                  ></textarea>
                  <small class="char-count">0/200 characters</small>
                </div>
              </div>
            </div>

            <!-- Step 2: Add Members -->
            <div class="form-step" data-step="2">
              <div class="form-section">
                <div class="members-header">
                  <h3><i data-lucide="users"></i> Add Members</h3>
                  <div class="selected-count">
                    <span class="count">0</span> selected
                  </div>
                </div>

                <!-- Search Members -->
                <div class="search-members">
                  <i data-lucide="search"></i>
                  <input 
                    type="text" 
                    class="member-search-input" 
                    placeholder="Search students by name..."
                  />
                  <button type="button" class="clear-member-search" style="display: none;">
                    <i data-lucide="x"></i>
                  </button>
                </div>

                <!-- Quick Actions -->
                <div class="quick-actions">
                  <button type="button" class="quick-action-btn select-all">
                    <i data-lucide="check-square"></i> Select All
                  </button>
                  <button type="button" class="quick-action-btn deselect-all">
                    <i data-lucide="square"></i> Deselect All
                  </button>
                </div>

                <!-- Members List -->
                <div class="member-selection">
                  ${students.length > 0 ? `
                    <div class="members-grid">
                      ${students.map(student => `
                        <label class="member-card">
                          <input type="checkbox" name="members" value="${student._id}" />
                          <div class="member-card-content">
                            <div class="member-avatar">
                              <img src="${student.profilePic || avatar}" alt="${student.fullname}" />
                              <div class="check-overlay">
                                <i data-lucide="check"></i>
                              </div>
                            </div>
                            <div class="member-info">
                              <span class="member-name">${student.fullname}</span>
                              <small class="member-level">${student.level || 'Student'}</small>
                            </div>
                          </div>
                        </label>
                      `).join('')}
                    </div>
                  ` : `
                    <div class="no-members">
                      <i data-lucide="user-x"></i>
                      <p>No students available</p>
                      <small>Students need to register first</small>
                    </div>
                  `}
                </div>
              </div>
            </div>

            <!-- Step 3: Review -->
            <div class="form-step" data-step="3">
              <div class="form-section">
                <h3><i data-lucide="clipboard-check"></i> Review & Create</h3>
                
                <div class="review-summary">
                  <div class="summary-card">
                    <div class="summary-icon">
                      <i data-lucide="hash"></i>
                    </div>
                    <div class="summary-content">
                      <label>Group Name</label>
                      <p class="review-name">-</p>
                    </div>
                  </div>

                  <div class="summary-card">
                    <div class="summary-icon">
                      <i data-lucide="align-left"></i>
                    </div>
                    <div class="summary-content">
                      <label>Description</label>
                      <p class="review-description">No description</p>
                    </div>
                  </div>

                  <div class="summary-card">
                    <div class="summary-icon">
                      <i data-lucide="users"></i>
                    </div>
                    <div class="summary-content">
                      <label>Members</label>
                      <p class="review-members">0 members selected</p>
                      <div class="review-avatars"></div>
                    </div>
                  </div>
                </div>

                <div class="review-note">
                  <i data-lucide="info"></i>
                  <p>You can add or remove members after creating the group</p>
                </div>
              </div>
            </div>

            <!-- Navigation Buttons -->
            <div class="form-navigation">
              <button type="button" class="btn-nav btn-prev" style="display: none;">
                <i data-lucide="arrow-left"></i> Previous
              </button>
              <button type="button" class="btn-nav btn-next">
                Next <i data-lucide="arrow-right"></i>
              </button>
              <button type="submit" class="btn-submit" style="display: none;">
                <i data-lucide="check-circle"></i> Create Group
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    }

    async showCreateGroupModal() {
        try {
            // FETCH ALL STUDENTS - not just contacts
            const studentsRes = await axiosInstance.get("/student");
            const allStudents = studentsRes.data;

            console.log('All students:', allStudents); // Debug log

            const modalDiv = document.createElement("div");
            modalDiv.innerHTML = this.templateCreateGroupModalWithStudents(allStudents);

            let currentStep = 1;
            const totalSteps = 3;

            // Get form elements
            const form = modalDiv.querySelector(".create-group-form");
            const prevBtn = modalDiv.querySelector(".btn-prev");
            const nextBtn = modalDiv.querySelector(".btn-next");
            const submitBtn = modalDiv.querySelector(".btn-submit");
            const nameInput = modalDiv.querySelector("#group-name");
            const descInput = modalDiv.querySelector("#group-description");
            const memberSearch = modalDiv.querySelector(".member-search-input");
            const clearSearchBtn = modalDiv.querySelector(".clear-member-search");

            // Character counters
            const updateCharCount = (input, countElem) => {
                const count = input.value.length;
                const max = input.maxLength;
                countElem.textContent = `${count}/${max} characters`;
            };

            nameInput?.addEventListener('input', (e) => {
                const countElem = e.target.parentElement.querySelector('.char-count');
                updateCharCount(e.target, countElem);
            });

            descInput?.addEventListener('input', (e) => {
                const countElem = e.target.parentElement.querySelector('.char-count');
                updateCharCount(e.target, countElem);
            });

            // Member search functionality
            memberSearch?.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase().trim();
                clearSearchBtn.style.display = searchTerm ? 'flex' : 'none';

                const memberCards = modalDiv.querySelectorAll('.member-card');
                memberCards.forEach(card => {
                    const name = card.querySelector('.member-name').textContent.toLowerCase();
                    card.style.display = name.includes(searchTerm) ? '' : 'none';
                });
            });

            clearSearchBtn?.addEventListener('click', () => {
                memberSearch.value = '';
                clearSearchBtn.style.display = 'none';
                modalDiv.querySelectorAll('.member-card').forEach(card => {
                    card.style.display = '';
                });
            });

            // Select/Deselect All
            modalDiv.querySelector('.select-all')?.addEventListener('click', () => {
                const visibleCheckboxes = Array.from(modalDiv.querySelectorAll('.member-card'))
                    .filter(card => card.style.display !== 'none')
                    .map(card => card.querySelector('input[type="checkbox"]'));

                visibleCheckboxes.forEach(cb => cb.checked = true);
                updateSelectedCount();
            });

            modalDiv.querySelector('.deselect-all')?.addEventListener('click', () => {
                modalDiv.querySelectorAll('input[name="members"]').forEach(cb => cb.checked = false);
                updateSelectedCount();
            });

            // Update selected count
            const updateSelectedCount = () => {
                const count = modalDiv.querySelectorAll('input[name="members"]:checked').length;
                const countElem = modalDiv.querySelector('.selected-count .count');
                if (countElem) countElem.textContent = count;
            };

            modalDiv.querySelectorAll('input[name="members"]').forEach(cb => {
                cb.addEventListener('change', updateSelectedCount);
            });

            // Step navigation
            const showStep = (step) => {
                // Update step indicator
                modalDiv.querySelectorAll('.step').forEach((s, index) => {
                    s.classList.toggle('active', index + 1 <= step);
                    s.classList.toggle('completed', index + 1 < step);
                });

                // Update form steps
                modalDiv.querySelectorAll('.form-step').forEach((s, index) => {
                    s.classList.toggle('active', index + 1 === step);
                });

                // Update buttons
                prevBtn.style.display = step === 1 ? 'none' : 'flex';
                nextBtn.style.display = step === totalSteps ? 'none' : 'flex';
                submitBtn.style.display = step === totalSteps ? 'flex' : 'none';

                // Update review on step 3
                if (step === 3) {
                    updateReview();
                }
            };

            // Update review summary
            const updateReview = () => {
                const name = nameInput.value || '-';
                const description = descInput.value || 'No description';
                const selectedMembers = Array.from(modalDiv.querySelectorAll('input[name="members"]:checked'));

                modalDiv.querySelector('.review-name').textContent = name;
                modalDiv.querySelector('.review-description').textContent = description;
                modalDiv.querySelector('.review-members').textContent =
                    `${selectedMembers.length} member${selectedMembers.length !== 1 ? 's' : ''} selected`;

                // Show avatars
                const avatarsContainer = modalDiv.querySelector('.review-avatars');
                avatarsContainer.innerHTML = selectedMembers.slice(0, 5).map(cb => {
                    const card = cb.closest('.member-card');
                    const img = card.querySelector('img').src;
                    return `<img src="${img}" alt="Member" />`;
                }).join('');

                if (selectedMembers.length > 5) {
                    avatarsContainer.innerHTML += `<div class="more-count">+${selectedMembers.length - 5}</div>`;
                }
            };

            // Navigation handlers
            nextBtn.addEventListener('click', () => {
                if (currentStep === 1) {
                    if (!nameInput.value.trim()) {
                        nameInput.focus();
                        toast.error('Please enter a group name');
                        return;
                    }
                }

                if (currentStep < totalSteps) {
                    currentStep++;
                    showStep(currentStep);
                }
            });

            prevBtn.addEventListener('click', () => {
                if (currentStep > 1) {
                    currentStep--;
                    showStep(currentStep);
                }
            });

            // Close modal
            modalDiv.querySelector(".close-modal").addEventListener("click", () => {
                if (confirm('Are you sure? Your changes will be lost.')) {
                    modalDiv.remove();
                }
            });

            modalDiv.querySelector(".modal-overlay").addEventListener("click", (e) => {
                if (e.target.classList.contains("modal-overlay")) {
                    if (confirm('Are you sure? Your changes will be lost.')) {
                        modalDiv.remove();
                    }
                }
            });

            // Form submission
            form.addEventListener("submit", async (e) => {
                e.preventDefault();

                const selectedMembers = Array.from(modalDiv.querySelectorAll('input[name="members"]:checked'));

                if (selectedMembers.length === 0) {
                    toast.error('Please select at least one member');
                    currentStep = 2;
                    showStep(currentStep);
                    return;
                }

                submitBtn.disabled = true;
                const originalHTML = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i data-lucide="loader"></i> Creating...';
                createIcons({ icons });

                try {
                    await this.createGroup(form, modalDiv);
                } catch (err) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalHTML;
                    createIcons({ icons });
                }
            });

            document.body.appendChild(modalDiv);
            createIcons({ icons });
        } catch (err) {
            console.error('Error loading students:', err);
            toast.error('Failed to load students');
        }
    }

    templateGroupInfoModal(group) {
        const isCreator = group.creator._id === appStore.getAuthUser()._id;
        const isLecturer = appStore.getAuthUser().role === 'Lecturer';

        return `
      <div class="modal-overlay">
        <div class="modal-content group-info-modal">
          <div class="modal-header">
            <h2>${group.name}</h2>
            <button class="close-modal"><i data-lucide="X"></i></button>
          </div>
          <div class="group-info-content">
            <div class="group-description">
              <p>${group.description || 'No description'}</p>
              <small>Created by ${group.creator?.fullname || 'Unknown'}</small>
            </div>
            
            <div class="group-members-section">
              <h3>Members (${group.members?.length || 0})</h3>
              <ul class="group-members-list">
                ${group.members?.map(member => `
                  <li>
                    <img src="${member.user.profilePic || avatar}" alt="${member.user.fullname}" />
                    <div class="member-info">
                      <span class="member-name">${member.user.fullname}</span>
                      <small>${member.user.role}</small>
                    </div>
                    ${isCreator && member.user._id !== group.creator._id ? `
                      <button class="btn-remove-member" data-user-id="${member.user._id}">
                        <i data-lucide="user-minus"></i>
                      </button>
                    ` : ''}
                  </li>
                `).join('')}
              </ul>
            </div>

            ${isLecturer && group.groupType !== 'general' ? `
              <div class="group-actions-section">
                ${isCreator ? `
                  <button class="btn-add-members">
                    <i data-lucide="user-plus"></i> Add Members
                  </button>
                  <button class="btn-delete-group">
                    <i data-lucide="trash-2"></i> Delete Group
                  </button>
                ` : ''}
              </div>
            ` : ''}

            ${!isLecturer && group.groupType !== 'general' ? `
              <button class="btn-leave-group">
                <i data-lucide="log-out"></i> Leave Group
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    }

    onBookSelect(e) {
        const li = e.target.closest("li");

        if (!li?.classList.contains("book-item")) return;

        const bookId = li.dataset.bookId;
        const book = appStore.getBooks().find((b) => b._id === bookId);


        if (book) {
            // Directly fetch and render the book instead of just setting it
            this.fetchAndRenderBook(bookId);
        }
    }

    async fetchAndRenderBook(bookId) {
        try {
            const res = await axiosInstance.get(`/books/${bookId}`);
            const bookData = res.data;

            // Clear chat selection first, then set book
            appStore.setSelectedChat(null);
            appStore.setSelectedBook(bookData);
            appStore.setLastViewedBook(bookData); // SAVE LAST VIEWED BOOK
        } catch (err) {
            console.error("Error fetching book:", err);
            toast.error("Failed to load book details");
        }
    }

    async renderBookView(mainContentElem, selectedBook) {
    

        if (!selectedBook) {
            mainContentElem.innerHTML = `
        <div class="no-conversation">
          <i data-lucide="book"></i>
          <p>Select a book to view details</p>
        </div>`;
            createIcons({ icons });
            return;
        }

        const role = appStore.getAuthUser().role;
        const isLecturer = role === 'Lecturer';

        try {
            const bookData = selectedBook.waitingList && Array.isArray(selectedBook.waitingList) &&
                selectedBook.waitingList.length > 0 &&
                typeof selectedBook.waitingList[0] === 'object'
                ? selectedBook
                : (await axiosInstance.get(`/books/${selectedBook._id}`)).data;

            const existingBookView = mainContentElem.querySelector(".book-view");
            const bookDiv = document.createElement("div");
            bookDiv.innerHTML = this.templateBookView(bookData, isLecturer);

            // Close button
            bookDiv.querySelector(".close-book").addEventListener("click", () => {
                appStore.setSelectedBook(null);
                appStore.setLastViewedBook(null); // CLEAR LAST VIEWED WHEN CLOSED
                mainContentElem.innerHTML = `
            <div class="no-conversation">
              <i data-lucide="book"></i>
              <p>Select a book to view details</p>
            </div>`;
                createIcons({ icons });
            });

            // Lecturer actions
            if (isLecturer) {
                bookDiv.querySelectorAll(".btn-approve").forEach(btn => {
                    btn.addEventListener("click", async (e) => {
                        const studentId = e.currentTarget.dataset.studentId;
                        await this.approveStudent(bookData._id, studentId);
                    });
                });

                bookDiv.querySelectorAll(".btn-decline").forEach(btn => {
                    btn.addEventListener("click", async (e) => {
                        const studentId = e.currentTarget.dataset.studentId;
                        if (confirm("Are you sure you want to decline this request?")) {
                            await this.declineStudent(bookData._id, studentId);
                        }
                    });
                });
            } else {
                const requestBtn = bookDiv.querySelector(".btn-request");
                if (requestBtn) {
                    requestBtn.addEventListener("click", async () => {
                        await this.requestBook(bookData._id);
                    });
                }

                const downloadBtn = bookDiv.querySelector(".btn-download");
                if (downloadBtn) {
                    downloadBtn.addEventListener("click", async () => {
                        await this.downloadBook(bookData._id);
                    });
                }
            }

            if (existingBookView) {
                existingBookView.replaceWith(bookDiv.firstElementChild);
            } else {
                mainContentElem.innerHTML = "";
                mainContentElem.appendChild(bookDiv.firstElementChild);
            }

            createIcons({ icons });
        } catch (err) {
            console.error("Error rendering book view:", err);
            toast.error("Failed to load book details");
            mainContentElem.innerHTML = `
        <div class="no-conversation">
          <i data-lucide="book"></i>
          <p>Failed to load book details</p>
        </div>`;
            createIcons({ icons });
        }
    }


    showUploadModal(mainContentElem) {
        const modalDiv = document.createElement("div");
        modalDiv.innerHTML = this.templateUploadBookModal();

        modalDiv.querySelector(".close-modal").addEventListener("click", () => {
            modalDiv.remove();
        });

        modalDiv.querySelector(".modal-overlay").addEventListener("click", (e) => {
            if (e.target.classList.contains("modal-overlay")) {
                modalDiv.remove();
            }
        });

        modalDiv.querySelector(".upload-book-form").addEventListener("submit", async (e) => {
            e.preventDefault();
            await this.uploadBook(e.target, modalDiv);
        });

        document.body.appendChild(modalDiv);
        createIcons({ icons });
    }

    async uploadBook(form, modalDiv) {
        try {
            const formData = new FormData(form);

            // ENDPOINT: POST /api/books/upload (with multipart/form-data)
            const res = await axiosInstance.post("/books/upload", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success("Book uploaded successfully!");
            modalDiv.remove();

            await this.fetchBooks();
        } catch (err) {
            console.error("Error uploading book:", err);
            toast.error(err.response?.data?.message || "Failed to upload book");
        }
    }

    async approveStudent(bookId, studentId) {
        try {
            const res = await axiosInstance.put(`/books/${bookId}/add-student/${studentId}`);
            toast.success("Student approved successfully!");

            // SEND SOCKET EVENT to notify student
            socket.emit("book_approval_update", {
                bookId,
                studentId,
                action: 'approved'
            });

            socket.emit("book_updated", {
                bookId,
                affectedUsers: [studentId, appStore.getAuthUser()._id]
            });

            await this.fetchAndRenderBook(bookId);
            await this.fetchBooks();
        } catch (err) {
            console.error("Error approving student:", err);
            toast.error("Failed to approve student");
        }
    }

    async requestBook(bookId) {
        try {
            const res = await axiosInstance.put(`/books/request-to-download-book/${bookId}`);
            toast.success("Download request sent!");

            //  SEND SOCKET EVENT to notify lecturer
            const bookData = await axiosInstance.get(`/books/${bookId}`);
            const lecturerId = bookData.data.author?._id || bookData.data.author;

            socket.emit("book_request", {
                bookId,
                studentId: appStore.getAuthUser()._id,
                lecturerId: lecturerId
            });

            await this.fetchAndRenderBook(bookId);
            await this.fetchBooks();
        } catch (err) {
            console.error("Error requesting book:", err);
            if (err.response?.data?.code === 'ALREADY_APPROVED') {
                toast.info("You are already approved for this book!");
                await this.fetchAndRenderBook(bookId);
            } else if (err.response?.data?.code === 'ALREADY_WAITING') {
                toast.info("Request already pending!");
            } else {
                toast.error(err.response?.data?.message || "Failed to request book");
            }
        }
    }

    async downloadBook(bookId) {
        try {
            // Use axios to download with proper authentication
            const res = await axiosInstance.get(`/books/download/${bookId}`, {
                responseType: 'blob' // Important for file download
            });

            // Get filename from Content-Disposition header or use default
            const contentDisposition = res.headers['content-disposition'];
            let filename = 'book.pdf';

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                }
            }

            // Create blob and download
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("Download started!");
        } catch (err) {
            console.error("Error downloading book:", err);

            if (err.response?.status === 403) {
                toast.error("You don't have permission to download this book");
            } else if (err.response?.status === 404) {
                toast.error("Book file not found");
            } else {
                toast.error(err.response?.data?.message || "Failed to download book");
            }
        }
    }

    async declineStudent(bookId, studentId) {
        try {
            const res = await axiosInstance.delete(`/books/${bookId}/waiting-list/${studentId}`);
            toast.success("Student request declined!");

            // SEND SOCKET EVENT to notify student
            socket.emit("book_approval_update", {
                bookId,
                studentId,
                action: 'declined'
            });

            socket.emit("book_updated", {
                bookId,
                affectedUsers: [studentId, appStore.getAuthUser()._id]
            });

            await this.fetchAndRenderBook(bookId);
            await this.fetchBooks();
        } catch (err) {
            console.error("Error declining student:", err);
            toast.error(err.response?.data?.message || "Failed to decline request");
        }
    }

    async fetchBooks() {
        try {
            const role = appStore.getAuthUser().role;
            let res;

            if (role === 'Lecturer') {
                // ENDPOINT: GET /api/books/my-books
                res = await axiosInstance.get("/books/my-books");
            } else {
                // ENDPOINT: GET /api/books/my-level
                res = await axiosInstance.get("/books/my-level");
            }

            appStore.setBooks(res.data);
        } catch (err) {
            console.error("Error fetching books:", err);
            toast.error("Failed to load books");
        }
    }

    async sendMessage(e, textInput, imageData, messagesElem, selectedImagesElem, clearImageData) {
        e.preventDefault();

        const messageText = textInput.value;

        if (!messageText && !imageData) return;

        try {
            const sender = appStore.getAuthUser();
            const receiver = appStore.getSelectedChat();

            
            socket.emit("send_message", {
                senderId: sender._id,
                senderType: sender.role,
                receiverId: receiver._id,
                text: messageText,
                image: imageData || null,
            });

            textInput.value = "";
            selectedImagesElem.innerHTML = "";
            clearImageData();
        } catch (err) {
            toast.error("Error sending message");
            console.error("Error sending message:", err?.response?.data?.message || err);
        }
    }

    /* ===============================
     *  MESSAGE FETCHING
     * =============================== */
    async fetchMessages(messagesElem) {
        if (!appStore.getSelectedChat()) return;
        try {
            const chatId = appStore.getSelectedChat()._id;
            const res = await axiosInstance.get(`/messages/conversation/${chatId}`);
            const messages = res.data.messages || [];

            messagesElem.innerHTML = "";
            messages.forEach((msg) => {
                const li = document.createElement("li");
                li.classList.add("message", msg.sender === appStore.getAuthUser()._id ? "me" : "them");
                li.innerHTML = `
          ${msg.image ? `<div><img src="${msg.image}" alt=""/></div>` : ""}
          ${msg.text ? `<p class="text">${msg.text}</p>` : ""}
        `;
                messagesElem.appendChild(li);
            });
            messagesElem.scrollTop = messagesElem.scrollHeight;
        } catch (err) {
            console.error("Error fetching messages:", err?.response?.data?.message || err);
            toast.error("Failed to load messages");
        }
    }

    /* ===============================
     *  PROFILE & AUTH ACTIONS
     * =============================== */
    async onProfilePicChange(e, elem) {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const imageURL = e.target.result;
            try {
                const res = await axiosInstance.put("/auth/updateProfilePic", { imageURL });
                elem.src = imageURL;
                toast.success(res.data.message);
            } catch {
                toast.error("Error updating profile picture");
            }
        };
        reader.readAsDataURL(file);
    }

    async onLogout() {
        try {
            const res = await axiosInstance.post("/auth/logOut");
            toast.success(res.data.message);
            location.reload();
        } catch (err) {
            console.error("Error logging out:", err?.response?.data?.message || err);
        }
    }

    /* ===============================
     *  DATA FETCHING (TABS)
     * =============================== */
    async onTabSwitch(tab) {
        const mainContentElem = document.querySelector(".main-content");

        const handlers = {
            chats: async () => {
                await this.fetchChats();
                const lastChat = appStore.getLastViewedChat();
                if (lastChat) {
                    // Find the chat in the current chats list to ensure it still exists
                    const currentChat = appStore.getChats().find(c => c._id === lastChat._id);
                    if (currentChat) {
                        appStore.setSelectedBook(null);
                        appStore.setSelectedGroup(null);
                        appStore.setSelectedChat(currentChat);
                    } else {
                        // Chat no longer exists, clear it
                        appStore.setLastViewedChat(null);
                        this.showWelcomeMessage(mainContentElem);
                        createIcons({ icons });
                    }
                } else {
                    this.showWelcomeMessage(mainContentElem);
                    createIcons({ icons });
                }
            },
            groups: async () => {
                await this.fetchGroups();
                const lastGroup = appStore.getLastViewedGroup();
                if (lastGroup) {
                    // Find the group in the current groups list
                    const currentGroup = appStore.getGroups().find(g => g._id === lastGroup._id);
                    if (currentGroup) {
                        appStore.setSelectedChat(null);
                        appStore.setSelectedBook(null);
                        appStore.setSelectedGroup(currentGroup);
                    } else {
                        appStore.setLastViewedGroup(null);
                        this.showWelcomeMessage(mainContentElem);
                        createIcons({ icons });
                    }
                } else {
                    this.showWelcomeMessage(mainContentElem);
                    createIcons({ icons });
                }
            },
            lecturers: async () => {
                await this.fetchLecturers();
                const lastChat = appStore.getLastViewedChat();
                if (lastChat) {
                    // Find the lecturer in the current contacts list
                    const currentLecturer = appStore.getContacts().find(c => c._id === lastChat._id);
                    if (currentLecturer) {
                        appStore.setSelectedBook(null);
                        appStore.setSelectedGroup(null);
                        appStore.setSelectedChat(currentLecturer);
                    } else {
                        appStore.setLastViewedChat(null);
                        this.showWelcomeMessage(mainContentElem);
                        createIcons({ icons });
                    }
                } else {
                    this.showWelcomeMessage(mainContentElem);
                    createIcons({ icons });
                }
            },
            students: async () => {
                await this.fetchStudents();
                const lastChat = appStore.getLastViewedChat();
                if (lastChat) {
                    // Find the student in the current contacts list
                    const currentStudent = appStore.getContacts().find(c => c._id === lastChat._id);
                    if (currentStudent) {
                        appStore.setSelectedBook(null);
                        appStore.setSelectedGroup(null);
                        appStore.setSelectedChat(currentStudent);
                    } else {
                        appStore.setLastViewedChat(null);
                        this.showWelcomeMessage(mainContentElem);
                        createIcons({ icons });
                    }
                } else {
                    this.showWelcomeMessage(mainContentElem);
                    createIcons({ icons });
                }
            },
            books: async () => {
                await this.fetchBooks();
                const lastBook = appStore.getLastViewedBook();
                if (lastBook) {
                    // Find the book in the current books list
                    const currentBook = appStore.getBooks().find(b => b._id === lastBook._id);
                    if (currentBook) {
                        appStore.setSelectedChat(null);
                        appStore.setSelectedGroup(null);
                        await this.fetchAndRenderBook(lastBook._id);
                    } else {
                        appStore.setLastViewedBook(null);
                        this.showWelcomeMessage(mainContentElem);
                        createIcons({ icons });
                    }
                } else {
                    this.showWelcomeMessage(mainContentElem);
                    createIcons({ icons });
                }
            },
        };
        if (handlers[tab]) handlers[tab]();
    }


    async fetchLecturers() {
        try {
            const res = await axiosInstance.get("/lecturer");
            appStore.setContacts(res.data);
        } catch (err) {
            console.error("Error fetching lecturers:", err?.response?.data?.message || err);
        }
    }

    async fetchStudents() {
        try {
            const res = await axiosInstance.get("/student");
            appStore.setContacts(res.data);
        } catch (err) {
            console.error("Error fetching students:", err?.response?.data?.message || err);
        }
    }

    async fetchChats() {
        try {
            const res = await axiosInstance.get("/messages/myChats");
            appStore.setChats(res.data);
        } catch (err) {
            console.error("Error fetching chats:", err?.response?.data?.message || err);
            toast.error("Failed to load chats");
        }
    }

    /* ===============================
     *  UNREAD COUNTS
     * =============================== */
    async loadUnreadCounts() {
        try {
            const res = await axiosInstance.get("/messages/unreadCounts");
            const unreadCounts = res.data.unreadCounts;
            

            // Load unread counts into appStore
            Object.keys(unreadCounts).forEach(userId => {
                appStore.setUnreadCount(userId, unreadCounts[userId]);
            });
        } catch (err) {
            console.error("Error loading unread counts:", err?.response?.data?.message || err);
        }
    }

    /* ===============================
     *  NOTIFICATION METHODS
     * =============================== */

    async loadNotifications() {
        try {
            const res = await axiosInstance.get("/notifications");
            appStore.setNotifications(res.data.notifications);
            appStore.setNotificationCount(res.data.unreadCount);
            this.updateNotificationBadge(res.data.unreadCount);
        } catch (err) {
            console.error("Error loading notifications:", err);
        }
    }

    updateNotificationBadge(count) {
        const badge = document.querySelector(".notification-badge");
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = "block";
            } else {
                badge.style.display = "none";
            }
        }
    }

    renderNotifications() {
        const notificationList = document.querySelector(".notification-list");
        if (!notificationList) return;

        const notifications = appStore.getNotifications();

        // Clear list first
        notificationList.innerHTML = "";

        if (notifications.length === 0) {
            notificationList.innerHTML = `
            <li class="empty-notification">
                <i data-lucide="bell-off"></i>
                <p>No notifications</p>
            </li>
        `;
            createIcons({ icons });
            return;
        }

        notifications.forEach(notif => {
            const li = document.createElement("li");
            li.classList = (`notification-item ${notif.isRead ? 'read' : 'unread'}`);
            li.dataset.notifId = notif._id;

            li.innerHTML = `
            <div class="notif-avatar">
                ${notif.sender?.profilePic
                    ? `<img src="${notif.sender.profilePic}" alt="${notif.sender.fullname}" />`
                    : `<i data-lucide="bell"></i>`
                }
            </div>
            <div class="notif-content">
                <h4>${notif.title}</h4>
                <p>${notif.message}</p>
                <small>${this.formatNotificationTime(notif.createdAt)}</small>
            </div>
            <button class="notif-delete" data-notif-id="${notif._id}">
                <i data-lucide="x"></i>
            </button>
        `;
            notificationList.appendChild(li);
        });

        createIcons({ icons });

        // Add click handlers
        notificationList.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                if (e.target.closest('.notif-delete')) return;

                const notifId = item.dataset.notifId;
                await this.markNotificationAsRead(notifId);

                const notification = notifications.find(n => n._id === notifId);
                if (notification) {
                    this.handleNotificationClick(notification);
                }
            });
        });

        // Delete buttons - FIX: Stop propagation and handle properly
        notificationList.querySelectorAll(".notif-delete").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                e.stopPropagation(); // CRITICAL: Stop event bubbling

                const notifId = btn.dataset.notifId;
                const notification = e.target.closest(".notification-item");

                await this.deleteNotification(notifId);
                notification.remove();

                // Check if list is now empty and show empty state
                const remainingNotifs = appStore.getNotifications();
                if (remainingNotifs.length === 0) {
                    notificationList.innerHTML = `
                    <li class="empty-notification">
                        <i data-lucide="bell-off"></i>
                        <p>No notifications</p>
                    </li>
                `;
                    createIcons({ icons });
                }
            });
        });
    }

    async markNotificationAsRead(notifId) {
        try {
            await axiosInstance.put(`/notifications/${notifId}/read`);
            appStore.decrementNotificationCount();
            await this.loadNotifications();
        } catch (err) {
            console.error("Error marking as read:", err);
        }
    }

    async markAllNotificationsRead() {
        try {
            await axiosInstance.put("/notifications/read-all");
            appStore.setNotificationCount(0);
            await this.loadNotifications();
            toast.success("All notifications marked as read");
        } catch (err) {
            console.error("Error marking all as read:", err);
            toast.error("Failed to mark all as read");
        }
    }

    async deleteNotification(notifId) {
        try {
            await axiosInstance.delete(`/notifications/${notifId}`);
            await this.loadNotifications();
            toast.success("Notification deleted");
        } catch (err) {
            console.error("Error deleting notification:", err);
            toast.error("Failed to delete notification");
        }
    }

    handleNotificationClick(notification) {
        const dropdown = document.querySelector('.notification-dropdown');
        if (dropdown) dropdown.classList.remove("show");

        switch (notification.type) {
            case 'message':
                // Find the sender in contacts/chats
                const senderId = notification.metadata?.senderId;
                if (senderId) {
                    // Try to find in contacts first
                    let contact = appStore.getContacts().find(c => c._id === senderId);

                    // If not in contacts, try chats
                    if (!contact) {
                        contact = appStore.getChats().find(c => c._id === senderId);
                    }

                    if (contact) {
                        // Set the selected chat
                        appStore.setSelectedChat(contact);
                        appStore.setSelectedBook(null);
                        appStore.setSelectedGroup(null);

                        // Switch to chats tab
                        const chatsTab = document.querySelector('.tab-section li:first-child');
                        if (chatsTab) chatsTab.click();
                    }
                }
                break;

            case 'group_invite':
            case 'group_message':
                if (notification.metadata?.groupId) {
                    this.fetchAndRenderGroup(notification.metadata.groupId);
                    // Switch to groups tab
                    const groupsTab = document.querySelector('.tab-section li:nth-child(2)');
                    if (groupsTab) groupsTab.click();
                }
                break;

            case 'book_approved':
            case 'book_declined':
            case 'book_request':
                // Switch to books tab
                const booksTab = document.querySelector('.tab-section li:nth-child(4)');
                if (booksTab) booksTab.click();
                break;
        }
    }

    formatNotificationTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    }

    /* ===============================
     *  GROUP METHODS
     * =============================== */

    async fetchGroups() {
        try {
            const res = await axiosInstance.get("/groups");
            appStore.setGroups(res.data);
        } catch (err) {
            console.error("Error fetching groups:", err);
            toast.error("Failed to load groups");
        }
    }

    onGroupSelect(e) {
        const li = e.target.closest("li");
        if (!li?.classList.contains("group-item")) return;

        const groupId = li.dataset.groupId;
        const group = appStore.getGroups().find((g) => g._id === groupId);

        if (group) {
            this.fetchAndRenderGroup(groupId);
        }
    }

    async fetchAndRenderGroup(groupId) {
        try {
            const res = await axiosInstance.get(`/groups/${groupId}`);
            const groupData = res.data;

            appStore.setSelectedChat(null);
            appStore.setSelectedBook(null);
            appStore.setSelectedGroup(groupData);
            appStore.setLastViewedGroup(groupData); // ADD THIS LINE
        } catch (err) {
            console.error("Error fetching group:", err);
            toast.error("Failed to load group details");
        }
    }

    async renderGroupConversation(mainContentElem, selectedGroup) {
        
        if (!selectedGroup) {
            mainContentElem.innerHTML = `
            <div class="no-conversation">
                <i data-lucide="users"></i>
                <p>Select a group to start chatting</p>
            </div>`;
            createIcons({ icons });
            return;
        }

        const groupDiv = document.createElement("div");
        groupDiv.classList.add("conversation", "group-conversation");
        groupDiv.innerHTML = this.templateGroupConversation(selectedGroup);

        // Close group
        groupDiv.querySelector(".btn-close-group").addEventListener("click", () => {
            appStore.setSelectedGroup(null);
            appStore.setLastViewedGroup(null); // ADD THIS LINE
            mainContentElem.innerHTML = "";
            this.showWelcomeMessage(mainContentElem);
            createIcons({ icons });
        });

        // Group info button
        const infoBtn = groupDiv.querySelector(".btn-group-info");
        if (infoBtn) {
            infoBtn.addEventListener("click", () => {
                this.showGroupInfoModal(selectedGroup);
            });
        }

        // Message handling
        const messageForm = groupDiv.querySelector(".message-input-container");
        const selectedImagesElem = groupDiv.querySelector(".selected-images");
        const messagesElem = groupDiv.querySelector(".messages");
        const textInput = messageForm.querySelector("input[type='text']");
        const imageInput = messageForm.querySelector("input[type='file']");
        const sendButton = messageForm.querySelector("button[type='submit']");

        let selectedImageData = null;

        messageForm.addEventListener("submit", (e) =>
            this.sendGroupMessage(e, textInput, selectedImageData, messagesElem, selectedImagesElem, selectedGroup._id, () => {
                selectedImageData = null;
            })
        );

        imageInput.addEventListener("change", (e) =>
            this.onImageSelect(e, sendButton, textInput, selectedImagesElem, (imageData) => {
                selectedImageData = imageData;
            }, () => {
                selectedImageData = null;
            })
        );

        textInput.addEventListener("keyup", (e) => {
            this.toggleSendButton(e.target.value, selectedImageData, sendButton);
        });

        // Fetch group messages
        await this.fetchGroupMessages(messagesElem, selectedGroup._id);

        mainContentElem.innerHTML = "";
        mainContentElem.appendChild(groupDiv);
        createIcons({ icons });
    }

    async fetchGroupMessages(messagesElem, groupId) {
        try {
            const res = await axiosInstance.get(`/messages/group/${groupId}`);
            const messages = res.data.messages || [];

            messagesElem.innerHTML = "";
            messages.forEach((msg) => {
                const li = document.createElement("li");
                const isMe = msg.sender._id === appStore.getAuthUser()._id;
                li.classList.add("message", isMe ? "me" : "them");

                li.innerHTML = `
                ${!isMe ? `<div class="message-sender">${msg.sender.fullname}</div>` : ''}
                ${msg.image ? `<div><img src="${msg.image}" alt=""/></div>` : ""}
                ${msg.text ? `<p class="text">${msg.text}</p>` : ""}
            `;
                messagesElem.appendChild(li);
            });
            messagesElem.scrollTop = messagesElem.scrollHeight;
        } catch (err) {
            console.error("Error fetching group messages:", err);
            toast.error("Failed to load messages");
        }
    }

    async sendGroupMessage(e, textInput, imageData, messagesElem, selectedImagesElem, groupId, clearImageData) {
        e.preventDefault();

        const messageText = textInput.value;
        if (!messageText && !imageData) return;

        try {
            socket.emit("send_group_message", {
                groupId,
                senderId: appStore.getAuthUser()._id,
                senderType: appStore.getAuthUser().role,
                text: messageText,
                image: imageData || null,
            });

            textInput.value = "";
            selectedImagesElem.innerHTML = "";
            clearImageData();
        } catch (err) {
            toast.error("Error sending message");
            console.error("Error sending message:", err);
        }
    }


    async createGroup(form, modalDiv) {
        try {
            const formData = new FormData(form);
            const memberCheckboxes = form.querySelectorAll('input[name="members"]:checked');
            const memberIds = Array.from(memberCheckboxes).map(cb => cb.value);

            const groupData = {
                name: formData.get('name'),
                description: formData.get('description'),
                memberIds: memberIds
            };

            const res = await axiosInstance.post("/groups", groupData);
            toast.success("Group created successfully!");
            modalDiv.remove();

            await this.fetchGroups();
        } catch (err) {
            console.error("Error creating group:", err);
            toast.error(err.response?.data?.message || "Failed to create group");
        }
    }

    async showGroupInfoModal(group) {
        // Fetch fresh group data
        const res = await axiosInstance.get(`/groups/${group._id}`);
        const groupData = res.data;

        const modalDiv = document.createElement("div");
        modalDiv.innerHTML = this.templateGroupInfoModal(groupData);

        modalDiv.querySelector(".close-modal").addEventListener("click", () => {
            modalDiv.remove();
        });

        const addMembersBtn = modalDiv.querySelector(".btn-add-members");
        if (addMembersBtn) {
            addMembersBtn.addEventListener("click", async () => {
                modalDiv.remove(); // Close the info modal
                this.showAddMembersModal(groupData); // Show add members modal
            });
        }

        // Delete group
        const deleteBtn = modalDiv.querySelector(".btn-delete-group");
        if (deleteBtn) {
            deleteBtn.addEventListener("click", async () => {
                if (confirm("Are you sure you want to delete this group?")) {
                    await this.deleteGroup(groupData._id);
                    modalDiv.remove();
                }
            });
        }

        // Leave group
        const leaveBtn = modalDiv.querySelector(".btn-leave-group");
        if (leaveBtn) {
            leaveBtn.addEventListener("click", async () => {
                if (confirm("Are you sure you want to leave this group?")) {
                    await this.leaveGroup(groupData._id);
                    modalDiv.remove();
                }
            });
        }

        // Remove member buttons
        modalDiv.querySelectorAll(".btn-remove-member").forEach(btn => {
            btn.addEventListener("click", async () => {
                const userId = btn.dataset.userId;
                if (confirm("Remove this member from the group?")) {
                    await this.removeMember(groupData._id, userId);
                    modalDiv.remove();
                    await this.showGroupInfoModal(group); // Refresh
                }
            });
        });

        document.body.appendChild(modalDiv);
        createIcons({ icons });
    }

    async showAddMembersModal(group) {
        try {
            // Fetch ALL students (not just contacts)
            const studentsRes = await axiosInstance.get("/student");
            const allStudents = studentsRes.data;

            // Filter out students who are already in the group
            const currentMemberIds = group.members.map(m => m.user._id || m.user);
            const availableStudents = allStudents.filter(student =>
                !currentMemberIds.includes(student._id)
            );

            const modalHTML = `
          <div class="modal-overlay">
            <div class="modal-content">
              <div class="modal-header">
                <h2>Add Members to ${group.name}</h2>
                <button class="close-modal"><i data-lucide="X"></i></button>
              </div>
              <div class="add-members-content">
                ${availableStudents.length > 0 ? `
                  <div class="search-members">
                    <i data-lucide="search"></i>
                    <input 
                      type="text" 
                      class="member-search-input" 
                      placeholder="Search students..."
                    />
                    <button type="button" class="clear-member-search" style="display: none;">
                      <i data-lucide="x"></i>
                    </button>
                  </div>

                  <div class="members-grid">
                    ${availableStudents.map(student => `
                      <label class="member-card">
                        <input type="checkbox" name="new-members" value="${student._id}" />
                        <div class="member-card-content">
                          <div class="member-avatar">
                            <img src="${student.profilePic || avatar}" alt="${student.fullname}" />
                            <div class="check-overlay">
                              <i data-lucide="check"></i>
                            </div>
                          </div>
                          <div class="member-info">
                            <span class="member-name">${student.fullname}</span>
                            <small class="member-level">${student.level || 'Student'}</small>
                          </div>
                        </div>
                      </label>
                    `).join('')}
                  </div>

                  <div class="modal-actions">
                    <button class="btn-cancel">Cancel</button>
                    <button class="btn-add-selected" disabled>
                      <i data-lucide="user-plus"></i> Add Selected
                    </button>
                  </div>
                ` : `
                  <div class="no-members">
                    <i data-lucide="user-check"></i>
                    <p>All students are already in this group</p>
                  </div>
                `}
              </div>
            </div>
          </div>
        `;

            const modalDiv = document.createElement("div");
            modalDiv.innerHTML = modalHTML;

            // Search functionality
            const searchInput = modalDiv.querySelector('.member-search-input');
            const clearSearchBtn = modalDiv.querySelector('.clear-member-search');

            searchInput?.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase().trim();
                clearSearchBtn.style.display = searchTerm ? 'flex' : 'none';

                const memberCards = modalDiv.querySelectorAll('.member-card');
                memberCards.forEach(card => {
                    const name = card.querySelector('.member-name').textContent.toLowerCase();
                    card.style.display = name.includes(searchTerm) ? '' : 'none';
                });
            });

            clearSearchBtn?.addEventListener('click', () => {
                searchInput.value = '';
                clearSearchBtn.style.display = 'none';
                modalDiv.querySelectorAll('.member-card').forEach(card => {
                    card.style.display = '';
                });
            });

            // Update button state
            const addBtn = modalDiv.querySelector('.btn-add-selected');
            const updateButtonState = () => {
                const selected = modalDiv.querySelectorAll('input[name="new-members"]:checked').length;
                if (addBtn) {
                    addBtn.disabled = selected === 0;
                    const icon = '<i data-lucide="user-plus"></i>';
                    addBtn.innerHTML = selected > 0
                        ? `${icon} Add ${selected} Member${selected > 1 ? 's' : ''}`
                        : `${icon} Add Selected`;
                    createIcons({ icons });
                }
            };

            modalDiv.querySelectorAll('input[name="new-members"]').forEach(cb => {
                cb.addEventListener('change', updateButtonState);
            });

            // Close handlers
            modalDiv.querySelector('.close-modal')?.addEventListener('click', () => {
                modalDiv.remove();
            });

            modalDiv.querySelector('.btn-cancel')?.addEventListener('click', () => {
                modalDiv.remove();
            });

            modalDiv.querySelector('.modal-overlay')?.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-overlay')) {
                    modalDiv.remove();
                }
            });

            // Add members handler
            addBtn?.addEventListener('click', async () => {
                const selectedIds = Array.from(
                    modalDiv.querySelectorAll('input[name="new-members"]:checked')
                ).map(cb => cb.value);

                if (selectedIds.length === 0) return;

                try {
                    addBtn.disabled = true;
                    addBtn.innerHTML = '<i data-lucide="loader"></i> Adding...';
                    createIcons({ icons });

                    await axiosInstance.post(`/groups/${group._id}/members`, {
                        memberIds: selectedIds
                    });

                    toast.success(`Added ${selectedIds.length} member${selectedIds.length > 1 ? 's' : ''}`);
                    modalDiv.remove();

                    // Refresh groups list
                    await this.fetchGroups();

                    // Reopen group info modal with fresh data
                    await this.showGroupInfoModal(group);
                } catch (err) {
                    console.error('Error adding members:', err);
                    toast.error(err.response?.data?.message || 'Failed to add members');

                    addBtn.disabled = false;
                    addBtn.innerHTML = '<i data-lucide="user-plus"></i> Add Selected';
                    createIcons({ icons });
                }
            });

            document.body.appendChild(modalDiv);
            createIcons({ icons });
        } catch (err) {
            console.error('Error loading students:', err);
            toast.error('Failed to load students');
        }
    }

    async deleteGroup(groupId) {
        try {
            await axiosInstance.delete(`/groups/${groupId}`);
            toast.success("Group deleted");
            appStore.setSelectedGroup(null);
            await this.fetchGroups();
        } catch (err) {
            console.error("Error deleting group:", err);
            toast.error("Failed to delete group");
        }
    }

    async leaveGroup(groupId) {
        try {
            await axiosInstance.post(`/groups/${groupId}/leave`);
            toast.success("Left group");
            appStore.setSelectedGroup(null);
            await this.fetchGroups();
        } catch (err) {
            console.error("Error leaving group:", err);
            toast.error("Failed to leave group");
        }
    }

    async removeMember(groupId, userId) {
        try {
            await axiosInstance.delete(`/groups/${groupId}/members/${userId}`);
            toast.success("Member removed");
            await this.fetchGroups();
        } catch (err) {
            console.error("Error removing member:", err);
            toast.error("Failed to remove member");
        }
    }
}

