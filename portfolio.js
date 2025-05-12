// Basic in-memory database for contact form submissions
const contactDatabase = {
  submissions: [],
  
  // Add a new contact submission
  addSubmission: function(name, email, message) {
    const newSubmission = {
      id: Date.now(), // Simple unique ID
      name: name,
      email: email,
      message: message,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    // Add new submissions to the beginning for easier viewing
    this.submissions.unshift(newSubmission);
    this.saveToLocalStorage(); // Persist to localStorage
    return newSubmission;
  },
  
  // Get all submissions
  getAllSubmissions: function() {
    return this.submissions;
  },
  
  // Mark submission as read/unread
  markAsRead: function(id) {
    const submission = this.submissions.find(sub => sub.id === id);
    if (submission) {
      submission.read = !submission.read;
      this.saveToLocalStorage();
      return submission.read;
    }
    return false;
  },
  
  // Delete a submission
  deleteSubmission: function(id) {
    this.submissions = this.submissions.filter(sub => sub.id !== id);
    this.saveToLocalStorage();
  },
  
  // Count unread messages
  countUnread: function() {
    return this.submissions.filter(sub => !sub.read).length;
  },
  
  // Save to localStorage for persistence
  saveToLocalStorage: function() {
    localStorage.setItem('contactSubmissions', JSON.stringify(this.submissions));
  },
  
  // Load from localStorage
  loadFromLocalStorage: function() {
    const saved = localStorage.getItem('contactSubmissions');
    if (saved) {
      try {
        this.submissions = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load submissions from storage', e);
        this.submissions = [];
      }
    }
  }
};

// Admin authentication settings
const adminAuth = {
  // This should be changed to your preferred admin password
  password: "admin123", 
  
  // Check if user is logged in
  checkAuth: function() {
    return sessionStorage.getItem('adminLoggedIn') === 'true';
  },
  
  // Log in with password
  login: function(password) {
    if (password === this.password) {
      sessionStorage.setItem('adminLoggedIn', 'true');
      return true;
    }
    return false;
  },
  
  // Log out
  logout: function() {
    sessionStorage.removeItem('adminLoggedIn');
  },
  
  // Check sessionStorage for existing session
  checkSession: function() {
    return this.checkAuth();
  }
};

// Initialize database from localStorage
document.addEventListener('DOMContentLoaded', () => {
  contactDatabase.loadFromLocalStorage();
  
  // Initialize DOM elements and event listeners
  initializeApp();
});

function initializeApp() {
  // DOM Elements
  const header = document.getElementById('header');
  const mobileNavToggle = document.getElementById('mobileNavToggle');
  const mobileNav = document.getElementById('mobileNav');
  const mobileNavClose = document.getElementById('mobileNavClose');
  const contactForm = document.getElementById('contactForm');
  const adminLock = document.getElementById('admin-lock');
  const adminLoginContainer = document.getElementById('admin-login-container');
  const closeAdminLogin = document.getElementById('close-admin-login');
  const adminLoginForm = document.getElementById('admin-login-form');
  const messageViewerContainer = document.getElementById('message-viewer-container');
  const closeMessageViewer = document.getElementById('close-message-viewer');
  const adminLogout = document.getElementById('admin-logout');
  const currentYearElement = document.getElementById('currentYear');

  // Update current year in footer
  if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
  }

  // Update admin lock icon if there are unread messages
  updateAdminLockStatus();

  // Header scroll effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Mobile navigation toggle
  if (mobileNavToggle && mobileNav) {
    mobileNavToggle.addEventListener('click', () => {
      mobileNav.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      // Create overlay
      const overlay = document.createElement('div');
      overlay.classList.add('mobile-nav-overlay');
      document.body.appendChild(overlay);
      
      // Animate overlay
      setTimeout(() => {
        overlay.classList.add('active');
      }, 10);
      
      // Close when clicking overlay
      overlay.addEventListener('click', closeNav);
    });
  }

  // Close mobile navigation
  if (mobileNavClose) {
    mobileNavClose.addEventListener('click', closeNav);
  }

  // Contact form submission
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Get form data
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const message = document.getElementById('message').value.trim();
      
      // Validate form data
      if (!name || !email || !message) {
        showNotification('error', 'Please fill in all fields');
        return;
      }
      
      // Create loading state
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Sending...';
      submitBtn.disabled = true;
      
      // Simulate processing delay for better UX
      setTimeout(() => {
        try {
          // Add to our simple database
          const submission = contactDatabase.addSubmission(name, email, message);
          console.log('Contact form submission:', submission);
          
          // Show success message popup
          showSuccessPopup();
          contactForm.reset();
          
          // Update message display if it's visible
          if (document.getElementById('message-viewer')) {
            displayMessages();
          }
          
          // Update admin lock to show unread messages
          updateAdminLockStatus();
        } catch (error) {
          console.error('Error saving contact form submission:', error);
          showNotification('error', 'Something went wrong. Please try again.');
        } finally {
          // Restore button state
          submitBtn.innerHTML = originalBtnText;
          submitBtn.disabled = false;
        }
      }, 1000);
    });
  }

  // Admin lock in footer
  if (adminLock) {
    adminLock.addEventListener('click', (e) => {
      e.preventDefault();
      toggleMessageViewer();
    });
    
    // Add a pulse effect to the lock icon if there are unread messages
    if (contactDatabase.countUnread() > 0) {
      addPulseEffectToLock();
    }
  }

  // Admin login modal
  if (adminLoginContainer) {
    // Close admin login modal
    if (closeAdminLogin) {
      closeAdminLogin.addEventListener('click', () => {
        adminLoginContainer.classList.remove('active');
      });
    }

    // Admin login form submission
    if (adminLoginForm) {
      adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const password = document.getElementById('admin-password').value;
        if (adminAuth.login(password)) {
          adminLoginContainer.classList.remove('active');
          showNotification('success', 'Admin login successful');
          toggleMessageViewer();
        } else {
          showNotification('error', 'Incorrect password');
        }
      });
      
      // Press Enter to submit
      const passwordInput = document.getElementById('admin-password');
      if (passwordInput) {
        passwordInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            adminLoginForm.dispatchEvent(new Event('submit'));
          }
        });
      }
    }
  }

  // Message viewer modal
  if (messageViewerContainer) {
    // Close message viewer modal
    if (closeMessageViewer) {
      closeMessageViewer.addEventListener('click', () => {
        messageViewerContainer.classList.remove('active');
      });
    }

    // Admin logout
    if (adminLogout) {
      adminLogout.addEventListener('click', () => {
        adminAuth.logout();
        messageViewerContainer.classList.remove('active');
        showNotification('success', 'Admin logged out');
      });
    }
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && messageViewerContainer.classList.contains('active')) {
        messageViewerContainer.classList.remove('active');
      }
    });
  }

  // Secret keystroke combinations to access admin panel
  // Press 'A' key three times quickly to show admin login
  let keySequence = [];
  let keyTimeout;

  document.addEventListener('keydown', (e) => {
    // Clear timeout to reset sequence if too slow
    clearTimeout(keyTimeout);
    
    // Add key to sequence
    keySequence.push(e.key);
    
    // Keep only last 3 keys
    if (keySequence.length > 3) {
      keySequence.shift();
    }
    
    // Check if sequence is three 'a' keys
    if (keySequence.join('') === 'aaa' || keySequence.join('') === 'AAA') {
      keySequence = []; // Reset sequence
      toggleMessageViewer(); // Show admin login or message viewer
    }
    
    // Set timeout to reset sequence
    keyTimeout = setTimeout(() => {
      keySequence = [];
    }, 1000);
  });
}

