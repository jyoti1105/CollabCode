import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import socket from "../socket";
import { useAuth } from "../AuthContext";

const LANGUAGES = [
  { label: "JavaScript", value: "javascript", icon: "🟨" },
  { label: "TypeScript", value: "typescript", icon: "🔷" },
  { label: "Python", value: "python", icon: "🐍" },
  { label: "Java", value: "java", icon: "☕" },
  { label: "C++", value: "cpp", icon: "⚡" },
  { label: "C#", value: "csharp", icon: "🔷" },
  { label: "Go", value: "go", icon: "🐹" },
  { label: "Rust", value: "rust", icon: "🦀" },
  { label: "PHP", value: "php", icon: "🐘" },
  { label: "Ruby", value: "ruby", icon: "💎" },
  { label: "HTML", value: "html", icon: "🌐" },
  { label: "CSS", value: "css", icon: "🎨" },
  { label: "JSON", value: "json", icon: "📋" },
  { label: "SQL", value: "sql", icon: "🗄️" },
  { label: "Markdown", value: "markdown", icon: "📝" },
];

const THEMES = [
  { label: "Dark", value: "vs-dark", preview: "🖤" },
  { label: "Light", value: "light", preview: "🤍" },
  { label: "High Contrast", value: "hc-black", preview: "⚫" },
  { label: "GitHub Dark", value: "github-dark", preview: "🐙" },
  { label: "Monokai", value: "monokai", preview: "🌈" },
  { label: "Solarized Dark", value: "solarized-dark", preview: "🌅" },
  { label: "Dracula", value: "dracula", preview: "🧛" },
];

const FILES = [
  { name: "main.js", language: "javascript", content: "// Start coding here...\n\nconsole.log('Hello, World!');" },
  { name: "styles.css", language: "css", content: "/* Your styles here */\n\nbody {\n  margin: 0;\n  padding: 20px;\n  font-family: Arial, sans-serif;\n}" },
  { name: "index.html", language: "html", content: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>CollabCode</title>\n  <link rel=\"stylesheet\" href=\"styles.css\">\n</head>\n<body>\n  <h1>Hello, World!</h1>\n  <script src=\"main.js\"></script>\n</body>\n</html>" },
];

