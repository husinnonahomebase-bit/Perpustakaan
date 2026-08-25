import React, { useState } from 'react';
import { 
  Send, 
  MessageSquare, 
  Check, 
  X, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  User, 
  AlertCircle,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { ChatMessage, Member } from '../types';

interface ChatViewProps {
  chats: ChatMessage[];
  members: Member[];
  onSendMessage: (patronId: string, text: string) => void;
  onApproveExtension: (chatId: string) => void;
  onRejectExtension: (chatId: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  chats,
  members,
  onSendMessage,
  onApproveExtension,
  onRejectExtension,
}) => {
  const [selectedPatronId, setSelectedPatronId] = useState<string>(
    chats[0]?.patronId || members[0]?.id || 'mbr-001'
  );
  const [inputText, setInputText] = useState('');

  const activePatron = members.find(m => m.id === selectedPatronId) || {
    id: selectedPatronId,
    name: 'Eleanor Vance',
    email: 'eleanor.vance@student.lumina.edu',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    role: 'Siswa',
    memberCode: 'LMN-2024-0101'
  };

  const patronChats = chats.filter(c => c.patronId === selectedPatronId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(selectedPatronId, inputText.trim());
    setInputText('');
  };

  return (
    <div id="chat-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Layanan Pesan Langsung
            </span>
            <span className="text-xs text-slate-400 font-mono">Pemberitahuan & Perpanjangan</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Pusat Komunikasi & Pemustaka</h2>
          <p className="text-xs text-slate-400 mt-0.5">Tangani pesan anggota, permintaan perpanjangan buku daring, dan siaran pengumuman</p>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="h-[600px] rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-3">
        {/* Left: Patron List */}
        <div className="border-r border-slate-800 flex flex-col h-full bg-slate-900/50">
          <div className="p-4 border-b border-slate-800">
            <h3 className="font-bold text-sm text-white">Daftar Percakapan</h3>
            <p className="text-[11px] text-slate-400">Pilih pemustaka untuk memulai pesan</p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
            {members.map((member) => {
              const isSelected = member.id === selectedPatronId;
              const hasExtension = chats.some(c => c.patronId === member.id && c.isExtensionRequest && c.status === 'pending');
              return (
                <div
                  key={member.id}
                  onClick={() => setSelectedPatronId(member.id)}
                  className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition ${
                    isSelected ? 'bg-slate-800 border-l-4 border-emerald-400' : 'hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={member.avatar} 
                      alt={member.name} 
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-700" 
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-white truncate">{member.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{member.memberCode}</p>
                    </div>
                  </div>

                  {hasExtension && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Perpanjangan
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Chat Window */}
        <div className="md:col-span-2 flex flex-col h-full bg-slate-950/40">
          {/* Chat Window Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-3">
              <img 
                src={activePatron.avatar} 
                alt={activePatron.name} 
                className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-700" 
              />
              <div>
                <h4 className="font-bold text-xs text-white">{activePatron.name}</h4>
                <p className="text-[10px] text-emerald-400 font-mono">{activePatron.email} • {activePatron.memberCode}</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              WhatsApp & Cloud Push Aktif
            </span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
            {patronChats.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-xs">
                Belum ada riwayat pesan dengan pemustaka ini. Mulai percakapan di bawah.
              </div>
            ) : (
              patronChats.map((msg) => {
                const isLibrarian = msg.sender === 'librarian';
                const isSystem = msg.sender === 'system';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 text-center max-w-md mx-auto">
                      <span className="font-bold text-amber-400 block mb-1">PEMBERITAHUAN OTOMATIS</span>
                      {msg.text}
                      <span className="block text-[9px] text-slate-500 mt-1">{msg.timestamp}</span>
                    </div>
                  );
                }

                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col ${isLibrarian ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isLibrarian 
                        ? 'bg-emerald-500 text-slate-950 font-medium rounded-tr-none' 
                        : 'bg-slate-800 text-white rounded-tl-none border border-slate-700'
                    }`}>
                      <p>{msg.text}</p>

                      {/* If extension request */}
                      {msg.isExtensionRequest && (
                        <div className="mt-3 p-2.5 rounded-xl bg-slate-900/90 text-slate-200 border border-slate-700 text-xs space-y-2">
                          <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Permintaan Perpanjangan: +{msg.extensionDays} Hari</span>
                          </div>
                          <p className="text-[11px] text-slate-400">Buku: {msg.bookTitle}</p>
                          
                          {msg.status === 'pending' ? (
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={() => onApproveExtension(msg.id)}
                                className="flex-1 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px]"
                              >
                                Setujui
                              </button>
                              <button
                                onClick={() => onRejectExtension(msg.id)}
                                className="flex-1 py-1 rounded bg-slate-800 hover:bg-red-500/20 text-red-400 font-bold text-[10px]"
                              >
                                Tolak
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-400">
                              ✓ Telah Disetujui
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-900/80 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ketik balasan atau pengumuman untuk pemustaka..."
              className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
