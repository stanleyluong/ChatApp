import { LogoutOutlined, MenuOutlined, SendOutlined, SettingOutlined } from '@ant-design/icons'
import { Avatar, Button, Drawer, Input, Layout, List, Typography } from 'antd'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import './App.css'
import { Auth } from './components/Auth'
import { Channels } from './components/Channels'
import { GoogleOneTap } from './components/GoogleOneTap'
import { ImageUpload } from './components/ImageUpload'
import { SettingsModal } from './components/SettingsModal'
import { auth, db } from './firebase'

const { Header, Content, Sider } = Layout
const { Title } = Typography
const { TextArea } = Input

interface Message {
  id: string
  text?: string
  imageUrl?: string
  sender: string
  senderId: string
  channelId: string
  timestamp: any
}

interface Channel {
  id: string
  name: string
  description: string
  createdAt: any
}

interface UserSettings {
  avatarUrl: string
  messageBg: string
  messageText: string
}

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [user, setUser] = useState<any>(null)
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

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !imageUrl) || !user || !selectedChannel) return

    try {
      await addDoc(collection(db, 'messages'), {
        text: newMessage.trim() || null,
        imageUrl: imageUrl || null,
        sender: user.displayName || 'Anonymous',
        senderId: user.uid,
        channelId: selectedChannel.id,
        timestamp: serverTimestamp(),
      })
      setNewMessage('')
      setImageUrl('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleImageUploaded = (url: string) => {
    setImageUrl(url)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

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
    setSelectedChannel(channel)
    if (isMobile) setDrawerOpen(false)
  }

  const handleSaveSettings = async (settings: UserSettings) => {
    if (!user) return
    setUserSettings(settings)
    await setDoc(doc(db, 'userSettings', user.uid), settings, { merge: true })
  }

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
      <Layout className="layout">
        <Header className="header">
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
        </Header>
        <Layout>
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
              maskClosable={true}
              style={{ zIndex: 2000 }}
            >
              <Channels 
                onSelectChannel={handleChannelSelect}
                selectedChannel={selectedChannel}
                onSettings={() => setSettingsOpen(true)}
                onSignOut={handleSignOut}
                user={user}
              />
            </Drawer>
          )}
          <Content className="content">
            {selectedChannel ? (
              <div className="chat-container">
                <div className="channel-header">
                  <Title level={4}>#{selectedChannel.name}</Title>
                  <p>{selectedChannel.description}</p>
                </div>
                <List
                  className="message-list"
                  dataSource={messages}
                  renderItem={(message) => {
                    const isCurrentUser = message.senderId === user.uid
                    const avatarUrl = isCurrentUser && userSettings.avatarUrl ? userSettings.avatarUrl : undefined
                    const bgColor = isCurrentUser ? userSettings.messageBg : '#007a5a'
                    const textColor = isCurrentUser ? userSettings.messageText : '#fff'

                    return (
                      <List.Item className={`message-item ${isCurrentUser ? 'current-user' : ''}`}>
                        <div className="message-content" style={{ backgroundColor: bgColor, color: textColor }}>
                          <div className="message-header">
                            <Avatar src={avatarUrl} style={{ backgroundColor: isCurrentUser ? userSettings.messageBg : '#007a5a' }}>
                              {message.sender[0]}
                            </Avatar>
                            <span className="sender-name">{message.sender}</span>
                          </div>
                          {message.text && <p className="message-text">{message.text}</p>}
                          {message.imageUrl && (
                            <div className="message-image">
                              <img src={message.imageUrl} alt="Shared content" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                            </div>
                          )}
                        </div>
                      </List.Item>
                    )
                  }}
                />
                <div className="message-input">
                  <TextArea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    autoSize={{ minRows: 1, maxRows: 4 }}
                  />
                  <div className="message-actions">
                    <ImageUpload onImageUploaded={handleImageUploaded} />
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() && !imageUrl}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-channel-selected">
                <Title level={3}>Select a channel to start chatting</Title>
              </div>
            )}
          </Content>
        </Layout>
      </Layout>
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
