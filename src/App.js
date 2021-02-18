import { ChatEngine } from 'react-chat-engine'
import ChatFeed from './components/ChatFeed.jsx'
import './App.css'
import LoginForm from './components/LoginForm'
const App = () => {
    if(!localStorage.getItem('username')) return <LoginForm />


    return (
        <ChatEngine 
            height="100vh"
            projectID="29246935-cc8e-4535-a165-6c723e014d8f"
            userName={localStorage.getItem('username')}
            userSecret={localStorage.getItem('password')}
            renderChatFeed={(chatAppProps)=> <ChatFeed {...chatAppProps}/>}
        />
    )
}

export default App