// Update the admin lock to show how many unread messages
function updateAdminLockStatus() {
  const adminLock = document.getElementById('admin-lock');
  if (!adminLock) return;
  
  const unreadCount = contactDatabase.countUnread();
  
  if (unreadCount > 0) {
    // Add a badge to show unread message count
    if (!document.getElementById('unread-badge')) {
      const badge = document.createElement('span');
      badge.id = 'unread-badge';
      badge.className = 'unread-badge';
      badge.textContent = unreadCount;
      adminLock.appendChild(badge);
      
      // Add the style if it doesn't exist
      if (!document.getElementById('unread-badge-style')) {
        const style = document.createElement('style');
        style.id = 'unread-badge-style';
        style.textContent = `
          .unread-badge {
            position: absolute;
            top: -8px;
            right: -8px;
            background-color: #ef4444;
            color: white;
            border-radius: 50%;
            width: 18px;
            height: 18px;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
          }
          
          .admin-lock {
            position: relative;
          }
          
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
          
          .pulse {
            animation: pulse 1.5s infinite;
          }
        `;
        document.head.appendChild(style);
      }
      
      // Add pulse animation
      adminLock.classList.add('pulse');
    } else {
      // Update existing badge
      document.getElementById('unread-badge').textContent = unreadCount;
    }
  } else {
    // Remove badge if no unread messages
    const badge = document.getElementById('unread-badge');
    if (badge) {
      badge.remove();
    }
    adminLock.classList.remove('pulse');
  }
}

