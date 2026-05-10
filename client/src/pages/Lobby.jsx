import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

function Lobby() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomCode.trim()) {
      navigate(`/player/${roomCode.toUpperCase()}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card flex flex-col items-center gap-4"
    >
      <h1 className="title">FINANCE GAME</h1>
      <p>당신의 자산을 관리하고 불려보세요!</p>

      <div className="flex flex-col gap-4 mt-8 w-full max-w-sm">
        {localStorage.getItem('hostRoomId') ? (
          <>
            <button onClick={() => navigate('/host')} className="w-full" style={{ backgroundColor: '#10b981', marginBottom: '0.5rem' }}>
              진행 중인 호스트 방 재접속
            </button>
            <button onClick={() => {
              localStorage.removeItem('hostRoomId');
              localStorage.removeItem('hostKey');
              navigate('/host');
            }} className="w-full" style={{ backgroundColor: '#ef4444' }}>
              완전히 새로운 호스트 방 만들기
            </button>
          </>
        ) : (
          <button onClick={() => {
            localStorage.removeItem('hostRoomId');
            localStorage.removeItem('hostKey');
            navigate('/host');
          }} className="w-full" style={{ backgroundColor: '#9333ea' }}>
            호스트로 방 만들기
          </button>
        )}

        <div style={{ margin: '1rem 0', display: 'flex', alignItems: 'center' }}>
          <hr style={{ flex: 1, borderColor: '#374151' }} />
          <span style={{ padding: '0 10px', color: '#9ca3af' }}>OR</span>
          <hr style={{ flex: 1, borderColor: '#374151' }} />
        </div>

        <form onSubmit={handleJoin} className="flex gap-2">
          <input 
            type="text" 
            placeholder="방 코드 입력" 
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            className="w-full"
            style={{ textTransform: 'uppercase' }}
          />
          <button type="submit">입장</button>
        </form>
      </div>
    </motion.div>
  );
}

export default Lobby;
