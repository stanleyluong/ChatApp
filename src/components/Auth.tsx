import { GoogleOutlined, InfoCircleOutlined, SmileTwoTone } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useState } from 'react';
import { auth } from '../firebase';

interface AuthProps {
  onSignIn: (user: any) => void;
}

export function Auth({ onSignIn }: AuthProps) {
  const [aboutOpen, setAboutOpen] = useState(false);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      onSignIn(result.user);
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      maxWidth: '100vw',
      overflowX: 'hidden',
      background: 'linear-gradient(135deg, #e0e7ff 0%, #f0f2f5 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      boxSizing: 'border-box',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 480,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 1.5rem',
      }}>
        <SmileTwoTone style={{ fontSize: 64, marginBottom: 24 }} twoToneColor="#1976D2" />
        <h1 style={{ marginBottom: 12, fontWeight: 800, fontSize: 36, color: '#1976D2', letterSpacing: 1, textAlign: 'center' }}>
          Welcome to <span style={{ color: '#6C63FF' }}>ChatApp!</span>
        </h1>
        <div style={{ color: '#444', marginBottom: 32, fontSize: 18, fontWeight: 500, textAlign: 'center', maxWidth: 420 }}>
          A modern chatroom app with channels, real-time messaging, and Google sign-in.
        </div>
        <Button
          type="primary"
          icon={<GoogleOutlined />}
          size="large"
          onClick={signInWithGoogle}
          style={{
            width: '100%',
            maxWidth: 340,
            fontWeight: 600,
            background: 'linear-gradient(90deg, #6C63FF 0%, #1976D2 100%)',
            border: 'none',
            boxShadow: '0 2px 8px rgba(108,99,255,0.15)',
            transition: 'transform 0.15s',
            marginBottom: 18,
          }}
          className="sign-in-btn"
        >
          Sign in with Google
        </Button>
        <a
          href="#about"
          style={{ color: '#6C63FF', textDecoration: 'underline', cursor: 'pointer', fontWeight: 500, fontSize: 16, marginBottom: 24 }}
          onClick={e => { e.preventDefault(); setAboutOpen(true); }}
        >
          <InfoCircleOutlined style={{ marginRight: 6 }} /> Learn more about ChatApp
        </a>
        <div style={{ color: '#aaa', fontSize: 15, marginTop: 12 }}>
          © {new Date().getFullYear()} ChatApp. Made with ❤️
        </div>
      </div>
      <Modal
        open={aboutOpen}
        onCancel={() => setAboutOpen(false)}
        footer={null}
        title={<span><InfoCircleOutlined style={{ color: '#6C63FF', marginRight: 8 }} />About ChatApp</span>}
        centered
      >
        <div style={{ fontSize: 16, marginBottom: 12 }}>
          <b>ChatApp</b> is a modern, real-time chatroom platform with channels and Google sign-in.
        </div>
        <div style={{ marginBottom: 10 }}>
          <b>Stack & Technologies:</b>
          <ul style={{ margin: '8px 0 0 18px', padding: 0, fontSize: 15 }}>
            <li>React 18+ (with Vite)</li>
            <li>TypeScript</li>
            <li>Ant Design (UI Library)</li>
            <li>Firebase (Auth & Firestore)</li>
            <li>Responsive design (mobile & desktop)</li>
            <li>Google Authentication</li>
            <li>Real-time channels & messaging</li>
          </ul>
        </div>
        <div style={{ marginBottom: 10 }}>
          <b>Features:</b>
          <ul style={{ margin: '8px 0 0 18px', padding: 0, fontSize: 15 }}>
            <li>Channel-based chatrooms</li>
            <li>Google sign-in</li>
            <li>Modern, mobile-friendly UI</li>
            <li>Persistent authentication</li>
            <li>Custom avatars and user info</li>
          </ul>
        </div>
        <div style={{ color: '#888', fontSize: 14, marginTop: 18 }}>
          Built by Stanley Luong.<br />
          <a href="https://github.com/stanleyluong" target="_blank" rel="noopener noreferrer" style={{ color: '#6C63FF' }}>
            View on GitHub
          </a>
        </div>
      </Modal>
    </div>
  );
} 