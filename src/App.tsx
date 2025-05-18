import { LogoutOutlined, MenuOutlined, SendOutlined, SettingOutlined } from '@ant-design/icons'
import { Avatar, Button, Drawer, Input, Layout, List, Typography } from 'antd'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import './App.css'
import { Auth } from './components/Auth'
import { Channels } from './components/Channels'
import { GoogleOneTap } from './components/GoogleOneTap'
import { SettingsModal } from './components/SettingsModal'
import { auth, db } from './firebase'

const { Header, Content, Sider } = Layout
const { Title } = Typography
const { TextArea } = Input

interface Message {
  id: string
  text: string
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
    if (!newMessage.trim() || !user || !selectedChannel) return

    try {
      await addDoc(collection(db, 'messages'), {
        text: newMessage,
        sender: user.displayName || 'Anonymous',
        senderId: user.uid,
        channelId: selectedChannel.id,
        timestamp: serverTimestamp(),
      })
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
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
          <Title level={3} style={{ color: 'white', margin: 0 }}>
            ChatApp
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
                      <List.Item className={`message ${isCurrentUser ? 'message-sent' : 'message-received'}`}
                        style={{ background: bgColor, color: textColor }}>
                        <List.Item.Meta
                          avatar={
                            <Avatar
                              src={avatarUrl || (isCurrentUser ? user.photoURL : undefined)}
                              style={{ marginLeft: 8, marginRight: 12 }}
                            >
                              {message.sender[0]}
                            </Avatar>
                          }
                          title={<span style={{ color: textColor, fontWeight: 600 }}>{message.sender}</span>}
                          description={<span style={{ color: textColor }}>{message.text}</span>}
                        />
                      </List.Item>
                    )
                  }}
                />
                <div className="message-input">
                  <TextArea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Message #${selectedChannel.name}`}
                    autoSize={{ minRows: 1, maxRows: 4 }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                    className="send-button"
                  >
                    Send
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                color: '#666'
              }}>
                Select a channel to start chatting
              </div>
            )}
          </Content>
        </Layout>
      </Layout>
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialValues={userSettings}
        onSave={handleSaveSettings}
      />
    </>
  )
}

export default App
