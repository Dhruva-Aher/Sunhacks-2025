import React, { useState, useRef, useEffect } from 'react';
import { Home, MessageCircle, Plus, Circle, CheckCircle2, Calendar, Mic, MicOff, Volume2, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState('home');
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDifficulty, setNewTaskDifficulty] = useState('easy');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Calendar and Events State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([
    {
      id: 1,
      title: "Team Meeting",
      date: new Date(),
      time: "10:00 AM",
      duration: 60,
      location: "Conference Room A",
      type: "meeting",
      color: "from-blue-500 to-blue-600",
      dateString: "Today"
    },
    {
      id: 2,
      title: "Project Deadline",
      date: new Date(Date.now() + 86400000), // Tomorrow
      time: "5:00 PM",
      duration: 480,
      location: "Online",
      type: "deadline",
      color: "from-red-500 to-red-600",
      dateString: "Tomorrow"
    },
    {
      id: 3,
      title: "Code Review",
      date: new Date(),
      time: "11:00 AM",
      duration: 45,
      location: "Meeting Room B",
      type: "meeting",
      color: "from-blue-500 to-blue-600",
      dateString: "Today"
    },
    {
      id: 4,
      title: "Lunch Break",
      date: new Date(),
      time: "12:30 PM",
      duration: 60,
      location: "Cafeteria",
      type: "break",
      color: "from-orange-500 to-orange-600",
      dateString: "Today"
    }
  ]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date(),
    time: '',
    duration: '',
    location: '',
    type: 'meeting'
  });
  
  const chatCanvasRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setChatInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    const scrollToBottom = () => {
      if (chatCanvasRef.current) {
        const scrollElement = chatCanvasRef.current;
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    };

    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [chatMessages]);

  // Calculate completion percentage
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const addTask = () => {
    if (newTaskText.trim()) {
      const newTask = {
        id: Date.now(),
        text: newTaskText,
        difficulty: newTaskDifficulty,
        completed: false,
        createdAt: new Date().toLocaleString()
      };
      setTasks([...tasks, newTask]);
      setNewTaskText('');
    }
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const addEvent = () => {
    if (newEvent.title.trim()) {
      const event = {
        id: Date.now(),
        ...newEvent,
        color: getEventColor(newEvent.type)
      };
      setEvents([...events, event]);
      setNewEvent({
        title: '',
        date: new Date(),
        time: '',
        duration: '',
        location: '',
        type: 'meeting'
      });
      setShowEventModal(false);
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'meeting': return 'from-blue-500 to-blue-600';
      case 'deadline': return 'from-red-500 to-red-600';
      case 'personal': return 'from-green-500 to-green-600';
      case 'reminder': return 'from-yellow-500 to-orange-500';
      default: return 'from-purple-500 to-purple-600';
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const sendMessage = async () => {
    if (chatInput.trim()) {
      const userMessage = {
        id: Date.now(),
        text: chatInput,
        timestamp: new Date().toLocaleString(),
        sender: 'user'
      };
      
      setChatMessages(prev => [...prev, userMessage]);
      const currentInput = chatInput;
      setChatInput('');
      
      // Process AI commands locally for demo purposes
      const processLocalCommand = (message) => {
        const lowerMessage = message.toLowerCase();
        
        // Task Management
        if (lowerMessage.includes('add task') || lowerMessage.includes('create task') || lowerMessage.includes('new task')) {
          const taskMatch = message.match(/(?:add task|create task|new task)[\s:]+"([^"]+)"/i) ||
                           message.match(/(?:add task|create task|new task)[\s:]+(.+?)(?:\s+with|$)/i);
          
          if (taskMatch) {
            const taskText = taskMatch[1].trim();
            const difficultyMatch = message.match(/\b(easy|medium|hard)\b/i);
            const difficulty = difficultyMatch ? difficultyMatch[1].toLowerCase() : 'medium';
            
            const newTask = {
              id: Date.now() + Math.random(),
              text: taskText,
              difficulty: difficulty,
              completed: false,
              createdAt: new Date().toLocaleString()
            };
            setTasks(prev => [...prev, newTask]);
            return `✅ Task "${taskText}" added with ${difficulty} difficulty.`;
          }
        }
        
        // Complete Task
        if (lowerMessage.includes('complete task') || lowerMessage.includes('finish task') || lowerMessage.includes('done with')) {
          const taskMatch = message.match(/(?:complete task|finish task|done with)[\s:]+"([^"]+)"/i) ||
                           message.match(/(?:complete task|finish task|done with)[\s:]+(.+?)$/i);
          
          if (taskMatch) {
            const taskText = taskMatch[1].trim();
            setTasks(prev => prev.map(task => 
              task.text.toLowerCase().includes(taskText.toLowerCase()) 
                ? { ...task, completed: true }
                : task
            ));
            return `✅ Task containing "${taskText}" marked as completed.`;
          }
        }
        
        // Delete Task
        if (lowerMessage.includes('delete task') || lowerMessage.includes('remove task')) {
          const taskMatch = message.match(/(?:delete task|remove task)[\s:]+"([^"]+)"/i) ||
                           message.match(/(?:delete task|remove task)[\s:]+(.+?)$/i);
          
          if (taskMatch) {
            const taskText = taskMatch[1].trim();
            const taskToDelete = tasks.find(task => 
              task.text.toLowerCase().includes(taskText.toLowerCase())
            );
            
            if (taskToDelete) {
              setTasks(prev => prev.filter(task => task.id !== taskToDelete.id));
              return `🗑️ Task "${taskToDelete.text}" has been deleted.`;
            }
          }
        }
        
        // Event Management
        if (lowerMessage.includes('add event') || lowerMessage.includes('create event') || lowerMessage.includes('schedule')) {
          const eventMatch = message.match(/(?:add event|create event|schedule)[\s:]+"([^"]+)"/i) ||
                            message.match(/(?:add event|create event|schedule)[\s:]+(.+?)(?:\s+at|\s+for|$)/i);
          
          if (eventMatch) {
            const eventTitle = eventMatch[1].trim();
            const timeMatch = message.match(/(?:at|for)\s+(\d{1,2}:?\d{0,2}\s*(?:am|pm))/i);
            const time = timeMatch ? timeMatch[1] : '10:00 AM';
            
            const typeMatch = message.match(/\b(meeting|deadline|personal|reminder|break)\b/i);
            const type = typeMatch ? typeMatch[1].toLowerCase() : 'meeting';
            
            const durationMatch = message.match(/(\d+)\s*(?:hour|hr|minute|min)/i);
            const duration = durationMatch ? parseInt(durationMatch[1]) * (message.includes('hour') || message.includes('hr') ? 60 : 1) : 60;
            
            const newEvent = {
              id: Date.now() + Math.random(),
              title: eventTitle,
              date: selectedDate,
              time: time,
              duration: duration,
              location: 'TBD',
              type: type,
              color: getEventColor(type),
              dateString: selectedDate.toDateString() === new Date().toDateString() ? 'Today' : 'Tomorrow'
            };
            
            setEvents(prev => [...prev, newEvent]);
            return `📅 Event "${eventTitle}" scheduled for ${time} (${duration} min).`;
          }
        }
        
        // Delete Event
        if (lowerMessage.includes('delete event') || lowerMessage.includes('remove event') || lowerMessage.includes('cancel')) {
          const eventMatch = message.match(/(?:delete event|remove event|cancel)[\s:]+"([^"]+)"/i) ||
                            message.match(/(?:delete event|remove event|cancel)[\s:]+(.+?)$/i);
          
          if (eventMatch) {
            const eventText = eventMatch[1].trim();
            const eventToDelete = events.find(event => 
              event.title.toLowerCase().includes(eventText.toLowerCase())
            );
            
            if (eventToDelete) {
              setEvents(prev => prev.filter(event => event.id !== eventToDelete.id));
              return `🗑️ Event "${eventToDelete.title}" has been cancelled.`;
            }
          }
        }
        
        // Status Queries
        if (lowerMessage.includes('how many tasks') || lowerMessage.includes('task status') || lowerMessage.includes('my tasks')) {
          const totalTasks = tasks.length;
          const completedTasks = tasks.filter(t => t.completed).length;
          const pendingTasks = totalTasks - completedTasks;
          return `📊 Task Status: ${pendingTasks} pending, ${completedTasks} completed (${totalTasks} total).`;
        }
        
        if (lowerMessage.includes('my schedule') || lowerMessage.includes('today events') || lowerMessage.includes('what\'s next')) {
          const todayEvents = events.filter(e => e.dateString === 'Today');
          if (todayEvents.length === 0) {
            return `📅 You have no events scheduled for today. Perfect time to focus on tasks!`;
          }
          const eventList = todayEvents.map(e => `${e.time} - ${e.title}`).join('\n');
          return `📅 Today's Schedule:\n${eventList}`;
        }
        
        if (lowerMessage.includes('free time') || lowerMessage.includes('available') || lowerMessage.includes('when can')) {
          const timeSlots = [
            { time: '9:00 AM', slot: '9:00-10:00 AM' },
            { time: '10:00 AM', slot: '10:00-11:00 AM' },
            { time: '11:00 AM', slot: '11:00 AM-12:00 PM' },
            { time: '1:00 PM', slot: '1:00-2:00 PM' },
            { time: '2:00 PM', slot: '2:00-3:00 PM' },
            { time: '3:00 PM', slot: '3:00-4:00 PM' },
            { time: '4:00 PM', slot: '4:00-5:00 PM' },
            { time: '5:00 PM', slot: '5:00-6:00 PM' }
          ];
          
          const todayEvents = events.filter(e => e.dateString === 'Today');
          const busyTimes = todayEvents.map(e => e.time);
          const availableSlots = timeSlots.filter(slot => !busyTimes.includes(slot.time));
          
          if (availableSlots.length === 0) {
            return `⏰ You're fully booked today! Consider rescheduling some events.`;
          }
          
          const nextFree = availableSlots[0].slot;
          const totalFree = availableSlots.length;
          return `⏰ You have ${totalFree} free slots today. Next available: ${nextFree}`;
        }
        
        return null;
      };
      
      try {
        // Try to process as local command first
        const localResponse = processLocalCommand(currentInput);
        
        if (localResponse) {
          // Add AI response for local command
          const aiMessage = {
            id: Date.now() + 1,
            text: localResponse,
            timestamp: new Date().toLocaleString(),
            sender: 'ai'
          };
          setChatMessages(prev => [...prev, aiMessage]);
        } else {
          // Try external API
          const response = await fetch('http://localhost:5000/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: currentInput }),
          });
          
          const data = await response.json();
          
          const aiMessage = {
            id: Date.now() + 1,
            text: data.response || "I can help you manage tasks and events! Try saying 'add task \"finish report\" medium' or 'schedule meeting at 2pm'.",
            timestamp: new Date().toLocaleString(),
            sender: 'ai'
          };
          
          setChatMessages(prev => [...prev, aiMessage]);
        }
        
      } catch (error) {
        console.error('Error calling API:', error);
        
        // Try local command processing as fallback
        const localResponse = processLocalCommand(currentInput);
        
        const fallbackMessage = {
          id: Date.now() + 1,
          text: localResponse || "I can help you manage tasks and events! Try: 'add task \"finish report\"', 'schedule meeting at 2pm', 'my schedule', or 'free time'.",
          timestamp: new Date().toLocaleString(),
          sender: localResponse ? 'ai' : 'error'
        };
        setChatMessages(prev => [...prev, fallbackMessage]);
      }
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'from-green-400 to-green-600';
      case 'medium': return 'from-yellow-400 to-orange-500';
      case 'hard': return 'from-red-400 to-red-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getDifficultyBorder = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'border-green-500';
      case 'medium': return 'border-yellow-500';
      case 'hard': return 'border-red-500';
      default: return 'border-gray-500';
    }
  };

  // Calendar utilities
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (date) => {
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-20 bg-black/20 backdrop-blur-xl border-r border-white/10 flex flex-col items-center py-8 space-y-8">
        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-8">
          <div className="w-6 h-6 bg-white rounded-sm"></div>
        </div>
        
        <button
          onClick={() => setCurrentPage('home')}
          className={`p-3 rounded-xl transition-all duration-300 hover:scale-110 ${
            currentPage === 'home' 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25' 
              : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          <Home size={24} />
        </button>

        <button
          onClick={() => setCurrentPage('calendar')}
          className={`p-3 rounded-xl transition-all duration-300 hover:scale-110 ${
            currentPage === 'calendar' 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25' 
              : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          <Calendar size={24} />
        </button>
        
        <button
          onClick={() => setCurrentPage('chat')}
          className={`p-3 rounded-xl transition-all duration-300 hover:scale-110 ${
            currentPage === 'chat' 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25' 
              : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          <MessageCircle size={24} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {currentPage === 'home' ? (
          <>
            {/* Header with Progress Circle */}
            <div className="p-8 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
                    Task Dashboard
                  </h1>
                  <p className="text-purple-300 mt-2">Organize your work with style</p>
                </div>
                
                {/* Progress Circle */}
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-white/10"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="transparent"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-purple-500"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray={`${completionPercentage}, 100`}
                      strokeLinecap="round"
                      fill="transparent"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-semibold">
                      {Math.round(completionPercentage)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex p-8 space-x-8">
              {/* Task Creation Panel */}
              <div className="w-1/3 space-y-6">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                  <h2 className="text-2xl font-semibold mb-6 text-purple-300">Create New Task</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-purple-200">Task Description</label>
                      <textarea
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        placeholder="What needs to be done?"
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none h-24"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-purple-200">Difficulty Level</label>
                      <select
                        value={newTaskDifficulty}
                        onChange={(e) => setNewTaskDifficulty(e.target.value)}
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    
                    <button
                      onClick={addTask}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 p-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 hover:scale-105 shadow-lg hover:shadow-purple-500/25"
                    >
                      <Plus size={20} />
                      <span>Add Task</span>
                    </button>
                  </div>
                </div>

                {/* Daily Activity Progress */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                  <h3 className="text-xl font-semibold mb-4 text-purple-300">Daily Activity</h3>
                  
                  <div className="flex flex-col items-center space-y-4">
                    {/* Large Progress Circle */}
                    <div className="relative">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                        {/* Background circle */}
                        <path
                          className="text-white/10"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="transparent"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        {/* Progress circle */}
                        <path
                          className={`transition-all duration-1000 ease-out ${
                            (() => {
                              const todayEvents = events.filter(e => e.dateString === 'Today');
                              const pendingTasks = tasks.filter(t => !t.completed);
                              const totalActivity = todayEvents.length * 15 + pendingTasks.length * 10;
                              const busyPercentage = Math.min(totalActivity, 100);
                              
                              return busyPercentage > 75 ? 'text-red-400' : 
                                     busyPercentage > 50 ? 'text-yellow-400' : 
                                     busyPercentage > 25 ? 'text-blue-400' :
                                     'text-green-400';
                            })()
                          }`}
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          fill="transparent"
                          strokeDasharray={`${(() => {
                            const todayEvents = events.filter(e => e.dateString === 'Today');
                            const pendingTasks = tasks.filter(t => !t.completed);
                            const totalActivity = todayEvents.length * 15 + pendingTasks.length * 10;
                            return Math.min(totalActivity, 100);
                          })()}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      {/* Center content */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-2xl font-bold ${
                          (() => {
                            const todayEvents = events.filter(e => e.dateString === 'Today');
                            const pendingTasks = tasks.filter(t => !t.completed);
                            const totalActivity = todayEvents.length * 15 + pendingTasks.length * 10;
                            const busyPercentage = Math.min(totalActivity, 100);
                            
                            return busyPercentage > 75 ? 'text-red-400' : 
                                   busyPercentage > 50 ? 'text-yellow-400' : 
                                   busyPercentage > 25 ? 'text-blue-400' :
                                   'text-green-400';
                          })()
                        }`}>
                          {(() => {
                            const todayEvents = events.filter(e => e.dateString === 'Today');
                            const pendingTasks = tasks.filter(t => !t.completed);
                            const totalActivity = todayEvents.length * 15 + pendingTasks.length * 10;
                            return Math.min(totalActivity, 100);
                          })()}%
                        </span>
                        <span className="text-xs text-purple-300">Busy</span>
                      </div>
                    </div>

                    {/* Available Time Slots */}
                    <div className="w-full">
                      <h4 className="text-sm font-semibold text-purple-300 mb-3">Available Time Slots</h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {(() => {
                          const timeSlots = [
                            { time: '9:00 AM', slot: '9:00-10:00 AM' },
                            { time: '10:00 AM', slot: '10:00-11:00 AM' },
                            { time: '11:00 AM', slot: '11:00 AM-12:00 PM' },
                            { time: '1:00 PM', slot: '1:00-2:00 PM' },
                            { time: '2:00 PM', slot: '2:00-3:00 PM' },
                            { time: '3:00 PM', slot: '3:00-4:00 PM' },
                            { time: '4:00 PM', slot: '4:00-5:00 PM' },
                            { time: '5:00 PM', slot: '5:00-6:00 PM' }
                          ];
                          
                          const todayEvents = events.filter(e => e.dateString === 'Today');
                          const busyTimes = todayEvents.map(e => e.time);
                          
                          const availableSlots = timeSlots.filter(slot => 
                            !busyTimes.includes(slot.time)
                          );
                          
                          if (availableSlots.length === 0) {
                            return (
                              <div className="text-center p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                                <span className="text-sm text-red-300">No available slots today</span>
                              </div>
                            );
                          }
                          
                          return availableSlots.slice(0, 4).map((slot, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-green-500/10 rounded-lg border border-green-500/20 hover:bg-green-500/20 transition-colors">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-sm text-green-300 font-medium">{slot.slot}</span>
                              </div>
                              <span className="text-xs text-green-400">Free</span>
                            </div>
                          ));
                        })()}
                      </div>
                      {(() => {
                        const timeSlots = [
                          { time: '9:00 AM', slot: '9:00-10:00 AM' },
                          { time: '10:00 AM', slot: '10:00-11:00 AM' },
                          { time: '11:00 AM', slot: '11:00 AM-12:00 PM' },
                          { time: '1:00 PM', slot: '1:00-2:00 PM' },
                          { time: '2:00 PM', slot: '2:00-3:00 PM' },
                          { time: '3:00 PM', slot: '3:00-4:00 PM' },
                          { time: '4:00 PM', slot: '4:00-5:00 PM' },
                          { time: '5:00 PM', slot: '5:00-6:00 PM' }
                        ];
                        
                        const todayEvents = events.filter(e => e.dateString === 'Today');
                        const busyTimes = todayEvents.map(e => e.time);
                        const availableSlots = timeSlots.filter(slot => !busyTimes.includes(slot.time));
                        
                        return availableSlots.length > 4 ? (
                          <div className="text-xs text-green-400 text-center mt-2">
                            +{availableSlots.length - 4} more slots available
                          </div>
                        ) : null;
                      })()}
                    </div>

                    {/* Activity Breakdown */}
                    <div className="w-full space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-purple-200">Events Today</span>
                        </div>
                        <span className="text-sm font-semibold text-white">
                          {events.filter(e => e.dateString === 'Today').length}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          <span className="text-sm text-purple-200">Pending Tasks</span>
                        </div>
                        <span className="text-sm font-semibold text-white">
                          {tasks.filter(t => !t.completed).length}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-purple-200">Available Slots</span>
                        </div>
                        <span className="text-sm font-semibold text-white">
                          {(() => {
                            const timeSlots = [
                              { time: '9:00 AM' }, { time: '10:00 AM' }, { time: '11:00 AM' },
                              { time: '1:00 PM' }, { time: '2:00 PM' }, { time: '3:00 PM' },
                              { time: '4:00 PM' }, { time: '5:00 PM' }
                            ];
                            const todayEvents = events.filter(e => e.dateString === 'Today');
                            const busyTimes = todayEvents.map(e => e.time);
                            return timeSlots.filter(slot => !busyTimes.includes(slot.time)).length;
                          })()}
                        </span>
                      </div>
                    </div>

                    {/* Status Message with Next Available */}
                    <div className={`w-full text-center p-3 rounded-xl ${
                      (() => {
                        const todayEvents = events.filter(e => e.dateString === 'Today');
                        const pendingTasks = tasks.filter(t => !t.completed);
                        const totalActivity = todayEvents.length * 15 + pendingTasks.length * 10;
                        const busyPercentage = Math.min(totalActivity, 100);
                        
                        return busyPercentage > 75 ? 'bg-red-500/20 border border-red-500/30' : 
                               busyPercentage > 50 ? 'bg-yellow-500/20 border border-yellow-500/30' : 
                               busyPercentage > 25 ? 'bg-blue-500/20 border border-blue-500/30' :
                               'bg-green-500/20 border border-green-500/30';
                      })()
                    }`}>
                      <div className="space-y-1">
                        <span className={`block text-sm font-medium ${
                          (() => {
                            const todayEvents = events.filter(e => e.dateString === 'Today');
                            const pendingTasks = tasks.filter(t => !t.completed);
                            const totalActivity = todayEvents.length * 15 + pendingTasks.length * 10;
                            const busyPercentage = Math.min(totalActivity, 100);
                            
                            return busyPercentage > 75 ? 'text-red-300' : 
                                   busyPercentage > 50 ? 'text-yellow-300' : 
                                   busyPercentage > 25 ? 'text-blue-300' :
                                   'text-green-300';
                          })()
                        }`}>
                          {(() => {
                            const todayEvents = events.filter(e => e.dateString === 'Today');
                            const pendingTasks = tasks.filter(t => !t.completed);
                            const totalActivity = todayEvents.length * 15 + pendingTasks.length * 10;
                            const busyPercentage = Math.min(totalActivity, 100);
                            
                            if (busyPercentage > 75) return "Heavy workload today";
                            if (busyPercentage > 50) return "Moderately busy day";
                            if (busyPercentage > 25) return "Light schedule";
                            return "Free day ahead";
                          })()}
                        </span>
                        <span className="block text-xs text-purple-300">
                          Next free: {(() => {
                            const timeSlots = [
                              { time: '9:00 AM', slot: '9:00-10:00 AM' },
                              { time: '10:00 AM', slot: '10:00-11:00 AM' },
                              { time: '11:00 AM', slot: '11:00 AM-12:00 PM' },
                              { time: '1:00 PM', slot: '1:00-2:00 PM' },
                              { time: '2:00 PM', slot: '2:00-3:00 PM' },
                              { time: '3:00 PM', slot: '3:00-4:00 PM' },
                              { time: '4:00 PM', slot: '4:00-5:00 PM' },
                              { time: '5:00 PM', slot: '5:00-6:00 PM' }
                            ];
                            
                            const todayEvents = events.filter(e => e.dateString === 'Today');
                            const busyTimes = todayEvents.map(e => e.time);
                            const nextFree = timeSlots.find(slot => !busyTimes.includes(slot.time));
                            
                            return nextFree ? nextFree.slot : 'No slots available';
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Board */}
              <div className="flex-1">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 h-full">
                  <h2 className="text-2xl font-semibold mb-6 text-purple-300">Task Board</h2>
                  
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {tasks.length === 0 ? (
                      <div className="text-center py-12">
                        <Circle size={64} className="mx-auto text-purple-300 mb-4 opacity-50" />
                        <p className="text-purple-300 text-lg">No tasks yet. Create your first task!</p>
                      </div>
                    ) : (
                      tasks.map((task) => (
                        <div
                          key={task.id}
                          className={`bg-gradient-to-r ${getDifficultyColor(task.difficulty)} p-4 rounded-xl border-2 ${getDifficultyBorder(task.difficulty)} transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                            task.completed ? 'opacity-60' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <button
                                  onClick={() => toggleTask(task.id)}
                                  className="hover:scale-110 transition-transform duration-200"
                                >
                                  {task.completed ? (
                                    <CheckCircle2 size={24} className="text-white" />
                                  ) : (
                                    <Circle size={24} className="text-white" />
                                  )}
                                </button>
                                <span className={`font-medium ${task.completed ? 'line-through' : ''}`}>
                                  {task.text}
                                </span>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-white/80">
                                <span className="bg-white/20 px-2 py-1 rounded-full capitalize">
                                  {task.difficulty}
                                </span>
                                <span>{task.createdAt}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="text-white/60 hover:text-white transition-colors duration-200 ml-4"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Panel - Dashboard Overview */}
              <div className="w-80 space-y-6">
                {/* Top Row - Quick Tasks and Daily Progress */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Quick Tasks - Left */}
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-purple-300">Quick Tasks</h3>
                      <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    </div>

                    {/* Quick Add Todo */}
                    <div className="flex space-x-1 mb-3">
                      <input
                        type="text"
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        placeholder="Quick task..."
                        className="flex-1 px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white placeholder-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        onKeyPress={(e) => e.key === 'Enter' && addTask()}
                      />
                      <button
                        onClick={addTask}
                        className="p-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Task List */}
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {tasks.slice(0, 4).map(task => (
                        <div key={task.id} className="flex items-center space-x-2 p-1 hover:bg-white/10 rounded group transition-colors">
                          <button
                            onClick={() => toggleTask(task.id)}
                            className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${
                              task.completed 
                                ? 'bg-purple-500 border-purple-500 text-white' 
                                : 'border-purple-300 hover:border-purple-500'
                            }`}
                          >
                            {task.completed && <CheckCircle2 className="w-2 h-2" />}
                          </button>
                          <span className={`flex-1 text-xs ${
                            task.completed ? 'line-through text-purple-200' : 'text-white'
                          }`}>
                            {task.text.length > 20 ? task.text.substring(0, 20) + '...' : task.text}
                          </span>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            task.difficulty === 'hard' ? 'bg-red-400' :
                            task.difficulty === 'medium' ? 'bg-yellow-400' :
                            'bg-green-400'
                          }`}></div>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-red-400 hover:text-red-300 rounded transition-all"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    {tasks.length > 4 && (
                      <div className="text-xs text-purple-300 text-center mt-2">
                        <button className="hover:text-purple-100 transition-colors">
                          +{tasks.length - 4} more tasks →
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Daily Progress Circle - Right */}
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-purple-300">Today</h3>
                      <Clock className="w-4 h-4 text-purple-400" />
                    </div>
                    
                    <div className="flex flex-col items-center space-y-2">
                      {/* Progress Circle */}
                      <div className="relative">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="stroke-white/10"
                            strokeWidth="3"
                            fill="transparent"
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className={`${completionPercentage > 75 ? 'stroke-red-400' : 
                                      completionPercentage > 50 ? 'stroke-yellow-400' : 
                                      'stroke-green-400'}`}
                            strokeWidth="3"
                            strokeLinecap="round"
                            fill="transparent"
                            strokeDasharray={`${completionPercentage}, 100`}
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-xs font-bold ${
                            completionPercentage > 75 ? 'text-red-400' : 
                            completionPercentage > 50 ? 'text-yellow-400' : 
                            'text-green-400'
                          }`}>
                            {Math.round(completionPercentage)}%
                          </span>
                        </div>
                      </div>
                      
                      {/* Compact Stats */}
                      <div className="text-center space-y-1">
                        <div className="flex justify-center space-x-3 text-xs">
                          <span className="text-purple-200">{events.filter(e => e.dateString === 'Today').length} events</span>
                          <span className="text-purple-200">{tasks.filter(t => !t.completed).length} tasks</span>
                        </div>
                        <div className="text-xs text-green-400 font-medium">
                          Next: {events.find(e => e.dateString === 'Today')?.time || 'Free time'}
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        completionPercentage > 75 ? 'bg-red-500/20 text-red-300' :
                        completionPercentage > 50 ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-green-500/20 text-green-300'
                      }`}>
                        {completionPercentage > 75 ? 'Busy' :
                         completionPercentage > 50 ? 'Moderate' :
                         'Light'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Calendar Events - Full Width */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-purple-300">Upcoming Events</h3>
                    <Calendar className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="space-y-3">
                    {events.map(event => (
                      <div key={event.id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/10">
                        <div className={`w-3 h-3 rounded-full ${
                          event.type === 'meeting' ? 'bg-blue-500' :
                          event.type === 'deadline' ? 'bg-red-500' :
                          event.type === 'break' ? 'bg-orange-500' :
                          'bg-green-500'
                        }`}></div>
                        <div className="flex-1">
                          <p className="font-medium text-white text-sm">{event.title}</p>
                          <p className="text-xs text-purple-300">{event.dateString} • {event.time}</p>
                        </div>
                        <div className="text-xs text-purple-200">{event.duration}m</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : currentPage === 'calendar' ? (
          /* Calendar Page */
          <div className="flex-1 flex flex-col p-8">
            <div className="mb-6">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
                Calendar & Events
              </h1>
              <p className="text-purple-300 mt-2">Manage your schedule and upcoming events</p>
            </div>

            <div className="flex-1 flex space-x-8">
              {/* Calendar */}
              <div className="flex-1">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-purple-300">
                      {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigateMonth(-1)}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={() => navigateMonth(1)}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center p-2 text-purple-300 font-medium">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: getFirstDayOfMonth(currentDate) }).map((_, index) => (
                      <div key={index} className="h-12"></div>
                    ))}
                    
                    {Array.from({ length: getDaysInMonth(currentDate) }).map((_, index) => {
                      const day = index + 1;
                      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                      const dayEvents = getEventsForDate(date);
                      const isToday = date.toDateString() === new Date().toDateString();
                      const isSelected = date.toDateString() === selectedDate.toDateString();
                      
                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDate(date)}
                          className={`h-12 rounded-xl transition-all duration-200 relative ${
                            isSelected 
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                              : isToday 
                                ? 'bg-white/20 border-2 border-purple-400'
                                : 'bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <span className="text-sm font-medium">{day}</span>
                          {dayEvents.length > 0 && (
                            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-yellow-400 rounded-full"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Events Panel */}
              <div className="w-1/3">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 h-full">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-purple-300">Events</h2>
                    <button
                      onClick={() => setShowEventModal(true)}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 p-2 rounded-xl transition-all duration-300 hover:scale-105"
                    >
                      <Plus size={20} />
                    </button>
                  </div>

                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {getEventsForDate(selectedDate).length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar size={48} className="mx-auto text-purple-300 mb-4 opacity-50" />
                        <p className="text-purple-300">No events for {selectedDate.toDateString()}</p>
                      </div>
                    ) : (
                      getEventsForDate(selectedDate).map((event) => (
                        <div
                          key={event.id}
                          className={`bg-gradient-to-r ${event.color} p-4 rounded-xl transition-all duration-300 hover:scale-105`}
                        >
                          <h3 className="font-semibold text-white mb-2">{event.title}</h3>
                          <div className="space-y-1 text-sm text-white/80">
                            <div className="flex items-center space-x-2">
                              <Clock size={14} />
                              <span>{event.time} ({event.duration})</span>
                            </div>
                            {event.location && (
                              <div className="flex items-center space-x-2">
                                <MapPin size={14} />
                                <span>{event.location}</span>
                              </div>
                            )}
                            <span className="bg-white/20 px-2 py-1 rounded-full text-xs capitalize">
                              {event.type}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Chat Page */
          <div className="flex-1 flex flex-col p-8">
            <div className="mb-6">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
                AI Voice Assistant
              </h1>
              <p className="text-purple-300 mt-2">Chat or speak with your AI-powered assistant</p>
            </div>
            
            {/* Chat Canvas */}
            <div className="flex-1 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-6 flex flex-col">
              <div 
                className="flex-1 overflow-y-auto pr-2" 
                ref={chatCanvasRef}
                style={{
                  maxHeight: 'calc(100vh - 300px)',
                  scrollBehavior: 'smooth'
                }}
              >
                <div className="space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full min-h-96">
                      <div className="text-center">
                        <MessageCircle size={64} className="mx-auto text-purple-300 mb-4 opacity-50" />
                        <p className="text-purple-300 text-lg">Start a conversation with your AI assistant...</p>
                        <p className="text-purple-200 text-sm mt-2">Try: "Hello, how can you help me?" or use the voice button to speak</p>
                      </div>
                    </div>
                  ) : (
                    chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-4 rounded-xl border ${
                          message.sender === 'user' 
                            ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30 ml-8' 
                            : message.sender === 'error'
                            ? 'bg-gradient-to-r from-red-500/20 to-red-600/20 border-red-500/30 mr-8'
                            : 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 mr-8'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className={`text-sm font-medium ${
                              message.sender === 'user' ? 'text-blue-300' : 
                              message.sender === 'error' ? 'text-red-300' : 'text-purple-300'
                            }`}>
                              {message.sender === 'user' ? 'You' : message.sender === 'error' ? 'Error' : 'AI Assistant'}
                            </span>
                            {message.sender === 'ai' && (
                              <button
                                onClick={() => speakText(message.text)}
                                className="text-purple-300 hover:text-white transition-colors"
                              >
                                <Volume2 size={16} />
                              </button>
                            )}
                          </div>
                          <span className="text-xs text-white/60">{message.timestamp}</span>
                        </div>
                        <p className="text-white whitespace-pre-wrap">{message.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Chat Input with Voice Controls */}
              <div className="flex space-x-3 mt-4">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder={isListening ? "Listening..." : "Type your message or use voice..."}
                  className="flex-1 p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                
                {/* Voice Input Button */}
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`p-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg ${
                    isListening 
                      ? 'bg-gradient-to-r from-red-500 to-red-600 hover:shadow-red-500/25'
                      : 'bg-gradient-to-r from-green-500 to-green-600 hover:shadow-green-500/25'
                  }`}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>

                {/* Stop Speaking Button */}
                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 p-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-orange-500/25"
                  >
                    <Volume2 size={20} />
                  </button>
                )}

                <button
                  onClick={sendMessage}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-purple-500/25"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Event Creation Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-800/90 to-purple-800/90 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-96">
            <h3 className="text-2xl font-semibold mb-6 text-purple-300">Create New Event</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-purple-200">Event Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter event title..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-purple-200">Time</label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-purple-200">Duration</label>
                  <input
                    type="text"
                    value={newEvent.duration}
                    onChange={(e) => setNewEvent({...newEvent, duration: e.target.value})}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="1 hour"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-purple-200">Location</label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Meeting room, online, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-purple-200">Event Type</label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="meeting">Meeting</option>
                  <option value="deadline">Deadline</option>
                  <option value="personal">Personal</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 p-3 rounded-xl font-semibold transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={addEvent}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 p-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                >
                  Create Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}