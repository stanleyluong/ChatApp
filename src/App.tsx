import { LogoutOutlined, MenuOutlined, SettingOutlined } from '@ant-design/icons'
import { Button, Drawer, Dropdown, Input, Layout, Modal, Typography } from 'antd'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, setDoc, where, type Timestamp } from 'firebase/firestore'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import './App.css'
import { Auth } from './components/Auth'
import { Channels } from './components/Channels'
import { GoogleOneTap } from './components/GoogleOneTap'
import { ImageUpload } from './components/ImageUpload'
import { SettingsModal } from './components/SettingsModal'
import { auth, db } from './firebase'

const { Sider } = Layout
const { Title } = Typography
const { TextArea } = Input

interface Message {
  id: string
  text?: string
  imageUrl?: string
  sender: string
  senderId: string
  channelId: string
  timestamp: Timestamp
  messageBg?: string
  messageText?: string
}

interface Channel {
  id: string
  name: string
  description: string
  createdAt: Timestamp
}

interface UserSettings {
  avatarUrl: string
  messageBg: string
  messageText: string
}

// Long-press hook for mobile
function useLongPress(callback: () => void, ms = 500) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const start = () => {
    timerRef.current = setTimeout(callback, ms);
  };
  const clear = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };
  return { onTouchStart: start, onTouchEnd: clear, onTouchMove: clear, onTouchCancel: clear };
}

