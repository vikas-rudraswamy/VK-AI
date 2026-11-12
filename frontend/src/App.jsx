
import { useEffect, useState } from 'react'
import {
  Bot, Send, Plus, Sparkles, User, Menu, X,
  LayoutDashboard, MessageSquare, History, Settings,
  BarChart3, Moon, Sun, Trash2, ArrowRight,
  Clock, MessagesSquare, Zap, LogOut, ChevronRight
} from 'lucide-react'
import './App.css'

const API_URL = `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api`

const readChats = () => {
  try {
    return JSON.parse(localStorage.getItem('vk-ai-chats') || '[]')
  } catch {
    return []
  }
}

const createId = () =>
  globalThis.crypto?.randomUUID?.() || String(Date.now())

const formatDate = date => {
  const d = new Date(date)
  return d.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [chats, setChats] = useState(readChats)
  const [activeChatId, setActiveChatId] = useState(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [theme, setTheme] = useState(
    () => localStorage.getItem('vk-ai-theme') || 'dark'
  )

  const activeChat = chats.find(c => c.id === activeChatId)
  const messages = activeChat?.messages || []

  useEffect(() => {
    localStorage.setItem('vk-ai-chats', JSON.stringify(chats))
  }, [chats])

  useEffect(() => {
    localStorage.setItem('vk-ai-theme', theme)
    document.documentElement.dataset.theme = theme
  }, [theme])

  function updateChat(id, callback) {
    setChats(current =>
      current.map(chat =>
        chat.id === id ? callback(chat) : chat
      )
    )
  }

  function newChat() {
    const id = createId()

    setChats(current => [
      {
        id,
        title: 'New conversation',
        messages: [],
        updatedAt: new Date().toISOString()
      },
      ...current
    ])

    setActiveChatId(id)
    setInput('')
    setError('')
    setPage('chat')
    setMobileMenu(false)
  }

  function openChat(id) {
    setActiveChatId(id)
    setPage('chat')
    setError('')
    setMobileMenu(false)
  }

  function deleteChat(id) {
    setChats(current => current.filter(chat => chat.id !== id))

    if (activeChatId === id) {
      setActiveChatId(null)
      setPage('dashboard')
    }
  }

  async function sendMessage(event) {
    if (event) event.preventDefault()

    const message = input.trim()

    if (!message || loading) return

    let chatId = activeChatId
    let previousMessages = messages

    if (!chatId) {
      chatId = createId()
      previousMessages = []

      setChats(current => [
        {
          id: chatId,
          title: message.slice(0, 45),
          messages: [],
          updatedAt: new Date().toISOString()
        },
        ...current
      ])

      setActiveChatId(chatId)
    }

    const userMessage = { role: 'user', text: message }

    updateChat(chatId, chat => ({
      ...chat,
      title: chat.messages.length === 0
        ? message.slice(0, 45)
        : chat.title,
      messages: [...chat.messages, userMessage],
      updatedAt: new Date().toISOString()
    }))

    setInput('')
    setError('')
    setLoading(true)

    try {
      const history = previousMessages.map(item => ({
        role: item.role === 'assistant' ? 'model' : 'user',
        text: item.text
      }))

      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`)
      }

      if (!data.reply) {
        throw new Error('VK AI returned an empty response.')
      }

      updateChat(chatId, chat => ({
        ...chat,
        messages: [
          ...chat.messages,
          { role: 'assistant', text: data.reply }
        ],
        updatedAt: new Date().toISOString()
      }))

    } catch (err) {
      console.error('VK AI Error:', err)
      setError(err.message || 'Unable to connect to VK AI.')
    } finally {
      setLoading(false)
    }
  }

  function choosePrompt(prompt) {
    if (!activeChatId) {
      const id = createId()
      setChats(current => [
        {
          id,
          title: prompt.slice(0, 45),
          messages: [],
          updatedAt: new Date().toISOString()
        },
        ...current
      ])
      setActiveChatId(id)
    }

    setInput(prompt)
    setPage('chat')
  }

  function navigate(destination) {
    setPage(destination)
    setMobileMenu(false)
    setError('')
  }

  const totalMessages = chats.reduce(
    (sum, chat) => sum + chat.messages.length, 0
  )

  const assistantMessages = chats.reduce(
    (sum, chat) =>
      sum + chat.messages.filter(m => m.role === 'assistant').length,
    0
  )

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'history', label: 'Chat History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  const pageTitles = {
    dashboard: 'Dashboard',
    chat: 'AI Assistant',
    history: 'Chat History',
    analytics: 'Analytics',
    settings: 'Settings',
    profile: 'My Profile'
  }

  return (
    <div className={`app-shell ${theme}`}>

      {mobileMenu && (
        <div className="mobile-overlay" onClick={() => setMobileMenu(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar ${!sidebarOpen ? 'collapsed' : ''} ${mobileMenu ? 'mobile-open' : ''}`}>

        <div className="brand">
          <div className="brand-icon"><Bot size={23} /></div>
          {sidebarOpen && (
            <div className="brand-name">VK <b>AI</b></div>
          )}
          <button className="mobile-close" onClick={() => setMobileMenu(false)}>
            <X size={19} />
          </button>
        </div>

        <button className="new-chat" onClick={newChat}>
          <Plus size={18} />
          {sidebarOpen && 'New Chat'}
        </button>

        <div className="nav-label">{sidebarOpen ? 'WORKSPACE' : 'MENU'}</div>

        <nav className="navigation">
          {navItems.map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={`nav-item ${page === item.id ? 'active' : ''}`}
                onClick={() => navigate(item.id)}
                title={!sidebarOpen ? item.label : ''}
              >
                <Icon size={19} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {sidebarOpen && (
          <>
            <div className="nav-label recent-label">RECENT CHATS</div>

            <div className="sidebar-history">
              {chats.slice(0, 5).map(chat => (
                <button
                  key={chat.id}
                  className={`history-item ${activeChatId === chat.id ? 'selected' : ''}`}
                  onClick={() => openChat(chat.id)}
                >
                  <MessageSquare size={15} />
                  <span>{chat.title}</span>
                </button>
              ))}
              {chats.length === 0 && (
                <p className="empty-history">No conversations yet</p>
              )}
            </div>
          </>
        )}

        <div className="sidebar-bottom">
          <div className="powered">
            <Sparkles size={15} />
            {sidebarOpen && 'Powered by Gemini'}
          </div>

          <button className="profile-button" onClick={() => navigate('profile')}>
            <div className="profile-avatar">V</div>
            {sidebarOpen && (
              <div className="profile-info">
                <b>VK AI User</b>
                <span>Personal workspace</span>
              </div>
            )}
            {sidebarOpen && <ChevronRight size={16} />}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">

        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-btn desktop-menu"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={20} />
            </button>

            <button
              className="icon-btn mobile-menu-btn"
              onClick={() => setMobileMenu(true)}
            >
              <Menu size={20} />
            </button>

            <div className="breadcrumb">
              <span>VK AI</span>
              <ChevronRight size={15} />
              <b>{pageTitles[page]}</b>
            </div>
          </div>

          <div className="topbar-right">
            <div className="online">
              <i />
              Online
            </div>
            <button
              className="icon-btn theme-btn"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Change theme"
            >
              {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </button>
          </div>
        </header>

        {/* DASHBOARD */}
        {page === 'dashboard' && (
          <section className="page-content">

            <div className="dashboard-welcome">
              <div>
                <p className="eyebrow">YOUR PERSONAL AI WORKSPACE</p>
                <h1>Welcome to <span>VK AI.</span></h1>
                <p>Think smarter. Create faster. Explore more.</p>
              </div>

              <div className="dashboard-decoration">
                <Sparkles size={66} />
              </div>
            </div>

            <div className="section-heading">
              <div>
                <h2>Overview</h2>
                <p>Your AI workspace at a glance.</p>
              </div>
              <button className="primary-btn" onClick={newChat}>
                <Plus size={17} /> Start New Chat
              </button>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon purple"><MessagesSquare /></div>
                <span>Total Conversations</span>
                <h2>{chats.length}</h2>
                <small>Saved in this browser</small>
              </div>

              <div className="stat-card">
                <div className="stat-icon blue"><MessageSquare /></div>
                <span>Total Messages</span>
                <h2>{totalMessages}</h2>
                <small>Your conversation activity</small>
              </div>

              <div className="stat-card">
                <div className="stat-icon green"><Bot /></div>
                <span>AI Responses</span>
                <h2>{assistantMessages}</h2>
                <small>Responses generated</small>
              </div>

              <div className="stat-card">
                <div className="stat-icon orange"><Zap /></div>
                <span>AI Model</span>
                <h2 className="model-stat">Gemini</h2>
                <small>Powered by Google AI</small>
              </div>
            </div>

            <div className="dashboard-grid">

              <div className="panel quick-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Quick Start</h2>
                    <p>What would you like to do today?</p>
                  </div>
                  <Sparkles size={20} />
                </div>

                <div className="quick-grid">
                  {[
                    {
                      icon: '💻',
                      title: 'Learn Programming',
                      desc: 'Understand coding concepts',
                      prompt: 'Teach me programming step by step.'
                    },
                    {
                      icon: '🚀',
                      title: 'Project Ideas',
                      desc: 'Discover your next project',
                      prompt: 'Suggest some innovative software project ideas.'
                    },
                    {
                      icon: '📝',
                      title: 'Writing Assistant',
                      desc: 'Write, improve and create',
                      prompt: 'Help me write professional content.'
                    },
                    {
                      icon: '🎯',
                      title: 'Career Guidance',
                      desc: 'Prepare for your future',
                      prompt: 'Help me prepare for software engineering placements.'
                    }
                  ].map(item => (
                    <button
                      className="quick-card"
                      key={item.title}
                      onClick={() => choosePrompt(item.prompt)}
                    >
                      <span className="quick-emoji">{item.icon}</span>
                      <b>{item.title}</b>
                      <small>{item.desc}</small>
                      <ArrowRight size={17} className="quick-arrow" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel recent-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Recent Activity</h2>
                    <p>Your latest conversations.</p>
                  </div>
                  <button className="text-btn" onClick={() => navigate('history')}>
                    View all
                  </button>
                </div>

                {chats.length === 0 ? (
                  <div className="empty-state">
                    <MessageSquare size={30} />
                    <b>No activity yet</b>
                    <span>Start your first conversation with VK AI.</span>
                    <button className="text-btn" onClick={newChat}>Start chatting →</button>
                  </div>
                ) : (
                  <div className="recent-list">
                    {chats.slice(0, 5).map(chat => (
                      <div className="recent-item" key={chat.id}>
                        <div className="recent-icon"><MessageSquare size={17} /></div>
                        <button className="recent-details" onClick={() => openChat(chat.id)}>
                          <b>{chat.title}</b>
                          <span>{formatDate(chat.updatedAt)}</span>
                        </button>
                        <ChevronRight size={17} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            <div className="bottom-banner">
              <div className="banner-icon"><Sparkles size={24} /></div>
              <div>
                <b>Meet your new AI companion.</b>
                <p>Ask questions, solve problems and turn ideas into reality.</p>
              </div>
              <button onClick={newChat}>Explore VK AI <ArrowRight size={17} /></button>
            </div>

          </section>
        )}

        {/* CHAT */}
        {page === 'chat' && (
          <section className="chat-page">

            <div className={`conversation ${messages.length === 0 ? 'empty' : ''}`}>
              {messages.length === 0 ? (
                <div className="welcome">
                  <div className="welcome-icon"><Sparkles size={28} /></div>
                  <p className="eyebrow">YOUR PERSONAL AI ASSISTANT</p>
                  <h1>What can I help you<br /><span>with today?</span></h1>
                  <p className="welcome-sub">
                    Ask questions, explore ideas, write code or learn something new.
                  </p>

                  <div className="suggestions">
                    {[
                      'Explain Python in simple words',
                      'Give me a project idea',
                      'Help me prepare for placements'
                    ].map(text => (
                      <button key={text} onClick={() => setInput(text)}>
                        {text}<span>↗</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="message-list">
                  {messages.map((message, index) => (
                    <div className={`message-row ${message.role}`} key={index}>
                      <div className="avatar">
                        {message.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                      </div>
                      <div className="message-content">
                        <div className="message-author">
                          {message.role === 'assistant' ? 'VK AI' : 'You'}
                        </div>
                        <div className="message-text">{message.text}</div>
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="message-row assistant">
                      <div className="avatar"><Bot size={18} /></div>
                      <div className="message-content">
                        <div className="message-author">VK AI</div>
                        <div className="typing"><i /><i /><i /></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="composer-wrap">
              {error && <div className="error-message">{error}</div>}

              <form className="composer" onSubmit={sendMessage}>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder="Message VK AI..."
                  rows="1"
                  disabled={loading}
                />
                <button className="send-btn" type="submit" disabled={!input.trim() || loading}>
                  <Send size={18} />
                </button>
              </form>

              <p className="disclaimer">
                VK AI can make mistakes. Verify important information.
              </p>
            </div>
          </section>
        )}

        {/* CHAT HISTORY */}
        {page === 'history' && (
          <section className="page-content">
            <div className="section-heading page-title">
              <div>
                <h1>Chat History</h1>
                <p>Access your saved conversations.</p>
              </div>
              <button className="primary-btn" onClick={newChat}>
                <Plus size={17} /> New Chat
              </button>
            </div>

            <div className="panel history-panel">
              {chats.length === 0 ? (
                <div className="empty-state">
                  <History size={34} />
                  <b>No conversations found</b>
                  <span>Your conversations will appear here.</span>
                </div>
              ) : chats.map(chat => (
                <div className="history-row" key={chat.id}>
                  <div className="recent-icon"><MessageSquare size={18} /></div>
                  <button className="recent-details" onClick={() => openChat(chat.id)}>
                    <b>{chat.title}</b>
                    <span>{chat.messages.length} messages · {formatDate(chat.updatedAt)}</span>
                  </button>
                  <button className="icon-btn delete-btn" onClick={() => deleteChat(chat.id)} title="Delete conversation">
                    <Trash2 size={17} />
                  </button>
                  <button className="icon-btn" onClick={() => openChat(chat.id)}>
                    <ChevronRight size={18} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ANALYTICS */}
        {page === 'analytics' && (
          <section className="page-content">
            <div className="section-heading page-title">
              <div>
                <h1>Analytics</h1>
                <p>Track your VK AI activity.</p>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon purple"><MessagesSquare /></div>
                <span>Total Conversations</span>
                <h2>{chats.length}</h2>
              </div>
              <div className="stat-card">
                <div className="stat-icon blue"><MessageSquare /></div>
                <span>Total Messages</span>
                <h2>{totalMessages}</h2>
              </div>
              <div className="stat-card">
                <div className="stat-icon green"><Bot /></div>
                <span>AI Responses</span>
                <h2>{assistantMessages}</h2>
              </div>
            </div>

            <div className="panel analytics-panel">
              <h2>Usage Summary</h2>
              <p>Your saved chat activity in this browser.</p>
              <div className="usage-row">
                <span>Conversations</span><b>{chats.length}</b>
              </div>
              <div className="usage-row">
                <span>Your messages</span>
                <b>{totalMessages - assistantMessages}</b>
              </div>
              <div className="usage-row">
                <span>AI responses</span><b>{assistantMessages}</b>
              </div>
              <div className="usage-row">
                <span>Average messages per chat</span>
                <b>{chats.length ? (totalMessages / chats.length).toFixed(1) : '0'}</b>
              </div>
            </div>
          </section>
        )}

        {/* SETTINGS */}
        {page === 'settings' && (
          <section className="page-content">
            <div className="section-heading page-title">
              <div>
                <h1>Settings</h1>
                <p>Personalize your VK AI experience.</p>
              </div>
            </div>

            <div className="panel settings-panel">
              <div className="setting-row">
                <div className="setting-icon"><Sun size={20} /></div>
                <div className="setting-info">
                  <b>Appearance</b>
                  <span>Choose your preferred theme.</span>
                </div>
                <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                  {theme === 'dark' ? <><Moon size={16} /> Dark</> : <><Sun size={16} /> Light</>}
                </button>
              </div>

              <div className="setting-row">
                <div className="setting-icon"><Bot size={20} /></div>
                <div className="setting-info">
                  <b>AI Provider</b>
                  <span>Google Gemini API</span>
                </div>
                <span className="setting-status">Connected*</span>
              </div>

              <div className="setting-row">
                <div className="setting-icon"><History size={20} /></div>
                <div className="setting-info">
                  <b>Saved conversations</b>
                  <span>{chats.length} conversations stored in this browser.</span>
                </div>
                <button className="text-btn" onClick={() => navigate('history')}>View</button>
              </div>

              <div className="setting-row">
                <div className="setting-icon"><Trash2 size={20} /></div>
                <div className="setting-info">
                  <b>Clear all conversations</b>
                  <span>This permanently clears locally saved chat history.</span>
                </div>
                <button
                  className="danger-btn"
                  onClick={() => {
                    if (window.confirm('Delete all VK AI conversations?')) {
                      setChats([])
                      setActiveChatId(null)
                    }
                  }}
                >
                  Clear All
                </button>
              </div>
              <p className="settings-note">*Connection status is based on your configured API settings, not a live connection test.</p>
            </div>

            <div className="panel about-panel">
              <div className="brand-icon"><Bot size={23} /></div>
              <div>
                <h2>VK AI</h2>
                <p>Your personal AI assistant · Built with React, Flask and Gemini.</p>
              </div>
            </div>
          </section>
        )}

        {/* PROFILE */}
        {page === 'profile' && (
          <section className="page-content">
            <div className="section-heading page-title">
              <div>
                <h1>My Profile</h1>
                <p>Your personal VK AI workspace.</p>
              </div>
            </div>

            <div className="panel profile-panel">
              <div className="large-profile-avatar">V</div>
              <h2>VK AI User</h2>
              <p>Personal workspace</p>
              <div className="profile-stats">
                <div><b>{chats.length}</b><span>Conversations</span></div>
                <div><b>{totalMessages}</b><span>Messages</span></div>
              </div>
              <button className="primary-btn" onClick={() => navigate('settings')}>
                <Settings size={17} /> Manage Settings
              </button>
            </div>
          </section>
        )}

      </main>
    </div>
  )
}
