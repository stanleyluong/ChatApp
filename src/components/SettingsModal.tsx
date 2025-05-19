import { UploadOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Space, Upload, message as antdMessage } from 'antd';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { useState } from 'react';
import type { ColorResult } from 'react-color';
import { SketchPicker } from 'react-color';
import { v4 as uuidv4 } from 'uuid';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (settings: UserSettings) => Promise<void>;
  initialSettings: UserSettings;
}

export function SettingsModal({ open, onClose, onSave, initialSettings }: SettingsModalProps) {
  const [settings, setSettings] = useState<UserSettings>(initialSettings);
  const [avatarUrl, setAvatarUrl] = useState(initialSettings.avatarUrl || '');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [messageBg, setMessageBg] = useState(initialSettings.messageBg || '#007a5a');
  const [messageText, setMessageText] = useState(initialSettings.messageText || '#fff');

  const handleAvatarUpload = async (file: File) => {
    setAvatarUploading(true);
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `avatars/${uuidv4()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setAvatarUrl(url);
      antdMessage.success('Profile picture uploaded!');
    } catch (err) {
      antdMessage.error('Failed to upload image.');
    } finally {
      setAvatarUploading(false);
    }
    // Prevent Upload from auto-uploading
    return false;
  };

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      title={<div style={{ paddingTop: 8, paddingBottom: 8 }}>Settings</div>}
      okText="Save"
      cancelText="Cancel"
      centered
      style={{ top: 48 }}
      className="settings-modal"
      footer={[
        <Button key="cancel" onClick={onClose}>Cancel</Button>,
        <Button key="save" type="primary" onClick={handleSave} loading={avatarUploading}>Save</Button>
      ]}
    >
      <div style={{ paddingBottom: 24 }}>
        <Form layout="vertical">
          <Form.Item label="Profile Picture">
            <Space direction="vertical" style={{ width: '100%' }}>
              {avatarUrl && (
                <img src={avatarUrl} alt="avatar preview" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', marginBottom: 8 }} />
              )}
              <Upload
                showUploadList={false}
                beforeUpload={handleAvatarUpload}
                accept="image/*"
                disabled={avatarUploading}
              >
                <Button icon={<UploadOutlined />} loading={avatarUploading}>
                  Upload Image
                </Button>
              </Upload>
              <Input
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                placeholder="Paste an image URL or upload above"
                style={{ marginTop: 8 }}
              />
            </Space>
          </Form.Item>
          <Form.Item label="Message Background Color">
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <SketchPicker
                    color={messageBg}
                    onChange={(color: ColorResult) => setMessageBg(color.hex)}
                    presetColors={["#007a5a", "#1976D2", "#6C63FF", "#e6e6fa", "#f0f2f5", "#fff", "#000"]}
                    width="100%"
            />
            </div>
          </Form.Item>
          <Form.Item label="Message Text Color">
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <SketchPicker
                    color={messageText}
                    onChange={(color: ColorResult) => setMessageText(color.hex)}
                    presetColors={["#fff", "#000", "#1976D2", "#6C63FF", "#007a5a"]}
                    width="100%"
              />
            </div>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
} 