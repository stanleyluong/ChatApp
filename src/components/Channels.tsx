import { InfoCircleOutlined, LogoutOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Input, List, Modal, Typography } from 'antd';
import type { User } from 'firebase/auth';
import { addDoc, collection, onSnapshot, orderBy, query, Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../firebase';

const { Title } = Typography;

interface Channel {
  id: string;
  name: string;
  description: string;
  createdAt: Timestamp;
  messages?: {
    text?: boolean;
    image?: boolean;
  };
}

interface ChannelsProps {
  onSelectChannel: (channel: Channel) => void;
  selectedChannel: Channel | null;
  onSettings?: () => void;
  onSignOut?: () => void;
  user?: User | null;
}

export function Channels({ onSelectChannel, selectedChannel, onSettings, onSignOut }: ChannelsProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [isAboutVisible, setIsAboutVisible] = useState(false);

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

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;

    try {
      await addDoc(collection(db, 'channels'), {
        name: newChannelName,
        description: newChannelDescription,
        createdAt: Timestamp.fromDate(new Date()),
      });
      setNewChannelName('');
      setNewChannelDescription('');
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error creating channel:', error);
    }
  };

  return (
    <div style={{ 
      width: '240px', 
      background: '#1976D2', 
      color: 'white',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ padding: '50px 16px 16px 16px' }}>
        <Title level={4} style={{ color: 'white', margin: 0 }}>Channels</Title>
        <Button 
          type="text" 
          icon={<PlusOutlined />} 
          onClick={() => setIsModalVisible(true)}
          style={{ color: 'white', padding: '4px 0' }}
        >
          Add Channel
        </Button>
      </div>

      <List
        dataSource={channels}
        renderItem={(channel) => (
          <List.Item
            onClick={() => onSelectChannel(channel)}
            style={{ 
              padding: '8px 16px',
              cursor: 'pointer',
              backgroundColor: selectedChannel?.id === channel.id ? '#1164A3' : 'transparent',
              color: selectedChannel?.id === channel.id ? 'white' : '#e0e0e0',
            }}
          >
            <List.Item.Meta
              title={<span style={{ color: selectedChannel?.id === channel.id ? 'white' : '#e0e0e0', fontWeight: selectedChannel?.id === channel.id ? 700 : 400 }}>{channel.name}</span>}
              description={<span style={{ color: '#bdbdbd' }}>{channel.description}</span>}
            />
          </List.Item>
        )}
      />

      <Modal
        title="Create New Channel"
        open={isModalVisible}
        onOk={handleCreateChannel}
        onCancel={() => setIsModalVisible(false)}
      >
        <Input
          placeholder="Channel Name"
          value={newChannelName}
          onChange={(e) => setNewChannelName(e.target.value)}
          style={{ marginBottom: '16px' }}
        />
        <Input
          placeholder="Channel Description (optional)"
          value={newChannelDescription}
          onChange={(e) => setNewChannelDescription(e.target.value)}
        />
      </Modal>

      {(onSettings || onSignOut) && (
        <div style={{ marginTop: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {onSettings && (
            <Button
              type="text"
              style={{ color: 'white', textAlign: 'left' }}
              icon={<SettingOutlined />}
              onClick={onSettings}
            >
              Settings
            </Button>
          )}
          <Button
            type="text"
            style={{ color: 'white', textAlign: 'left' }}
            icon={<InfoCircleOutlined />}
            onClick={() => setIsAboutVisible(true)}
          >
            About
          </Button>
          {onSignOut && (
            <Button
              type="text"
              style={{ color: 'white', textAlign: 'left' }}
              icon={<LogoutOutlined />}
              onClick={onSignOut}
            >
              Sign Out
            </Button>
          )}
        </div>
      )}

      <Modal
        title="About ChatApp"
        open={isAboutVisible}
        onCancel={() => setIsAboutVisible(false)}
        footer={null}
      >
        <p><b>ChatApp</b> is a modern, real-time chat application inspired by Slack.</p>
        <p><b>Tech Stack:</b></p>
        <ul>
          <li><b>React 18</b> (with Vite for fast development)</li>
          <li><b>TypeScript</b> (type safety and modern JS features)</li>
          <li><b>Ant Design</b> (UI components and icons)</li>
          <li><b>Firebase</b>:
            <ul>
              <li>Authentication (Google Sign-In, Google One Tap)</li>
              <li>Cloud Firestore (real-time database for messages and channels)</li>
              <li>Storage (for user avatars)</li>
            </ul>
          </li>
          <li><b>AWS Amplify</b> (hosting and custom domain deployment)</li>
          <li><b>GitHub</b> (source control and CI/CD)</li>
        </ul>
        <p><b>Features:</b></p>
        <ul>
          <li>Real-time messaging in channels</li>
          <li>Persistent authentication (Google, One Tap)</li>
          <li>Profile customization (avatar, colors)</li>
          <li>Responsive design (mobile & desktop)</li>
          <li>Modern UI/UX with glassmorphism and gradients</li>
        </ul>
      </Modal>
    </div>
  );
} 