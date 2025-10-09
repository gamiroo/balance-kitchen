'use client';

import { useEffect } from 'react';
import styles from './facebookMessengerChat.module.css';

interface FacebookMessengerChatProps {
  pageId: string;
  themeColor?: string;
  loggedInGreeting?: string;
  loggedOutGreeting?: string;
}

declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: any;
  }
}

const FacebookMessengerChat = ({
  pageId,
  themeColor = '#0084ff',
  loggedInGreeting = 'Hello! How can we help you?',
  loggedOutGreeting = 'Log in to chat with us'
}: FacebookMessengerChatProps) => {
  
  useEffect(() => {
    // Initialize Facebook SDK
    const initFacebookSDK = () => {
      if (typeof window === 'undefined') return;
      
      window.fbAsyncInit = function() {
        if (window.FB) {
          window.FB.init({
            appId: 'YOUR_APP_ID',
            xfbml: true,
            version: 'v18.0'
          });
        }
      };

      // Load Facebook SDK
      (function(d, s, id) {
        var js: any, fjs: any = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s); 
        js.id = id;
        js.src = 'https://connect.facebook.net/en_US/sdk/xfbml.customerchat.js';
        fjs.parentNode.insertBefore(js, fjs);
      })(document, 'script', 'facebook-jssdk');
    };

    initFacebookSDK();

    return () => {
      // Cleanup Facebook SDK
      const fbRoot = document.getElementById('fb-root');
      if (fbRoot) {
        fbRoot.remove();
      }
    };
  }, [pageId, themeColor, loggedInGreeting, loggedOutGreeting]);

  return (
    <div className={styles.messengerChat}>
      <div
        className="fb-customerchat"
        data-attribution="biz_inbox"
        data-page-id={pageId}
        data-theme-color={themeColor}
        data-logged-in-greeting={loggedInGreeting}
        data-logged-out-greeting={loggedOutGreeting}
      />
    </div>
  );
};

export default FacebookMessengerChat;