export default function EditorPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const username = user?.username;

  const [code, setCode] = useState("// Start coding here...");
  const [language, setLanguage] = useState("javascript");
  const [theme, setTheme] = useState("vs-dark");
  const [users, setUsers] = useState([]);
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [minimapOpen, setMinimapOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentFile, setCurrentFile] = useState("main.js");
  const [files, setFiles] = useState(FILES);
  const [isLoading, setIsLoading] = useState(true);
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [terminalInput, setTerminalInput] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [chatWidth, setChatWidth] = useState(300);
  const [terminalHeight, setTerminalHeight] = useState(220);
  const isRemoteChange = useRef(false);
  const chatInputRef = useRef(null);
  const terminalInputRef = useRef(null);

  const addNotification = useCallback((message, type = "info") => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Set up socket listeners once on mount
  useEffect(() => {
    socket.on("code_update", (data) => {
      isRemoteChange.current = true;
      setCode(data.code);
      setCurrentFile((current) => data.file || current);
    });

    socket.on("user_list", (list) => {
      // Remove duplicates and filter out null values
      const uniqueUsers = Array.from(new Map(list.map(u => [u.id, u])).values());
      setUsers(uniqueUsers);
    });

    socket.on("language_update", (lang) => setLanguage(lang));
    socket.on("theme_update", (thm) => setTheme(thm));
    socket.on("file_update", (fileData) => {
      setFiles(prev => prev.map(f => f.name === fileData.name ? fileData : f));
    });
    socket.on("chat_message", (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    socket.on("user_joined", (user) => {
      addNotification(`👋 ${user.username} joined the room`, "success");
    });
    socket.on("user_left", (user) => {
      addNotification(`👋 ${user.username} left the room`, "info");
    });

    return () => {
      socket.off("code_update");
      socket.off("user_list");
      socket.off("language_update");
      socket.off("theme_update");
      socket.off("file_update");
      socket.off("chat_message");
      socket.off("user_joined");
      socket.off("user_left");
    };
  }, [addNotification]);

  // Separate effect for joining room
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const joinAttempted = useRef(false);

  useEffect(() => {
    if (!username || joinAttempted.current) return;
    joinAttempted.current = true;

    socket.emit("join_room", { roomId, username }, (response) => {
      if (response?.error) {
        console.error("Join room error:", response.error);
        addNotification(`❌ ${response.error}`, "error");
        setTimeout(() => navigate("/"), 2000);
      } else if (response?.success) {
        console.log("✅ Successfully joined room:", roomId);
        addNotification(`✅ Joined room ${roomId}`, "success");
        setIsLoading(false);
      }
    });
  }, [roomId, username, navigate, addNotification]);

  const handleCodeChange = (value) => {
    if (isRemoteChange.current) {
      isRemoteChange.current = false;
      return;
    }
    setCode(value);
    socket.emit("code_change", { roomId, code: value, file: currentFile }, (response) => {
      if (response?.error) {
        console.error("Code change error:", response.error);
        addNotification(`⚠️ Failed to sync code: ${response.error}`, "error");
      }
    });
  };

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    socket.emit("language_change", { roomId, language: lang }, (response) => {
      if (response?.error) {
        console.error("Language change error:", response.error);
      }
    });
    addNotification(`🔧 Language changed to ${LANGUAGES.find(l => l.value === lang)?.label}`, "success");
  };

  const handleThemeChange = (e) => {
    const thm = e.target.value;
    setTheme(thm);
    socket.emit("theme_change", { roomId, theme: thm }, (response) => {
      if (response?.error) {
        console.error("Theme change error:", response.error);
      }
    });
    addNotification(`🎨 Theme changed to ${THEMES.find(t => t.value === thm)?.label}`, "success");
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    addNotification("📋 Room ID copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const selectFile = (fileName) => {
    const file = files.find(f => f.name === fileName);
    if (file) {
      setCurrentFile(fileName);
      setCode(file.content);
      setLanguage(file.language);
      addNotification(`📄 Switched to ${fileName}`, "info");
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const msg = { user: username, text: newMessage, timestamp: new Date().toLocaleTimeString() };
    setMessages(prev => [...prev, msg]);
    setNewMessage("");
    socket.emit("chat_message", { roomId, message: msg }, (response) => {
      if (response?.error) {
        console.error("Message send error:", response.error);
        addNotification(`⚠️ Failed to send message: ${response.error}`, "error");
      }
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const runTerminalCommand = () => {
    if (terminalInput.trim()) {
      const command = terminalInput;
      setTerminalOutput(prev => [...prev, { type: "input", text: `$ ${command}`, timestamp: Date.now() }]);

      // Simulate command execution
      setTimeout(() => {
        let output = "";
        if (command === "help") {
          output = "Available commands:\n- help: Show this help\n- clear: Clear terminal\n- echo [text]: Echo text\n- date: Show current date\n- whoami: Show current user";
        } else if (command === "clear") {
          setTerminalOutput([]);
          setTerminalInput("");
          return;
        } else if (command.startsWith("echo ")) {
          output = command.substring(5);
        } else if (command === "date") {
          output = new Date().toString();
        } else if (command === "whoami") {
          output = username;
        } else if (command === "ls") {
          output = files.map(f => f.name).join("\n");
        } else {
          output = `Command not found: ${command}`;
        }

        if (output) {
          setTerminalOutput(prev => [...prev, { type: "output", text: output, timestamp: Date.now() }]);
        }
      }, 500);

      setTerminalInput("");
    }
  };

  const handleSidebarResize = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (moveEvent) => {
      const diff = moveEvent.clientX - startX;
      const newWidth = Math.max(180, Math.min(400, startWidth + diff));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleChatResize = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = chatWidth;

    const handleMouseMove = (moveEvent) => {
      const diff = startX - moveEvent.clientX;
      const newWidth = Math.max(280, Math.min(500, startWidth + diff));
      setChatWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleTerminalResize = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = terminalHeight;

    const handleMouseMove = (moveEvent) => {
      const diff = startY - moveEvent.clientY;
      const newHeight = Math.max(150, Math.min(500, startHeight + diff));
      setTerminalHeight(newHeight);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleTerminalKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      runTerminalCommand();
    }
  };

  const createNewFile = () => {
    const fileName = prompt("Enter file name (with extension):");
    if (fileName && !files.find(f => f.name === fileName)) {
      const extension = fileName.split('.').pop().toLowerCase();
      const langMap = {
        js: 'javascript',
        ts: 'typescript',
        py: 'python',
        java: 'java',
        cpp: 'cpp',
        c: 'cpp',
        cs: 'csharp',
        go: 'go',
        rs: 'rust',
        php: 'php',
        rb: 'ruby',
        html: 'html',
        css: 'css',
        json: 'json',
        sql: 'sql',
        md: 'markdown'
      };
      const newFile = {
        name: fileName,
        language: langMap[extension] || 'plaintext',
        content: `// New ${fileName} file`
      };
      setFiles(prev => [...prev, newFile]);
      socket.emit("file_update", { roomId, fileData: newFile }, (response) => {
        if (response?.error) {
          console.error("File update error:", response.error);
          addNotification(`⚠️ Failed to create file: ${response.error}`, "error");
        }
      });
      addNotification(`📄 Created new file: ${fileName}`, "success");
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">
          <h2>Loading CollabCode...</h2>
          <p>Setting up your collaborative workspace</p>
        </div>
        <div className="loading-progress">
          <div className="progress-bar"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-container">
      {/* Notifications */}
      <div className="notifications">
        {notifications.map(notification => (
          <div key={notification.id} className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        ))}
      </div>

      <div className="toolbar">
        <button className="btn-icon" onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle Sidebar">
          📁
        </button>

        <span className="logo">⚡ CollabCode</span>

        <div className="room-info">
          <span className="room-id">Room: <strong>{roomId}</strong></span>
          <button className="btn-copy" onClick={copyRoomId}>
            {copied ? "✓ Copied!" : "📋 Copy ID"}
          </button>
        </div>

        <div className="spacer"></div>

        <select className="select" value={language} onChange={handleLanguageChange}>
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.icon} {l.label}</option>
          ))}
        </select>

        <select className="select" value={theme} onChange={handleThemeChange}>
          {THEMES.map((t) => (
            <option key={t.value} value={t.value}>{t.preview} {t.label}</option>
          ))}
        </select>

        <div className="user-list">
          {users.map((u) => (
            <div key={u.id} className="user-badge" title={u.username}>
              <div className="user-avatar">
                {u.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="user-status online"></div>
            </div>
          ))}
        </div>

        <button className="btn-icon" onClick={() => setChatOpen(!chatOpen)} title="Toggle Chat">
          💬 {messages.length > 0 && <span className="badge">{messages.length}</span>}
        </button>

        <button className="btn-icon" onClick={() => setTerminalOpen(!terminalOpen)} title="Toggle Terminal">
          🖥️
        </button>

        <button className="btn-icon" onClick={() => setMinimapOpen(!minimapOpen)} title="Toggle Minimap">
          🗺️
        </button>

        <button className="btn-icon" onClick={() => setSettingsOpen(true)} title="Settings">
          ⚙️
        </button>

        <button className="btn-leave" onClick={() => navigate("/")}>
          🚪 Leave
        </button>
      </div>

      <div className="main-content">
        {sidebarOpen && (
          <>
            <div className="sidebar" style={{ width: `${sidebarWidth}px` }}>
              <div className="sidebar-header">
                <h3>Files</h3>
                <button className="btn-add-file" onClick={createNewFile} title="Create New File">
                  ➕
                </button>
              </div>
              <div className="file-list">
                {files.map((file) => (
                  <div
                    key={file.name}
                    className={`file-item ${currentFile === file.name ? 'active' : ''}`}
                    onClick={() => selectFile(file.name)}
                  >
                    <span className="file-icon">
                      {LANGUAGES.find(l => l.value === file.language)?.icon || '📄'}
                    </span>
                    <span className="file-name">{file.name}</span>
                    {currentFile === file.name && <span className="file-indicator">●</span>}
                  </div>
                ))}
              </div>
            </div>
            <div className="resize-handle-v" onMouseDown={handleSidebarResize} title="Drag to resize"></div>
          </>
        )}

        <div className="editor-wrapper">
          <div className="editor-header">
            <span className="current-file">
              {LANGUAGES.find(l => l.value === language)?.icon} {currentFile}
            </span>
            <div className="editor-stats">
              <span>{users.length} user{users.length !== 1 ? 's' : ''} online</span>
              <span>•</span>
              <span>{code.split('\n').length} lines</span>
              <span>•</span>
              <span>{code.length} chars</span>
            </div>
          </div>

          <Editor
            height="calc(100vh - 100px)"
            language={language}
            value={code}
            onChange={handleCodeChange}
            theme={theme}
            options={{
              fontSize: fontSize,
              minimap: { enabled: minimapOpen },
              wordWrap: wordWrap ? "on" : "off",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              lineNumbers: "on",
              renderWhitespace: "selection",
              bracketPairColorization: { enabled: true },
              guides: { bracketPairs: true },
              smoothScrolling: true,
              cursorBlinking: "smooth",
              contextmenu: true,
              mouseWheelZoom: true,
              folding: true,
              lineDecorationsWidth: 10,
              glyphMargin: true,
            }}
          />
        </div>

        {chatOpen && (
          <>
            <div className="resize-handle-h" onMouseDown={handleChatResize} title="Drag to resize"></div>
            <div className="chat-panel slide-in-right" style={{ width: `${chatWidth}px` }}>
              <div className="chat-header">
                <h3>💬 Chat ({messages.length})</h3>
                <button className="btn-close" onClick={() => setChatOpen(false)}>×</button>
              </div>
              <div className="chat-messages">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`message ${msg.user === username ? 'own' : ''}`}>
                    <div className="message-header">
                      <span className="message-user">{msg.user}</span>
                      <span className="message-time">
                        {new Date(msg.timestamp).toLocaleDateString()} {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="message-text">{msg.text}</div>
                  </div>
                ))}
              </div>
              <div className="chat-input">
                <input
                  ref={chatInputRef}
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button onClick={sendMessage}>📤</button>
              </div>
            </div>
          </>
        )}

        {terminalOpen && (
          <>
            <div className="resize-handle-h-top" onMouseDown={handleTerminalResize} title="Drag to resize"></div>
            <div className="terminal-panel slide-in-bottom" style={{ height: `${terminalHeight}px` }}>
              <div className="terminal-header">
                <h3>🖥️ Terminal</h3>
                <button className="btn-close" onClick={() => setTerminalOpen(false)}>×</button>
              </div>
              <div className="terminal-output">
                {terminalOutput.map((line, idx) => (
                  <div key={idx} className={`terminal-line ${line.type}`}>
                    <span className="terminal-timestamp">
                      [{new Date(line.timestamp).toLocaleTimeString()}]
                    </span>
                    <span className="terminal-content">{line.text}</span>
                  </div>
                ))}
              </div>
              <div className="terminal-input">
                <span className="terminal-prompt">$</span>
                <input
                  ref={terminalInputRef}
                  type="text"
                  placeholder="Type a command..."
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyPress={handleTerminalKeyPress}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="modal-overlay" onClick={() => setSettingsOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚙️ Settings</h3>
              <button className="btn-close" onClick={() => setSettingsOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="setting-group">
                <label>Font Size: {fontSize}px</label>
                <input
                  type="range"
                  min="10"
                  max="24"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                />
              </div>
              <div className="setting-group">
                <label>
                  <input
                    type="checkbox"
                    checked={wordWrap}
                    onChange={(e) => setWordWrap(e.target.checked)}
                  />
                  Word Wrap
                </label>
              </div>
              <div className="setting-group">
                <label>
                  <input
                    type="checkbox"
                    checked={minimapOpen}
                    onChange={(e) => setMinimapOpen(e.target.checked)}
                  />
                  Show Minimap
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSettingsOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}