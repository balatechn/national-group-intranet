'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Search,
  ArrowLeft,
  Circle,
  Users,
  Loader2,
} from 'lucide-react';
import { useSession } from '@/lib/session-context';
import { cn } from '@/lib/utils';

interface OnlineUser {
  id: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  avatar?: string;
  jobTitle?: string;
  lastActiveAt?: string;
  department?: { name: string };
}

interface ChatRoom {
  id: string;
  name: string | null;
  isGroup: boolean;
  otherMembers: OnlineUser[];
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    displayName?: string;
    avatar?: string;
  };
}

type View = 'users' | 'rooms' | 'chat';

export function ChatPanel() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<View>('users');
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [allUsers, setAllUsers] = useState<OnlineUser[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const presenceIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentUserId = session?.user?.id;

  // Heartbeat - update presence every 30s
  useEffect(() => {
    const sendHeartbeat = () => {
      fetch('/api/chat/presence', { method: 'POST' }).catch(() => {});
    };

    sendHeartbeat();
    presenceIntervalRef.current = setInterval(sendHeartbeat, 30000);

    return () => {
      if (presenceIntervalRef.current) clearInterval(presenceIntervalRef.current);
    };
  }, []);

  // Listen for header chat button toggle
  useEffect(() => {
    const handler = () => setIsOpen((prev) => !prev);
    window.addEventListener('toggle-chat', handler);
    return () => window.removeEventListener('toggle-chat', handler);
  }, []);

  // Update header online badge
  useEffect(() => {
    const badge = document.getElementById('header-online-count');
    if (badge) {
      if (onlineUsers.length > 0) {
        badge.textContent = String(onlineUsers.length);
        badge.classList.remove('hidden');
        badge.classList.add('flex');
      } else {
        badge.classList.add('hidden');
        badge.classList.remove('flex');
      }
    }
  }, [onlineUsers]);

  // Fetch online users periodically
  const fetchPresence = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/presence');
      if (res.ok) {
        const data = await res.json();
        setOnlineUsers(data.onlineUsers || []);
        setAllUsers(data.allUsers || []);
      }
    } catch {}
  }, []);

  // Fetch rooms
  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/rooms');
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms || []);
        const unread = (data.rooms || []).reduce((sum: number, r: ChatRoom) => sum + r.unreadCount, 0);
        setTotalUnread(unread);
      }
    } catch {}
  }, []);

  // Fetch messages for active room
  const fetchMessages = useCallback(async (roomId: string) => {
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {}
  }, []);

  // Poll when panel is open
  useEffect(() => {
    if (isOpen) {
      fetchPresence();
      fetchRooms();

      pollIntervalRef.current = setInterval(() => {
        fetchPresence();
        fetchRooms();
        if (activeRoom) {
          fetchMessages(activeRoom.id);
        }
      }, 5000);
    } else {
      // Still poll rooms for unread badge even when closed
      fetchRooms();
      pollIntervalRef.current = setInterval(fetchRooms, 15000);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isOpen, activeRoom, fetchPresence, fetchRooms, fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Open chat with a user
  const openChatWithUser = async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId }),
      });
      if (res.ok) {
        const data = await res.json();
        const room = data.room;
        // Build a ChatRoom-like object
        const otherMembers = room.members
          ?.filter((m: any) => m.userId !== currentUserId)
          .map((m: any) => m.user) || [];
        const chatRoom: ChatRoom = {
          id: room.id,
          name: room.name,
          isGroup: room.isGroup,
          otherMembers,
          lastMessage: null,
          unreadCount: 0,
          updatedAt: room.updatedAt,
        };
        setActiveRoom(chatRoom);
        await fetchMessages(room.id);
        setView('chat');
      }
    } catch (err) {
      console.error('Failed to open chat:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoom || sendingMessage) return;

    setSendingMessage(true);
    try {
      const res = await fetch(`/api/chat/rooms/${activeRoom.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setNewMessage('');
        inputRef.current?.focus();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  const openRoom = async (room: ChatRoom) => {
    setActiveRoom(room);
    setView('chat');
    setLoading(true);
    await fetchMessages(room.id);
    setLoading(false);
  };

  const goBack = () => {
    if (view === 'chat') {
      setActiveRoom(null);
      setMessages([]);
      setView('rooms');
      fetchRooms();
    } else {
      setView('users');
    }
  };

  const isOnline = (user: OnlineUser) => {
    if (!user.lastActiveAt) return false;
    return Date.now() - new Date(user.lastActiveAt).getTime() < 2 * 60 * 1000;
  };

  const getUserName = (user: OnlineUser) =>
    user.displayName || `${user.firstName} ${user.lastName}`;

  const getInitials = (user: OnlineUser) => {
    const f = user.firstName?.[0] || '';
    const l = user.lastName?.[0] || '';
    return `${f}${l}`.toUpperCase();
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const filteredOnlineUsers = search
    ? onlineUsers.filter((u) => getUserName(u).toLowerCase().includes(search.toLowerCase()))
    : onlineUsers;

  const filteredAllUsers = search
    ? allUsers.filter((u) => getUserName(u).toLowerCase().includes(search.toLowerCase()))
    : allUsers;

  const getChatPartnerName = (room: ChatRoom) => {
    if (room.isGroup) return room.name || 'Group Chat';
    return room.otherMembers[0] ? getUserName(room.otherMembers[0]) : 'Unknown';
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-105',
          isOpen
            ? 'bg-gray-600 text-white'
            : 'bg-gradient-to-br from-primary to-primary-600 text-white'
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6" />
            {totalUnread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] text-white font-bold">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
            {onlineUsers.length > 0 && (
              <span className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] text-white font-bold">
                {onlineUsers.length}
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={cn(
          'fixed bottom-24 right-6 z-50 flex w-[380px] flex-col rounded-2xl border border-primary/20 bg-white shadow-2xl transition-all duration-300',
          isOpen ? 'h-[560px] opacity-100 scale-100' : 'h-0 opacity-0 scale-95 pointer-events-none'
        )}
      >
        {isOpen && (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 rounded-t-2xl bg-gradient-to-r from-[#070B47] to-[#0d1266] px-4 py-3 text-white">
              {view !== 'users' && (
                <button onClick={goBack} className="hover:bg-white/10 rounded-full p-1 transition-colors">
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <div className="flex-1 min-w-0">
                {view === 'users' && (
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary-300" />
                    <span className="font-semibold">Team Chat</span>
                    <span className="ml-auto flex items-center gap-1 text-xs text-green-400">
                      <Circle className="h-2 w-2 fill-green-400" />
                      {onlineUsers.length} online
                    </span>
                  </div>
                )}
                {view === 'rooms' && (
                  <span className="font-semibold">Conversations</span>
                )}
                {view === 'chat' && activeRoom && (
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/30 text-xs font-bold text-white">
                        {activeRoom.otherMembers[0]
                          ? getInitials(activeRoom.otherMembers[0])
                          : '?'}
                      </div>
                      {activeRoom.otherMembers[0] && isOnline(activeRoom.otherMembers[0]) && (
                        <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-green-400 text-green-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{getChatPartnerName(activeRoom)}</p>
                      {activeRoom.otherMembers[0] && (
                        <p className="text-[10px] text-white/60">
                          {isOnline(activeRoom.otherMembers[0]) ? 'Online' : 'Offline'}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                {view === 'users' && (
                  <button
                    onClick={() => { fetchRooms(); setView('rooms'); }}
                    className="hover:bg-white/10 rounded-full p-1.5 transition-colors relative"
                    title="Conversations"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {totalUnread > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[8px] text-white">
                        {totalUnread}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Search (for users view) */}
            {view === 'users' && (
              <div className="border-b px-3 py-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search users..."
                    className="w-full rounded-lg bg-gray-100 py-2 pl-8 pr-3 text-sm outline-none focus:bg-gray-50 focus:ring-1 focus:ring-primary/30"
                  />
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Users View */}
              {view === 'users' && (
                <div className="p-2">
                  {/* Online Users */}
                  {filteredOnlineUsers.length > 0 && (
                    <>
                      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-green-600">
                        Online — {filteredOnlineUsers.length}
                      </p>
                      {filteredOnlineUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => openChatWithUser(user.id)}
                          disabled={loading}
                          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-primary-50"
                        >
                          <div className="relative flex-shrink-0">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200 text-xs font-bold text-primary-700">
                              {getInitials(user)}
                            </div>
                            <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-green-500 text-green-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">{getUserName(user)}</p>
                            <p className="truncate text-[11px] text-gray-500">
                              {user.jobTitle || user.department?.name || 'Team Member'}
                            </p>
                          </div>
                        </button>
                      ))}
                    </>
                  )}

                  {/* All Users */}
                  {filteredAllUsers.length > 0 && (
                    <>
                      <p className="mt-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        All Users — {filteredAllUsers.length}
                      </p>
                      {filteredAllUsers
                        .filter((u) => !onlineUsers.find((ou) => ou.id === u.id))
                        .map((user) => (
                          <button
                            key={user.id}
                            onClick={() => openChatWithUser(user.id)}
                            disabled={loading}
                            className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-gray-50"
                          >
                            <div className="relative flex-shrink-0">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                                {getInitials(user)}
                              </div>
                              <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-gray-300 text-gray-300" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-gray-700">{getUserName(user)}</p>
                              <p className="truncate text-[11px] text-gray-400">
                                {user.jobTitle || user.department?.name || 'Team Member'}
                              </p>
                            </div>
                          </button>
                        ))}
                    </>
                  )}

                  {filteredOnlineUsers.length === 0 && filteredAllUsers.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <Users className="h-10 w-10 mb-2" />
                      <p className="text-sm">No users found</p>
                    </div>
                  )}
                </div>
              )}

              {/* Rooms View */}
              {view === 'rooms' && (
                <div className="p-2">
                  {rooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <MessageCircle className="h-10 w-10 mb-2" />
                      <p className="text-sm">No conversations yet</p>
                      <p className="text-xs mt-1">Click on a user to start chatting</p>
                    </div>
                  ) : (
                    rooms.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => openRoom(room)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-primary-50',
                          room.unreadCount > 0 && 'bg-primary-50/50'
                        )}
                      >
                        <div className="relative flex-shrink-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200 text-xs font-bold text-primary-700">
                            {room.otherMembers[0] ? getInitials(room.otherMembers[0]) : '?'}
                          </div>
                          {room.otherMembers[0] && isOnline(room.otherMembers[0]) && (
                            <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-green-500 text-green-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className={cn(
                              'truncate text-sm',
                              room.unreadCount > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                            )}>
                              {getChatPartnerName(room)}
                            </p>
                            {room.lastMessage && (
                              <span className="ml-2 text-[10px] text-gray-400 flex-shrink-0">
                                {formatTime(room.lastMessage.createdAt)}
                              </span>
                            )}
                          </div>
                          {room.lastMessage && (
                            <p className={cn(
                              'truncate text-xs mt-0.5',
                              room.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'
                            )}>
                              {room.lastMessage.senderId === currentUserId ? 'You: ' : ''}
                              {room.lastMessage.content}
                            </p>
                          )}
                        </div>
                        {room.unreadCount > 0 && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white font-bold flex-shrink-0">
                            {room.unreadCount}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Chat View */}
              {view === 'chat' && (
                <div className="flex h-full flex-col">
                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <MessageCircle className="h-8 w-8 mb-2" />
                        <p className="text-sm">No messages yet</p>
                        <p className="text-xs">Say hello! 👋</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.senderId === currentUserId;
                        return (
                          <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                            <div className={cn('max-w-[75%] rounded-2xl px-3.5 py-2', isMe
                              ? 'bg-gradient-to-br from-[#070B47] to-[#0d1266] text-white rounded-br-md'
                              : 'bg-gray-100 text-gray-900 rounded-bl-md'
                            )}>
                              <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                              <p className={cn(
                                'text-[9px] mt-1',
                                isMe ? 'text-white/50 text-right' : 'text-gray-400'
                              )}>
                                {formatTime(msg.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            {view === 'chat' && activeRoom && (
              <form onSubmit={handleSendMessage} className="border-t px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-full bg-gray-100 px-4 py-2 text-sm outline-none focus:bg-gray-50 focus:ring-1 focus:ring-primary/30"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sendingMessage}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full transition-all',
                      newMessage.trim()
                        ? 'bg-gradient-to-br from-primary to-primary-600 text-white hover:scale-105'
                        : 'bg-gray-100 text-gray-400'
                    )}
                  >
                    {sendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </>
  );
}