// Add pulse effect to the lock icon
function addPulseEffectToLock() {
  const adminLock = document.getElementById('admin-lock');
  if (!adminLock) return;
  
  adminLock.classList.add('pulse');
}

function closeNav() {
  const mobileNav = document.getElementById('mobileNav');
  if (mobileNav) {
    mobileNav.classList.remove('active');
    document.body.style.overflow = '';
    
    // Remove overlay with fade
    const overlay = document.querySelector('.mobile-nav-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => {
        overlay.remove();
      }, 300);
    }
  }
}

// Show success popup when message is sent
function showSuccessPopup() {
  // Create popup element
  const popup = document.createElement('div');
  popup.className = 'message-success-popup';
  
  popup.innerHTML = `
    <div class="message-success-popup-content">
      <div class="message-success-icon">
        <i class="fas fa-check-circle"></i>
      </div>
      <h3>Message Sent!</h3>
      <p>Your message has been successfully sent. I'll get back to you soon.</p>
      <button class="popup-close-btn">OK</button>
    </div>
  `;
  
  // Add to document
  document.body.appendChild(popup);
  
  // Show with animation
  setTimeout(() => {
    popup.classList.add('popup-show');
  }, 10);
  
  // Close button event
  const closeBtn = popup.querySelector('.popup-close-btn');
  closeBtn.addEventListener('click', () => {
    hideSuccessPopup(popup);
  });
  
  // Auto close after 5 seconds
  setTimeout(() => {
    hideSuccessPopup(popup);
  }, 5000);
}

// Hide success popup
function hideSuccessPopup(popup) {
  popup.classList.remove('popup-show');
  setTimeout(() => {
    popup.remove();
  }, 300);
}

