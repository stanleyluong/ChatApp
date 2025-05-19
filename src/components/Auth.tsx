import { GoogleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import { GoogleAuthProvider, signInWithPopup, type User } from 'firebase/auth';
import { useState } from 'react';
import { auth } from '../firebase';

interface AuthProps {
  onSignIn: (user: User) => void;
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
        <span style={{ display: 'inline-block', marginBottom: 24 }}>
          <svg viewBox="0 0 1024 1024" focusable="false" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
            <path d="M464 512a32 32 0 1064 0 32 32 0 10-64 0zm160 0a32 32 0 1064 0 32 32 0 10-64 0zm-320 0a32 32 0 1064 0 32 32 0 10-64 0z" fill="#1976D2"/>
            <path d="M512 64C264.6 64 64 238.7 64 448c0 99.2 48.6 189.2 128.7 254.6-7.7 41.2-27.2 80.2-56.7 110.7-6.2 6.3-8.1 15.6-4.6 23.6 3.5 8 11.3 13.1 19.8 13.1 66.2 0 120.7-24.2 159.2-48.2C370.7 819.2 439.6 832 512 832c247.4 0 448-174.7 448-384S759.4 64 512 64zm0 704c-67.2 0-131.2-13.2-186.2-38.2-4.7-2.2-10.2-1.7-14.3 1.3-36.2 25.7-81.2 44.7-132.2 51.2 27.2-32.2 45.2-70.7 52.2-112.2.8-4.7-1-9.5-4.7-12.5C120.2 613.2 80 533.7 80 448c0-191.2 200.6-352 432-352s432 160.8 432 352-200.6 352-432 352z" fill="#1976D2"/>
          </svg>
        </span>
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