'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Dynamically import the chat component to avoid SSR issues
const FacebookMessengerChat = dynamic(
  () => import('./FacebookMessengerChat'),
  { 
    ssr: false, 
    loading: () => <div>Loading chat...</div> 
  }
);

interface MessengerChatWrapperProps {
  pageId: string;
  themeColor?: string;
  loggedInGreeting?: string;
  loggedOutGreeting?: string;
  showChat?: boolean;
}

const MessengerChatWrapper = ({
  pageId,
  themeColor,
  loggedInGreeting,
  loggedOutGreeting,
  showChat = true
}: MessengerChatWrapperProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !showChat) {
    return null;
  }

  return (
    <FacebookMessengerChat
      pageId={pageId}
      themeColor={themeColor}
      loggedInGreeting={loggedInGreeting}
      loggedOutGreeting={loggedOutGreeting}
    />
  );
};

export default MessengerChatWrapper;