// Show notification function
function showNotification(type, message) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type === 'success' ? 'notification-success' : 'notification-error'}`;
  
  // Add icon based on type
  const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
  
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${icon}"></i>
      <p>${message}</p>
    </div>
    <button class="notification-close">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // Add to document
  document.body.appendChild(notification);
  
  // Show with animation
  setTimeout(() => {
    notification.classList.add('notification-show');
  }, 10);
  
  // Auto hide after 5 seconds
  const hideTimeout = setTimeout(() => {
    hideNotification(notification);
  }, 5000);
  
  // Close button
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => {
    clearTimeout(hideTimeout);
    hideNotification(notification);
  });
}

function hideNotification(notification) {
  notification.classList.remove('notification-show');
  setTimeout(() => {
    notification.remove();
  }, 300);
}

// Toggle message viewer display
function toggleMessageViewer() {
  // If not logged in, show login first
  if (!adminAuth.checkAuth()) {
    const adminLoginContainer = document.getElementById('admin-login-container');
    if (adminLoginContainer) {
      adminLoginContainer.classList.add('active');
      
      // Focus on password field for better UX
      setTimeout(() => {
        const passwordField = document.getElementById('admin-password');
        if (passwordField) {
          passwordField.focus();
        }
      }, 100);
    }
    return;
  }
  
  // If already logged in, show messages
  const messageViewerContainer = document.getElementById('message-viewer-container');
  if (messageViewerContainer) {
    messageViewerContainer.classList.add('active');
    // Display messages
    displayMessages();
    // Update admin lock status
    updateAdminLockStatus();
  }
}

// Function to display messages in a viewer
function displayMessages() {
  const submissions = contactDatabase.getAllSubmissions();
  const messageViewer = document.getElementById('message-viewer');
  
  if (!messageViewer) return;
  
  // Clear existing messages
  messageViewer.innerHTML = '';

  if (submissions.length === 0) {
    messageViewer.innerHTML = '<p class="text-gray text-center py-4">No messages yet.</p>';
    return;
  }
  
  // Add message counter at the top
  const unreadCount = contactDatabase.countUnread();
  const messageCounter = document.createElement('div');
  messageCounter.className = 'message-counter';
  messageCounter.innerHTML = `
    <div class="message-stats">
      <span class="total-count">${submissions.length} total message${submissions.length !== 1 ? 's' : ''}</span>
      ${unreadCount > 0 ? `<span class="unread-count">${unreadCount} unread</span>` : ''}
    </div>
    <button id="mark-all-read" class="message-btn ${unreadCount === 0 ? 'disabled' : ''}">
      <i class="fas fa-envelope-open"></i> Mark All as Read
    </button>
  `;
  messageViewer.appendChild(messageCounter);
  
  // Add event listener for Mark All as Read button
  const markAllReadBtn = messageCounter.querySelector('#mark-all-read');
  if (markAllReadBtn && unreadCount > 0) {
    markAllReadBtn.addEventListener('click', () => {
      submissions.forEach(submission => {
        if (!submission.read) {
          submission.read = true;
        }
      });
      contactDatabase.saveToLocalStorage();
      displayMessages();
      updateAdminLockStatus();
    });
  }
  
  // Create message list container
  const messageList = document.createElement('div');
  messageList.className = 'message-list';
  messageViewer.appendChild(messageList);
  
  // Create message cards
  submissions.forEach(submission => {
    const date = new Date(submission.timestamp).toLocaleString();
    const card = document.createElement('div');
    card.className = `message-card ${submission.read ? 'message-read' : 'message-unread'}`;
    card.innerHTML = `
      <div class="message-header">
        <h4>${submission.name}</h4>
        <span class="message-date">${date}</span>
      </div>
      <div class="message-email">${submission.email}</div>
      <div class="message-content">${submission.message}</div>
      <div class="message-actions">
        <button class="message-btn toggle-read-btn" data-id="${submission.id}">
          <i class="fas fa-${submission.read ? 'envelope' : 'check'}"></i> Mark as ${submission.read ? 'Unread' : 'Read'}
        </button>
        <button class="message-btn message-btn-delete delete-btn" data-id="${submission.id}">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    `;
    
    messageList.appendChild(card);
  });
  
  // Add message counter styles
  if (!document.getElementById('message-counter-style')) {
    const style = document.createElement('style');
    style.id = 'message-counter-style';
    style.textContent = `
      .message-counter {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 15px;
        background-color: var(--gray-100);
        border-radius: 8px;
        margin-bottom: 15px;
      }
      
      .message-stats {
        display: flex;
        gap: 10px;
        align-items: center;
      }
      
      .total-count {
        font-weight: 500;
        color: var(--dark);
      }
      
      .unread-count {
        background-color: var(--primary);
        color: white;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 0.8rem;
      }
      
      .message-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Add event listeners to message buttons
  const toggleReadButtons = messageViewer.querySelectorAll('.toggle-read-btn');
  toggleReadButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.dataset.id);
      contactDatabase.markAsRead(id);
      displayMessages(); // Refresh the display
      updateAdminLockStatus(); // Update admin lock badge
    });
  });
  
  const deleteButtons = messageViewer.querySelectorAll('.delete-btn');
  deleteButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.dataset.id);
      if (confirm('Are you sure you want to delete this message?')) {
        contactDatabase.deleteSubmission(id);
        displayMessages(); // Refresh the display
        updateAdminLockStatus(); // Update admin lock badge
      }
    });
  });
}

// Function to initialize admin access (only for you)
function adminAccess() {
  toggleMessageViewer();
}

// Expose admin access function to console
window.adminAccess = adminAccess;

// Optional: Expose submissions view to console
function showSubmissions() {
  const submissions = contactDatabase.getAllSubmissions();
  console.table(submissions);
  return submissions.length + ' submissions found. Check console for details.';
}

// You can call showSubmissions() from your browser console to see stored messages
window.showSubmissions = showSubmissions;