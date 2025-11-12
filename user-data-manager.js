/**
 * User Data Manager
 * Handles user-specific localStorage with namespacing
 */

(function() {
  'use strict';

  window.UserDataManager = {
    /**
     * Get current user identifier
     */
    getCurrentUserId: function() {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) return null;
      
      try {
        const user = JSON.parse(currentUser);
        // Create unique ID from email
        return user.email ? btoa(user.email).replace(/[^a-zA-Z0-9]/g, '') : null;
      } catch (e) {
        return null;
      }
    },

    /**
     * Get user-specific key
     */
    getUserKey: function(key) {
      const userId = this.getCurrentUserId();
      if (!userId) return key; // Fallback to original key if no user
      return `user_${userId}_${key}`;
    },

    /**
     * Set item in user-specific storage
     */
    setItem: function(key, value) {
      const userKey = this.getUserKey(key);
      localStorage.setItem(userKey, value);
    },

    /**
     * Get item from user-specific storage
     */
    getItem: function(key) {
      const userKey = this.getUserKey(key);
      return localStorage.getItem(userKey);
    },

    /**
     * Remove item from user-specific storage
     */
    removeItem: function(key) {
      const userKey = this.getUserKey(key);
      localStorage.removeItem(userKey);
    },

    /**
     * Get all user-specific keys with a prefix
     */
    getKeys: function(prefix) {
      const userId = this.getCurrentUserId();
      if (!userId) return [];
      
      const userPrefix = `user_${userId}_${prefix}`;
      const keys = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(userPrefix)) {
          keys.push(key);
        }
      }
      
      return keys;
    },

    /**
     * Clear all data for current user
     */
    clearUserData: function() {
      const userId = this.getCurrentUserId();
      if (!userId) return;
      
      const userPrefix = `user_${userId}_`;
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(userPrefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    },

    /**
     * Check if user is logged in
     */
    isLoggedIn: function() {
      return !!this.getCurrentUserId();
    },

    /**
     * Get current user info
     */
    getCurrentUser: function() {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) return null;
      
      try {
        return JSON.parse(currentUser);
      } catch (e) {
        return null;
      }
    }
  };

  // Check authentication on all pages except auth pages
  if (!window.location.pathname.includes('login.html') && 
      !window.location.pathname.includes('signup.html') &&
      !window.location.pathname.includes('index.html')) {
    if (!UserDataManager.isLoggedIn()) {
      window.location.href = 'login.html';
    }
  }
})();
