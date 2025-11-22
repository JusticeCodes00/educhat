import { createIcons, icons } from "lucide";
import PubSub from "pubsub-js";
import { SHOW_HOME, SHOW_LOGIN, SHOW_SIGNUP } from "../utils/topics.js";

export default class HomePage {
    constructor(parent = document.body) {
        this.render(parent)
        this.wrapper = null;
        this.authFromFirstRender = null;
    }

    render(parent) {
        PubSub.subscribe(SHOW_HOME, () => {
            this.wrapper = document.createElement("div");
            this.wrapper.classList.add("home-page");
            this.wrapper.innerHTML = this.template();

            if (this.authFromFirstRender) {
                parent.appendChild(this.authFromFirstRender)
                return;
            }

            this.authFromFirstRender = this.wrapper;

            parent.appendChild(this.wrapper);
            createIcons({ icons });

            this.initListeners(this.wrapper);
        })
    }

    template() {
        return `
            <!-- Navigation Bar -->
            <nav class="home-nav">
                <div class="nav-container">
                    <div class="nav-brand">
                        <i data-lucide="message-square-code"></i>
                        <span>EduChat</span>
                    </div>
                    <div class="nav-links">
                        <button class="nav-btn" data-action="login">
                            <i data-lucide="log-in"></i>
                            Login
                        </button>
                        <button class="nav-btn nav-btn-primary" data-action="register">
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            <!-- Hero Section -->
            <section class="hero-section">
                <div class="hero-container">
                    <div class="hero-content">
                        <h1 class="hero-title">
                            Academic Communication
                            <span class="gradient-text">Made Simple</span>
                        </h1>
                        <p class="hero-description">
                            Connect with your lecturers and classmates. Share resources, 
                            chat in real-time, and access academic materials all in one place.
                        </p>
                        <div class="hero-buttons">
                            <button class="btn-large btn-primary" data-action="register">
                                <i data-lucide="user-plus"></i>
                                Create Account
                            </button>
                            <button class="btn-large btn-secondary" data-action="login">
                                <i data-lucide="log-in"></i>
                                Sign In
                            </button>
                        </div>
                    </div>
                    <div class="hero-visual">
                        <div class="demo-window">
                            <div class="demo-header">
                                <div class="demo-dots">
                                    <span></span><span></span><span></span>
                                </div>
                                <span>EduChat</span>
                            </div>
                            <div class="demo-content">
                                <div class="demo-sidebar">
                                    <div class="demo-item active">
                                        <i data-lucide="message-circle"></i>
                                        <span>Chats</span>
                                    </div>
                                    <div class="demo-item">
                                        <i data-lucide="users"></i>
                                        <span>Groups</span>
                                    </div>
                                    <div class="demo-item">
                                        <i data-lucide="book"></i>
                                        <span>Books</span>
                                    </div>
                                </div>
                                <div class="demo-main">
                                    <div class="demo-chat-header">
                                        <div class="demo-avatar"></div>
                                        <div>
                                            <strong>Dr. Johnson</strong>
                                            <small>Online</small>
                                        </div>
                                    </div>
                                    <div class="demo-messages">
                                        <div class="demo-message received">
                                            <p>Hello! The assignment deadline is Friday</p>
                                        </div>
                                        <div class="demo-message sent">
                                            <p>Thank you, I'll submit it on time!</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Features Section -->
            <section class="features-section">
                <div class="section-container">
                    <div class="section-header">
                        <h2>Core Features</h2>
                        <p>Everything you need for effective communication</p>
                    </div>
                    <div class="features-grid">
                        <div class="feature-card">
                            <div class="feature-icon">
                                <i data-lucide="message-circle"></i>
                            </div>
                            <h3>Real-Time Chat</h3>
                            <p>Instant messaging with lecturers and students. See online status and typing indicators.</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">
                                <i data-lucide="book-open"></i>
                            </div>
                            <h3>Book Management</h3>
                            <p>Lecturers upload materials, students request access. Simple approval system.</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">
                                <i data-lucide="users"></i>
                            </div>
                            <h3>Group Chats</h3>
                            <p>Create groups for classes or projects. Collaborate with multiple people at once.</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">
                                <i data-lucide="image"></i>
                            </div>
                            <h3>File Sharing</h3>
                            <p>Share images and documents directly in conversations.</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">
                                <i data-lucide="bell"></i>
                            </div>
                            <h3>Notifications</h3>
                            <p>Get notified about new messages, book approvals, and group invites.</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">
                                <i data-lucide="search"></i>
                            </div>
                            <h3>Smart Search</h3>
                            <p>Quickly find contacts, conversations, and books with built-in search.</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- How It Works -->
            <section class="how-section">
                <div class="section-container">
                    <div class="section-header">
                        <h2>How It Works</h2>
                        <p>Get started in three simple steps</p>
                    </div>
                    <div class="steps-container">
                        <div class="step-card">
                            <div class="step-number">1</div>
                            <h3>Sign Up</h3>
                            <p>Create your account as a student or lecturer</p>
                        </div>
                        <div class="step-card">
                            <div class="step-number">2</div>
                            <h3>Connect</h3>
                            <p>Start chatting with your lecturers or students</p>
                        </div>
                        <div class="step-card">
                            <div class="step-number">3</div>
                            <h3>Collaborate</h3>
                            <p>Share resources and communicate effectively</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- CTA Section -->
            <section class="cta-section">
                <div class="cta-container">
                    <h2>Ready to Get Started?</h2>
                    <p>Join your department's communication platform today</p>
                    <button class="btn-large btn-primary" data-action="register">
                        <i data-lucide="arrow-right"></i>
                        Create Your Account
                    </button>
                </div>
            </section>

            <!-- Footer -->
            <footer class="home-footer">
                <div class="footer-container">
                    <div class="footer-brand">
                        <i data-lucide="message-square-code"></i>
                        <span>EduChat</span>
                    </div>
                    <p>&copy; 2025 EduChat. Academic Communication Platform.</p>
                </div>
            </footer>
        `;
    }

    initListeners(wrapper) {
        wrapper.addEventListener("click", this.publishShowLoginTopic.bind(this))
        wrapper.addEventListener("click", this.publishShowRegisterTopic.bind(this))
    }

    publishShowRegisterTopic(e) {
        if (e.target.dataset.action !== "register" && !e.target.closest('[data-action="register"]')) return;
        this.wrapper?.remove();
        PubSub.publish(SHOW_SIGNUP);
    }

    publishShowLoginTopic(e) {
        if (e.target.dataset.action !== "login" && !e.target.closest('[data-action="login"]')) return;
        this.wrapper?.remove();
        PubSub.publish(SHOW_LOGIN);
    }
}