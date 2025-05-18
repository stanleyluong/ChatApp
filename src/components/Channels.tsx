import { DashOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Input, List, Modal, Typography } from 'antd';
import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../firebase';

const { Title } = Typography;

interface Channel {
  id: string;
  name: string;
  description: string;
  createdAt: any;
}

interface ChannelsProps {
  onSelectChannel: (channel: Channel) => void;
  selectedChannel: Channel | null;
}

export function Channels({ onSelectChannel, selectedChannel }: ChannelsProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');

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
        createdAt: new Date(),
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
      <div style={{ padding: '16px' }}>
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
              avatar={<DashOutlined style={{ fontSize: 20, color: 'white' }} />}
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
    </div>
  );
} 