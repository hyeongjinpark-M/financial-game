import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { socket } from '../socket';

function Host() {
  const [roomId, setRoomId] = useState('');
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState({ step: 0 }); // 0: lobby, 1~15: scenario, 16+: stock market
  
  useEffect(() => {
    const savedRoomId = localStorage.getItem('hostRoomId');
    const savedHostKey = localStorage.getItem('hostKey');
    
    if (savedRoomId && savedHostKey) {
      socket.emit('reconnectHost', { roomId: savedRoomId, hostKey: savedHostKey });
    } else {
      socket.emit('createRoom');
    }
    
    socket.on('roomCreated', ({ roomId: id, hostKey }) => {
      setRoomId(id);
      localStorage.setItem('hostRoomId', id);
      if (hostKey) localStorage.setItem('hostKey', hostKey);
    });

    socket.on('forceNewRoom', () => {
      localStorage.removeItem('hostRoomId');
      localStorage.removeItem('hostKey');
      socket.emit('createRoom');
    });

    socket.on('updatePlayers', (playerList) => {
      setPlayers(playerList);
    });

    socket.on('gameStateUpdated', (state) => {
      if (state.phase === 'result') {
        setPlayers(state.players);
      }
      setGameState(state);
    });

    socket.on('error', (msg) => alert(msg));

    return () => {
      socket.off('roomCreated');
      socket.off('forceNewRoom');
      socket.off('updatePlayers');
      socket.off('gameStateUpdated');
      socket.off('error');
    };
  }, []);

  const handleStart = () => socket.emit('startGame', roomId);
  const handleNext = () => socket.emit('nextStep', roomId);

  if (!roomId) return <div>방 생성 중...</div>;

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto">
      {(!gameState.phase || gameState.phase === 'lobby') && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card w-full">
          <h2 className="title">방이 생성되었습니다!</h2>
          <div className="flex justify-center gap-8 items-center my-8">
            <div className="flex flex-col items-center gap-4">
              <span style={{ fontSize: '1.2rem', color: '#9ca3af' }}>방 코드</span>
              <span style={{ fontSize: '3rem', fontWeight: 'bold', letterSpacing: '0.2em' }}>{roomId}</span>
            </div>
            <div style={{ background: 'white', padding: '16px', borderRadius: '12px' }}>
              <QRCodeSVG value={`${window.location.origin}/player/${roomId}`} size={200} />
            </div>
          </div>
          
          <div className="text-left mt-8">
            <h3>대기 중인 플레이어 ({players.length}명)</h3>
            <div className="flex gap-2 flex-wrap mt-2">
              {players.map(p => (
                <span key={p.id} style={{ background: '#374151', padding: '8px 16px', borderRadius: '20px' }}>
                  {p.nickname}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8 w-full">
            <button 
              onClick={handleStart} 
              className="w-full" 
              style={{ fontSize: '1.5rem', padding: '1rem', background: players.length >= 2 ? '#9333ea' : '#4b5563', cursor: players.length >= 2 ? 'pointer' : 'not-allowed' }}
              disabled={players.length < 2}
            >
              게임 시작
            </button>
            {players.length < 2 && (
              <p className="text-sm mt-2 text-center text-red-400">참여자가 2명 이상이어야 시작할 수 있습니다.</p>
            )}
          </div>
          <button onClick={() => {
            localStorage.removeItem('hostRoomId');
            localStorage.removeItem('hostKey');
            window.location.reload();
          }} className="mt-4 w-full" style={{ fontSize: '1rem', padding: '0.8rem', background: 'transparent', border: '1px solid #4b5563', color: '#9ca3af' }}>
            기존 방 삭제하고 새 코드 발급받기
          </button>
        </motion.div>
      )}

      {gameState.phase === 'scenario' && (
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="card w-full">
          <h2 className="title">시나리오 {gameState.step}</h2>
          <div className="my-8">
            <div className="scenario-title">{gameState.scenario?.title}</div>
            {gameState.scenario?.desc && <p style={{ color: '#ef4444' }}>{gameState.scenario.desc}</p>}
            {gameState.scenario?.price && (
              <div className="scenario-price">{gameState.scenario.price.toLocaleString()} 원</div>
            )}
            
            {gameState.scenario?.type === 'invest' && (
              <div className="grid grid-cols-2 gap-4 text-left">
                {gameState.scenario.items.map(item => (
                  <div key={item.id} className="p-4" style={{ background: '#1f2937', borderRadius: '8px' }}>
                    {item.name} - {item.price.toLocaleString()}원
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleNext} style={{ fontSize: '1.2rem', padding: '0.8rem 2rem' }}>
            다음 단계 진행
          </button>
        </motion.div>
      )}

      {gameState.phase === 'market' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card w-full">
          <h2 className="title">{gameState.month}월 주식/코인 시장 동향</h2>
          <div className="grid grid-cols-2 gap-4 my-8 text-left">
            {Object.entries(gameState.rates || {}).map(([key, rate]) => (
              <div key={key} className="p-4 flex justify-between" style={{ background: '#1f2937', borderRadius: '8px' }}>
                <span>{key === 'S_Elec' ? 'S전자' : key === 'K_Semi' ? 'K반도체' : key === 'H_Const' ? 'H건설' : key === 'B_Dog' ? 'B반려견 사업' : key === 'D_Coin' ? 'D코인' : key === 'Y_Coin' ? 'Y코인' : 'J펀드'}</span>
                <span style={{ color: rate >= 1 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                  {rate >= 1 ? '+' : ''}{Math.round((rate - 1) * 100)}%
                </span>
              </div>
            ))}
          </div>
          <button onClick={handleNext} style={{ fontSize: '1.2rem', padding: '0.8rem 2rem' }}>
            {gameState.month === 12 ? '연말 주식 일괄 매각 및 다음 단계로' : '다음 달로 넘어가기'}
          </button>
        </motion.div>
      )}

      {gameState.phase === 'prayer_letter' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card w-full">
          <h2 className="title">간사님의 기도 편지</h2>
          <div className="my-8 text-left flex flex-col gap-4">
            <img src="/prayer_letter_image_1778427216006.png" alt="기도편지 이미지" style={{ width: '100%', borderRadius: '8px', maxHeight: '400px', objectFit: 'cover' }} />
            <p style={{ fontSize: '1.2rem', lineHeight: '1.8' }}>
              사랑하는 동역자님,<br/><br/>
              동역자님의 후원으로 캠퍼스 사역에 큰 힘을 얻고 있습니다. 많은 학생들을 전도하고 양육하여 순장으로 세우는 귀한 일을 감당하고 있습니다.<br/><br/>
              또한 저희 자녀에게 새 옷이 꼭 필요했는데, 동역자님의 따뜻한 손길 덕분에 예쁜 옷을 사 입힐 수 있었습니다. 언제나 함께해 주심에 깊은 감사를 드립니다.
            </p>
          </div>
          <button onClick={handleNext} style={{ fontSize: '1.2rem', padding: '0.8rem 2rem' }}>
            최종 자산 결과 확인하기
          </button>
        </motion.div>
      )}

      {gameState.phase === 'result' && (
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="card w-full">
          <h2 className="title">최종 자산 결과</h2>
          <div className="flex flex-col gap-4 my-8 text-left">
            {[...players].sort((a, b) => b.totalAsset - a.totalAsset).map((p, idx) => (
              <div key={p.id} className="p-4 flex justify-between items-center" style={{ background: idx === 0 ? '#fbbf24' : '#1f2937', color: idx === 0 ? 'black' : 'white', borderRadius: '8px' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{idx + 1}위 - {p.nickname}</span>
                <span style={{ fontSize: '1.5rem' }}>{Math.round(p.totalAsset).toLocaleString()} 원</span>
              </div>
            ))}
          </div>
          <button onClick={() => {
            localStorage.removeItem('hostRoomId');
            localStorage.removeItem('hostKey');
            window.location.reload();
          }} style={{ fontSize: '1.2rem', padding: '0.8rem 2rem', marginTop: '2rem', background: '#ef4444' }}>
            완전히 종료하고 새 방 만들기
          </button>
        </motion.div>
      )}
      
      {/* 하단 플레이어 대시보드 */}
      {(gameState.phase === 'scenario' || gameState.phase === 'market' || gameState.phase === 'prayer_letter') && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {players.map(p => (
            <div key={p.id} className="p-4" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontWeight: 'bold' }}>{p.nickname}</div>
              <div style={{ color: '#fbbf24' }}>{Math.round(p.balance).toLocaleString()} 원</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Host;