function MessageItem({
  message,
  idx,
  isCurrentUser,
  showGroupHeader,
  initials,
  isMobile,
  handleDeleteMessage,
  handleEditMessage,
  messageListRef
}: {
  message: Message,
  idx: number,
  isCurrentUser: boolean,
  showGroupHeader: boolean,
  initials: string,
  isMobile: boolean,
  handleDeleteMessage: (id: string) => Promise<void>,
  handleEditMessage: (id: string, newText: string) => Promise<void>,
  messageListRef: React.RefObject<HTMLDivElement | null>
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.text || '');
  
  // Build menu items array explicitly, only push valid objects
  const items = [];
  if (typeof message.text === 'string' && message.text.trim() !== '') {
    items.push({
      key: 'edit',
      label: 'Edit',
      onClick: () => {
        setEditValue(message.text || '');
        setEditing(true);
      }
    });
  }
  items.push({
    key: 'delete',
    danger: true,
    label: 'Delete',
    onClick: async () => {
      await Modal.confirm({
        content: 'This action cannot be undone.',
        okText: 'Delete',
        okType: 'danger',
        cancelText: 'Cancel',
        onOk: async () => {
          await handleDeleteMessage(message.id);
        },
      });
    }
  });

  const menu = { items };
  
  // Always call the hook, only use its props if needed
  const longPress = useLongPress(() => {
    const trigger = document.getElementById(`menu-trigger-${message.id}`);
    if (trigger) trigger.click();
  });
  const longPressProps = isCurrentUser && isMobile ? longPress : {};
  const dropdownProps = isCurrentUser
    ? {
        menu,
        trigger: [isMobile ? 'click' : 'contextMenu'] as ('contextMenu' | 'click')[],
      }
    : {};

  return (
    <Dropdown key={message.id} {...dropdownProps}>
      <div>
        <div
          id={isCurrentUser ? `menu-trigger-${message.id}` : undefined}
          className={`message-group${showGroupHeader ? ' new-group' : ''}`}
          style={{ marginTop: showGroupHeader ? 16 : 2 }}
          {...longPressProps}
        >
          <div style={{ display: 'flex', flexDirection: isCurrentUser ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
            {/* Avatar for others, only on first in group */}
            {showGroupHeader && !isCurrentUser ? (
              <div style={{ width: 32, margin: '0 8px 0 0' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#bbb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 15 }}>{initials}</div>
              </div>
            ) : (
              <div style={{ width: 32, margin: '0 8px 0 0' }} />
            )}
            {/* Bubble column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: isCurrentUser ? 'flex-end' : 'flex-start', flex: 1 }}>
              {showGroupHeader && (
                <div style={{ fontSize: 12, color: '#888', marginBottom: 2, textAlign: isCurrentUser ? 'right' : 'left', fontWeight: 500 }}>{message.sender}</div>
              )}
              <div className={`bubble${isCurrentUser ? ' current-user' : ''} bubble-tail`} style={{ marginBottom: 2, maxWidth: '80%' }}>
                {editing ? (
                  <div style={{ marginTop: 2 }}>
                    <Input.TextArea
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      autoSize={{ minRows: 1, maxRows: 4 }}
                      style={{ marginBottom: 8 }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button
                        type="primary"
                        size="small"
                        onClick={async () => {
                          await handleEditMessage(message.id, editValue);
                          setEditing(false);
                        }}
                        disabled={editValue.trim() === '' || editValue === message.text}
                      >
                        Save
                      </Button>
                      <Button size="small" onClick={() => setEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {message.imageUrl ? (
                      <img
                        src={message.imageUrl}
                        alt="Shared content"
                        style={{ maxWidth: 220, maxHeight: 220, borderRadius: 12, display: 'block', marginBottom: message.text ? 6 : 0 }}
                        onLoad={() => {
                          if (idx === undefined) return;
                          if (idx === -1) return;
                          if (messageListRef.current) {
                            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
                          }
                        }}
                      />
                    ) : null}
                    {message.text && (
                      <span style={{ display: 'block' }}>{message.text}</span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dropdown>
  );
}

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [userSettings, setUserSettings] = useState<UserSettings>({
    avatarUrl: '',
    messageBg: '#007a5a',
    messageText: '#fff',
  })
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const [channels, setChannels] = useState<Channel[]>([])

  useEffect(() => {
    // Fetch user settings from Firestore
    if (!user) return
    const fetchSettings = async () => {
      const ref = doc(db, 'userSettings', user.uid)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        setUserSettings(snap.data() as UserSettings)
      }
    }
    fetchSettings()
  }, [user])

  useEffect(() => {
    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setAuthLoading(false)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!selectedChannel) return

    const q = query(
      collection(db, 'messages'),
      where('channelId', '==', selectedChannel.id),
      orderBy('timestamp', 'asc')
    )
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[]
      setMessages(newMessages)
    })

    return () => unsubscribe()
  }, [selectedChannel])

  useEffect(() => {
    // Responsive check
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    console.log('isMobile:', isMobile);
  }, [isMobile]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages, selectedChannel]);

  useLayoutEffect(() => {
    if (messageListRef.current) {
      // Scroll immediately
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
      // Scroll again after a short delay to catch images
      const timeout = setTimeout(() => {
        if (messageListRef.current) {
          messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [messages, selectedChannel]);

  // Fetch channels
  useEffect(() => {
    const q = query(collection(db, 'channels'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newChannels = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Channel[];
      setChannels(newChannels);
    });
    return () => unsubscribe();
  }, []);

  // Restore last channel or select first
  useEffect(() => {
    if (!user || !channels.length || selectedChannel) return;
    const lastChannelId = localStorage.getItem('lastChannelId');
    const found = channels.find(c => c.id === lastChannelId);
    if (found) {
      setSelectedChannel(found);
    } else {
      setSelectedChannel(channels[0]);
    }
  }, [user, channels, selectedChannel]);

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || !user || !selectedChannel) return;

    let imageUrl = '';
    if (selectedImage) {
      // Upload image to Firebase Storage
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('./firebase');
      const storageRef = ref(storage, `images/${Date.now()}_${selectedImage.name}`);
      const snapshot = await uploadBytes(storageRef, selectedImage);
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    try {
      await addDoc(collection(db, 'messages'), {
        text: newMessage.trim() || null,
        imageUrl: imageUrl || null,
        sender: user.displayName || 'Anonymous',
        senderId: user.uid,
        channelId: selectedChannel.id,
        timestamp: serverTimestamp(),
        messageBg: userSettings.messageBg,
        messageText: userSettings.messageText,
      });
      setNewMessage('');
      setSelectedImage(null);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      setUser(null)
      setSelectedChannel(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleChannelSelect = (channel: Channel) => {
    setSelectedChannel(channel);
    localStorage.setItem('lastChannelId', channel.id);
    if (isMobile) setDrawerOpen(false);
  }

  const handleSaveSettings = async (settings: UserSettings) => {
    if (!user) return
    setUserSettings(settings)
    await setDoc(doc(db, 'userSettings', user.uid), settings, { merge: true })
  }

  // Delete message handler
  const handleDeleteMessage = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'messages', id));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // Edit message handler
  const handleEditMessage = async (id: string, newText: string) => {
    try {
      await setDoc(doc(db, 'messages', id), { text: newText }, { merge: true });
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  if (authLoading) {
    return <div />
  }

  if (!user) {
    return <>
      <GoogleOneTap isSignedIn={false} />
      <Auth onSignIn={setUser} />
    </>
  }

  return (
    <>
      <GoogleOneTap isSignedIn={true} />
      <div className="layout">
        {!isMobile && (
          <Sider width={240} theme="dark">
            <Channels 
              onSelectChannel={handleChannelSelect}
              selectedChannel={selectedChannel}
            />
          </Sider>
        )}
        {isMobile && (
          <Drawer
            placement="left"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            styles={{ body: { padding: 0 } }}
            width={240}
            closable={false}
            style={{ zIndex: 2000 }}
          >
            <Channels 
              onSelectChannel={handleChannelSelect}
              selectedChannel={selectedChannel}
            />
          </Drawer>
        )}
        <div className="main">
          <div className="header">
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined style={{ color: 'white', fontSize: 24 }} />}
                onClick={() => setDrawerOpen(!drawerOpen)}
                style={{ marginRight: 16 }}
              />
            )}
            <Title level={3} style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              ChatApp
              <span style={{ display: 'inline-block', verticalAlign: 'middle', marginTop: '10px' }}>
                <svg viewBox="0 0 1024 1024" focusable="false" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                  <path d="M464 512a32 32 0 1064 0 32 32 0 10-64 0zm160 0a32 32 0 1064 0 32 32 0 10-64 0zm-320 0a32 32 0 1064 0 32 32 0 10-64 0z" fill="#fff"/>
                  <path d="M512 64C264.6 64 64 238.7 64 448c0 99.2 48.6 189.2 128.7 254.6-7.7 41.2-27.2 80.2-56.7 110.7-6.2 6.3-8.1 15.6-4.6 23.6 3.5 8 11.3 13.1 19.8 13.1 66.2 0 120.7-24.2 159.2-48.2C370.7 819.2 439.6 832 512 832c247.4 0 448-174.7 448-384S759.4 64 512 64zm0 704c-67.2 0-131.2-13.2-186.2-38.2-4.7-2.2-10.2-1.7-14.3 1.3-36.2 25.7-81.2 44.7-132.2 51.2 27.2-32.2 45.2-70.7 52.2-112.2.8-4.7-1-9.5-4.7-12.5C120.2 613.2 80 533.7 80 448c0-191.2 200.6-352 432-352s432 160.8 432 352-200.6 352-432 352z" fill="#fff"/>
                </svg>
              </span>
            </Title>
            {!isMobile && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Button
                  type="text"
                  icon={<SettingOutlined style={{ color: 'white', fontSize: 22 }} />}
                  onClick={() => setSettingsOpen(true)}
                  style={{ color: 'white' }}
                  aria-label="Settings"
                />
                <span style={{ color: 'white' }}>{user.displayName}</span>
                <Button 
                  type="text" 
                  icon={<LogoutOutlined />} 
                  onClick={handleSignOut}
                  style={{ color: 'white' }}
                />
              </div>
            )}
          </div>
          <div className="chat-container">
            <div className="channel-header">
              {selectedChannel && <>
                <Title level={4}>#{selectedChannel.name}</Title>
                <p>{selectedChannel.description}</p>
              </>}
            </div>
            <div className="message-list" ref={messageListRef}>
              {messages.map((message, idx) => {
                const isCurrentUser = message.senderId === user?.uid;
                const prev = messages[idx - 1];
                const showGroupHeader = !prev || prev.senderId !== message.senderId;
                const initials = message.sender ? message.sender.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : '?';
                return (
                  <MessageItem
                    key={message.id}
                    message={message}
                    idx={idx}
                    isCurrentUser={isCurrentUser}
                    showGroupHeader={showGroupHeader}
                    initials={initials}
                    isMobile={isMobile}
                    handleDeleteMessage={handleDeleteMessage}
                    handleEditMessage={handleEditMessage}
                    messageListRef={messageListRef}
                  />
                );
              })}
            </div>
            <div className="message-input">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ImageUpload onImageSelected={setSelectedImage} />
                <TextArea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  style={{ flex: 1 }}
                />
                {selectedImage && (
                  <img
                    src={URL.createObjectURL(selectedImage)}
                    alt="preview"
                    style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid #eee' }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSaveSettings}
        initialSettings={userSettings}
      />
    </>
  )
}

export default App
