import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { socket } from '../socket';

function Player() {
  const { roomId } = useParams();
  const [nickname, setNickname] = useState('');
  // playerId는 브라우저 세션별 고유 ID (탭/기기마다 다름)
  const [playerId] = useState(() => {
    let id = sessionStorage.getItem('playerId');
    if (!id) {
      id = Math.random().toString(36).substring(2, 10);
      sessionStorage.setItem('playerId', id);
    }
    return id;
  });
  const [joined, setJoined] = useState(false);
  const [playerInfo, setPlayerInfo] = useState(null);
  const [gameState, setGameState] = useState({ step: 0 });
  
  // 투자 시나리오 폼 상태
  const [investForm, setInvestForm] = useState({});
  // 일반 구매 시나리오 폼 상태 (수량)
  const [buyQuantity, setBuyQuantity] = useState(1);
  // 로또 상태
  const [lotteryNumbers, setLotteryNumbers] = useState([]);
  const [lotteryResult, setLotteryResult] = useState(null);

  useEffect(() => {
    // 같은 탭에서 같은 방에 이미 접속한 적 있으면 자동 재접속
    const savedRoomId = sessionStorage.getItem('joinedRoomId');
    const savedNickname = sessionStorage.getItem('joinedNickname');
    if (savedRoomId === roomId && savedNickname && playerId) {
      setNickname(savedNickname);
      socket.emit('joinRoom', { roomId, nickname: savedNickname, playerId });
    }

    socket.on('joined', ({ player }) => {
      setJoined(true);
      setPlayerInfo(player);
      sessionStorage.setItem('joinedRoomId', roomId);
      sessionStorage.setItem('joinedNickname', player.nickname);
    });

    socket.on('playerUpdated', (player) => {
      setPlayerInfo(player);
    });

    socket.on('gameStateUpdated', (state) => {
      setGameState(state);
      if (state.phase === 'scenario' && (!gameState.scenario || state.scenario.id !== gameState.scenario?.id)) {
        setBuyQuantity(1);
        setInvestForm({});
        setLotteryBought(false);
        setLotterySelections([1,1,1,1]);
        setLotteryResult(null);
      }
    });

    socket.on('error', (msg) => alert(msg));

    return () => {
      socket.off('joined');
      socket.off('playerUpdated');
      socket.off('gameStateUpdated');
      socket.off('error');
    };
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    if (nickname.trim()) {
      // 같은 방에 같은 닉네임이 이미 있는지 서버에서 체크됨
      socket.emit('joinRoom', { roomId, nickname: nickname.trim(), playerId });
    }
  };

  const [lotteryBought, setLotteryBought] = useState(false);
  const [lotterySelections, setLotterySelections] = useState([1, 1, 1, 1]);

  const handleBuy = () => {
    if (playerInfo.balance <= 0) return;
    if (gameState.scenario?.price * buyQuantity > playerInfo.balance) return alert('잔액이 부족합니다.');
    socket.emit('buyItem', { roomId, playerId, quantity: buyQuantity });
  };

  const handleInvest = () => {
    if (playerInfo.balance <= 0) return;
    let totalCost = 0;
    for (const [key, amount] of Object.entries(investForm)) {
      const stockInfo = gameState.scenario.items.find(i => i.id === key);
      if (stockInfo) totalCost += stockInfo.price * amount;
    }
    if (totalCost > playerInfo.balance) return alert('잔액이 부족합니다.');
    socket.emit('buyItem', { roomId, playerId, investData: investForm });
  };

  const buyLotteryFirst = () => {
    if (playerInfo.balance < 50000) return alert('잔액이 부족합니다.');
    socket.emit('buyItem', { roomId, playerId, quantity: 1 });
    setLotteryBought(true);
  };

  const updateLotterySelection = (index, value) => {
    const newSelections = [...lotterySelections];
    newSelections[index] = value;
    setLotterySelections(newSelections);
  };

  const playLottery = () => {
    // 서버에서 생성한 당첨번호 사용 (모든 참가자 동일)
    const winningNumbers = gameState.scenario?.winningNumbers || [];
    
    let matchCount = 0;
    const winCopy = [...winningNumbers];
    lotterySelections.forEach(num => {
      const idx = winCopy.indexOf(parseInt(num));
      if (idx !== -1) {
        matchCount++;
        winCopy.splice(idx, 1);
      }
    });

    let prize = 0;
    if (matchCount === 4) prize = 10000000;
    else if (matchCount === 3) prize = 5000000;
    else if (matchCount === 2) prize = 100000;

    setLotteryResult({ winningNumbers, matchCount, prize });

    if (prize > 0) {
      socket.emit('lotteryResult', { roomId, playerId, prize });
    }
  };

  if (!joined) {
    return (
      <div className="card max-w-sm mx-auto">
        <h2 className="title text-2xl">방 입장</h2>
        <p className="mb-4">방 코드: {roomId}</p>
        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="닉네임" 
            value={nickname} 
            onChange={e => setNickname(e.target.value)}
          />
          <button type="submit">입장하기</button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-md mx-auto w-full pb-24">
      {/* 고정된 상단 내 자산 요약 */}
      <div className="card" style={{ position: 'sticky', top: '10px', zIndex: 10, padding: '1rem' }}>
        <div className="flex justify-between items-center">
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{playerInfo.nickname}</div>
          <div style={{ color: '#fbbf24', fontSize: '1.5rem', fontWeight: 'bold' }}>
            {Math.round(playerInfo.balance).toLocaleString()} 원
          </div>
        </div>
      </div>

      {(!gameState.phase || gameState.phase === 'lobby') && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card text-center">
          <h3>게임 대기 중...</h3>
          <p>호스트가 게임을 시작할 때까지 기다려주세요.</p>
        </motion.div>
      )}

      {gameState.phase === 'scenario' && gameState.scenario && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#9333ea' }}>{gameState.scenario.title}</h3>
          
          {playerInfo.balance <= 0 && gameState.scenario.type !== 'car_trap' && gameState.scenario.type !== 'accident' && (
            <div style={{ color: '#ef4444', fontWeight: 'bold', marginBottom: '1rem', padding: '0.5rem', border: '1px solid #ef4444', borderRadius: '8px' }}>
              잔액이 0원 이하입니다. (추가 구매 및 투자 불가)
            </div>
          )}

          {gameState.scenario.type === 'buy' || gameState.scenario.type === 'insurance' || gameState.scenario.type === 'savings' || gameState.scenario.type === 'emergency' || gameState.scenario.type === 'buy_car' || gameState.scenario.type === 'buy_pension' ? (
            <div className="flex flex-col gap-4">
              <div style={{ fontSize: '1.2rem' }}>가격: {gameState.scenario.price?.toLocaleString()} 원</div>
              <div className="flex items-center gap-4 justify-center my-4">
                <button onClick={() => setBuyQuantity(Math.max(1, buyQuantity - 1))}>-</button>
                <span style={{ fontSize: '1.5rem', width: '40px', textAlign: 'center' }}>{buyQuantity}</span>
                <button onClick={() => setBuyQuantity(buyQuantity + 1)}>+</button>
              </div>
              <button onClick={handleBuy} style={{ background: playerInfo.balance <= 0 ? '#4b5563' : '#10b981' }} disabled={playerInfo.balance <= 0}>구매하기</button>
            </div>
          ) : gameState.scenario.type === 'invest' ? (
            <div className="flex flex-col gap-4">
              <p>투자할 수량을 입력하세요.</p>
              {gameState.scenario.items.map(item => (
                <div key={item.id} className="flex justify-between items-center gap-2">
                  <div className="text-left w-1/2">
                    <div>{item.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{item.price.toLocaleString()}원</div>
                  </div>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="수량"
                    value={investForm[item.id] || ''}
                    onChange={(e) => setInvestForm({...investForm, [item.id]: parseInt(e.target.value) || 0})}
                    style={{ width: '80px' }}
                  />
                </div>
              ))}
              <button onClick={handleInvest} style={{ background: '#10b981', marginTop: '1rem' }} disabled={playerInfo.balance <= 0}>투자하기</button>
            </div>
          ) : gameState.scenario.type === 'lottery' ? (
            <div className="flex flex-col gap-4">
              {!lotteryBought ? (
                <>
                  <p>로또 10장을 50,000원에 구매하시겠습니까?</p>
                  <button onClick={buyLotteryFirst} style={{ background: '#10b981' }} disabled={playerInfo.balance < 50000}>50,000원 구매하기</button>
                </>
              ) : !lotteryResult ? (
                <>
                  <p>번호 4개를 선택하세요 (각 그룹 1~45)</p>
                  <div className="flex flex-col gap-2">
                    {[0, 1, 2, 3].map(group => (
                      <div key={group} className="flex justify-between items-center gap-4">
                        <span>그룹 {group + 1}</span>
                        <select 
                          value={lotterySelections[group]}
                          onChange={e => updateLotterySelection(group, e.target.value)}
                          style={{ padding: '0.5rem', borderRadius: '4px', background: '#374151', color: 'white', border: 'none', flex: 1 }}
                        >
                          {Array.from({length: 45}, (_, i) => i + 1).map(num => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  <button onClick={playLottery} style={{ background: '#3b82f6', marginTop: '1rem' }}>번호 확정 및 추첨</button>
                </>
              ) : (
                <div className="p-4" style={{ background: '#1f2937', borderRadius: '8px' }}>
                  <h4 style={{ color: '#fbbf24', fontSize: '1.2rem' }}>추첨 결과</h4>
                  <p>당첨 번호: {lotteryResult.winningNumbers.join(', ')}</p>
                  <p>맞은 개수: {lotteryResult.matchCount}개</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981', marginTop: '1rem' }}>
                    당첨금: {lotteryResult.prize.toLocaleString()} 원
                  </p>
                </div>
              )}
            </div>
          ) : gameState.scenario.type === 'car_trap' ? (
            <div className="font-bold p-4 text-center" style={{ background: '#1f2937', borderRadius: '8px' }}>
              {playerInfo.items.includes('자동차 할인') ? (
                <div>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚗💸</div>
                  <span style={{ color: '#ef4444', fontSize: '1.2rem' }}>
                    자동차 유지비 함정 발동!
                  </span>
                  <div className="mt-2" style={{ color: '#fbbf24' }}>
                    취득세, 주유, 보험료 등으로<br/>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>-1,000,000원</span>이 청구되었습니다!
                  </div>
                </div>
              ) : (
                <span style={{ color: '#10b981', fontSize: '1.2rem' }}>
                  🎉 자동차를 구매하지 않아 유지비 함정을 피했습니다!
                </span>
              )}
            </div>
          ) : gameState.scenario.type === 'accident' ? (
            <div className="font-bold p-4 text-center" style={{ background: '#1f2937', borderRadius: '8px' }}>
              {playerInfo.insurance ? (
                <div>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛡️✨</div>
                  <span style={{ color: '#10b981', fontSize: '1.2rem' }}>
                    보험 덕분에 병원비 0원! 가입하길 잘했네요!
                  </span>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚑💔</div>
                  <span style={{ color: '#ef4444', fontSize: '1.2rem' }}>
                    교통사고 발생! 보험 미가입으로
                  </span>
                  <div className="mt-2" style={{ color: '#fbbf24' }}>
                    병원비 <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>-4,000,000원</span> 청구!
                  </div>
                </div>
              )}
            </div>
          ) : gameState.scenario.type === 'pension_result' ? (
            <div className="font-bold p-4 text-center" style={{ background: '#1f2937', borderRadius: '8px' }}>
              {playerInfo.items.includes('연금복권 10장') ? (
                 playerInfo.pensionWinner ? (
                   <span style={{ color: '#10b981', fontSize: '1.2rem' }}>🎉 축하합니다! 연금복권에 당첨되어 5,000원을 획득했습니다!</span>
                 ) : (
                   <span style={{ color: '#ef4444', fontSize: '1.2rem' }}>😥 아쉽게도 낙첨되었습니다...</span>
                 )
              ) : (
                 <span style={{ color: '#9ca3af', fontSize: '1.2rem' }}>연금복권을 구매하지 않았습니다.</span>
              )}
            </div>
          ) : (
            <div>돌발 상황이 발생했습니다! 호스트 화면을 주목하세요.</div>
          )}
        </motion.div>
      )}

      {gameState.phase === 'market' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
          <h3 className="title text-xl">{gameState.month}월 시장 동향 확인</h3>
          <div className="grid grid-cols-2 gap-2 my-4 text-left text-sm">
            {Object.entries(gameState.rates || {}).map(([key, rate]) => (
              <div key={key} className="p-2 flex justify-between" style={{ background: '#1f2937', borderRadius: '4px' }}>
                <span>{key === 'S_Elec' ? 'S전자' : key === 'K_Semi' ? 'K반도체' : key === 'H_Const' ? 'H건설' : key === 'B_Dog' ? 'B반려견 사업' : key === 'D_Coin' ? 'D코인' : key === 'Y_Coin' ? 'Y코인' : 'J펀드'}</span>
                <span style={{ color: rate >= 1 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                  {rate >= 1 ? '+' : ''}{Math.round((rate - 1) * 100)}%
                </span>
              </div>
            ))}
          </div>
          {gameState.month === 12 && (
            <p className="mt-4 font-bold" style={{ color: '#fbbf24' }}>연말이 되어 보유하신 주식/코인이 모두 현재가에 일괄 매각되어 잔액으로 입금됩니다!</p>
          )}
        </motion.div>
      )}

      {gameState.phase === 'prayer_letter' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
          <h3 className="title text-xl">간사님의 기도 편지</h3>
          <div className="my-4 text-left flex flex-col gap-4">
            <img src="/prayer_letter_image_1778427216006.png" alt="기도편지 이미지" style={{ width: '100%', borderRadius: '8px', maxHeight: '300px', objectFit: 'cover' }} />
            <p style={{ fontSize: '1rem', lineHeight: '1.6' }}>
              사랑하는 동역자님,<br/><br/>
              동역자님의 후원으로 캠퍼스 사역에 큰 힘을 얻고 있습니다. 많은 학생들을 전도하고 양육하여 순장으로 세우는 귀한 일을 감당하고 있습니다.<br/><br/>
              또한 저희 자녀에게 새 옷이 꼭 필요했는데, 동역자님의 따뜻한 손길 덕분에 예쁜 옷을 사 입힐 수 있었습니다. 언제나 함께해 주심에 깊은 감사를 드립니다.
            </p>
          </div>
        </motion.div>
      )}

      {gameState.phase === 'result' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card text-center">
          <h2 className="title text-2xl">최종 자산 결과</h2>
          <div className="p-4 mt-4" style={{ background: '#fbbf24', color: 'black', borderRadius: '8px' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
              {gameState.players?.find(p => p.id === playerId)?.nickname}님의 최종 자산:
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
              {Math.round(gameState.players?.find(p => p.id === playerId)?.totalAsset || 0).toLocaleString()} 원
            </div>
            <div style={{ fontSize: '1rem', marginTop: '0.5rem', fontWeight: 'bold' }}>
              {(() => {
                const sorted = [...(gameState.players || [])].sort((a, b) => b.totalAsset - a.totalAsset);
                const myRank = sorted.findIndex(p => p.id === playerId) + 1;
                return `전체 ${myRank}위`;
              })()}
            </div>
          </div>

          <div className="text-left mt-8 flex flex-col gap-4">
            <h3 style={{ fontSize: '1.3rem', borderBottom: '1px solid #374151', paddingBottom: '0.5rem' }}>정산 상세 내역</h3>
            
            {playerInfo.savingsResult && (
              <div className="p-4" style={{ background: '#1f2937', borderRadius: '8px' }}>
                <div style={{ fontWeight: 'bold', color: '#10b981' }}>적금 만기 입금 완료!</div>
                <div className="text-sm mt-2 flex justify-between"><span>원금:</span><span>{playerInfo.savingsResult.principal.toLocaleString()}원</span></div>
                <div className="text-sm flex justify-between"><span>이자 수익 (+8%):</span><span style={{ color: '#fbbf24' }}>+{playerInfo.savingsResult.interest.toLocaleString()}원</span></div>
              </div>
            )}

            {playerInfo.stockResult && (
              <div className="p-4" style={{ background: '#1f2937', borderRadius: '8px' }}>
                <div style={{ fontWeight: 'bold', color: playerInfo.stockResult.profit >= 0 ? '#10b981' : '#ef4444' }}>주식/코인 일괄 매각 완료!</div>
                <div className="text-sm mt-2 flex justify-between"><span>투자 원금:</span><span>{playerInfo.stockResult.principal.toLocaleString()}원</span></div>
                <div className="text-sm flex justify-between"><span>최종 매각 대금:</span><span>{playerInfo.stockResult.finalValue.toLocaleString()}원</span></div>
                <div className="text-sm flex justify-between font-bold mt-1" style={{ color: playerInfo.stockResult.profit >= 0 ? '#10b981' : '#ef4444' }}>
                  <span>{playerInfo.stockResult.profit >= 0 ? '순수익' : '손실'}:</span>
                  <span>{playerInfo.stockResult.profit > 0 ? '+' : ''}{playerInfo.stockResult.profit.toLocaleString()}원</span>
                </div>
              </div>
            )}
            
            {playerInfo.items.includes('지인 추천 상가 투자권') && (
              <div className="p-4" style={{ background: '#1f2937', borderRadius: '8px' }}>
                <div style={{ fontWeight: 'bold', color: '#ef4444' }}>지인 추천 상가 투자 결산</div>
                <div className="text-sm mt-2 flex justify-between"><span>투자 원금:</span><span>1,000,000원</span></div>
                <div className="text-sm flex justify-between"><span>최종 회수 대금:</span><span>500,000원</span></div>
                <div className="text-sm flex justify-between font-bold mt-1" style={{ color: '#ef4444' }}>
                  <span>가치 폭락:</span>
                  <span>-50% (-500,000원)</span>
                </div>
              </div>
            )}
            
            <p className="mt-4 text-center" style={{ color: '#9ca3af' }}>1년간의 자산 관리 수고하셨습니다.</p>
          </div>
          
          <button onClick={() => {
            localStorage.removeItem('joinedRoomId');
            localStorage.removeItem('playerId');
            window.location.reload();
          }} style={{ fontSize: '1rem', padding: '0.8rem 2rem', marginTop: '2rem', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444' }}>
            새 게임을 위해 방 나가기
          </button>
        </motion.div>
      )}

      {/* 내 자산 상세 현황 */}
      <div className="card mt-4 text-left">
        <h4 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #374151', paddingBottom: '0.5rem' }}>자산 상세</h4>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between"><span>보험 여부:</span> <span>{playerInfo.insurance ? '가입됨 🟢' : '미가입 🔴'}</span></div>
          <div className="flex justify-between"><span>비상금:</span> <span>{playerInfo.emergency.toLocaleString()}원</span></div>
          <div className="flex justify-between"><span>적금:</span> <span>{playerInfo.savings.toLocaleString()}원</span></div>
          
          <h5 className="mt-4" style={{ color: '#9ca3af' }}>보유 주식/코인 (수량)</h5>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(playerInfo.stocks).map(([key, amount]) => amount > 0 && (
              <div key={key} className="flex justify-between p-2 rounded" style={{ background: '#1f2937' }}>
                <span>{key === 'S_Elec' ? 'S전자' : key === 'K_Semi' ? 'K반도체' : key === 'H_Const' ? 'H건설' : key === 'B_Dog' ? 'B반려견 사업' : key === 'D_Coin' ? 'D코인' : key === 'Y_Coin' ? 'Y코인' : 'J펀드'}</span><span>{amount}개</span>
              </div>
            ))}
          </div>

          <h5 className="mt-4" style={{ color: '#9ca3af' }}>보유 아이템</h5>
          <div className="flex gap-2 flex-wrap text-sm">
            {playerInfo.items.map((item, idx) => (
              <span key={idx} style={{ background: '#374151', padding: '4px 8px', borderRadius: '4px' }}>{item}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Player;
