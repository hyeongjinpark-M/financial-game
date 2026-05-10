const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

// 헬스 체크 엔드포인트 (Railway용)
app.get('/', (req, res) => res.send('Finance Game Server Running'));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const scenarios = [
  { id: 1, title: '최신형 스마트폰', price: 1000000, type: 'buy' },
  { id: 2, title: '유럽 15일 여행', price: 3000000, type: 'buy' },
  { id: 3, title: '실손 의료비 및 종합 보험', price: 100000, type: 'insurance' },
  { id: 4, title: '월 100,000원 1년 만기 적금 (연 8%)', price: 1200000, type: 'savings', desc: '가입 즉시 1년치(120만원)가 지출되며, 1년 뒤 이자와 함께 돌아옵니다.' },
  { id: 5, title: '한정판 명품 백', price: 1000000, type: 'buy' },
  { id: 6, title: '비상금 저축', price: 1200000, type: 'emergency' },
  { id: 7, title: '주식 및 코인 시장 오픈', type: 'invest', 
    items: [
      { id: 'S_Elec', name: 'S전자', price: 100000 },
      { id: 'K_Semi', name: 'K반도체', price: 100000 },
      { id: 'H_Const', name: 'H건설', price: 100000 },
      { id: 'B_Dog', name: 'B반려견 사업', price: 100000 },
      { id: 'D_Coin', name: 'D코인', price: 150000 },
      { id: 'Y_Coin', name: 'Y코인', price: 200000 },
      { id: 'J_Fund', name: 'J펀드', price: 100000 }
    ]
  },
  { id: 8, title: '미슐랭 3스타 식당', price: 700000, type: 'buy' },
  { id: 9, title: '자동차 할인', price: 1000000, type: 'buy_car', desc: '놀라운 할인가 100만원에 자동차를 구매하세요!' },
  { id: 9.5, title: '자동차 유지비 함정!', type: 'car_trap', desc: '자동차를 구매한 사람은 취득세, 주유, 보험료 등 100만원이 추가로 청구됩니다.' },
  { id: 10, title: '주님께 드릴 십일조', price: 1000000, type: 'buy' },
  { id: 11, title: '캠퍼스 간사님 정기 후원', price: 50000, type: 'buy' },
  { id: 12, title: '로또 10장', price: 50000, type: 'lottery' },
  { id: 12.5, title: '돌발상황! 교통사고', type: 'accident', desc: '다리 수술 및 입원. 병원비 400만원 청구. (단, 보험 가입자는 지출액 0원!)' },
  { id: 13, title: '최애 아티스트 월드 투어 VIP', price: 300000, type: 'buy' },
  { id: 14, title: '지인 추천 상가 투자권', price: 1000000, type: 'buy' },
  { id: 15, title: '연금복권 10장', price: 50000, type: 'buy_pension' },
  { id: 15.5, title: '연금복권 당첨 결과', type: 'pension_result', desc: '전체 참가자의 10% 확률로 5,000원에 당첨됩니다!' },
];

const stockRates = [
  // 12월 최종: S전자 -50%, K반도체 -80%, H건설 +160%, B반려견 +170%, D코인 -70%, Y코인 -50%, J펀드 +150%
  // 코인은 중간에 급등락하다 결국 손실로 마무리
  { month: 1,  rates: { S_Elec: 1.0,   K_Semi: 1.1,  H_Const: 1.0,  B_Dog: 0.9,  D_Coin: 1.8,  Y_Coin: 1.5,  J_Fund: 0.95 } },
  { month: 2,  rates: { S_Elec: 0.95,  K_Semi: 1.2,  H_Const: 1.0,  B_Dog: 0.8,  D_Coin: 0.6,  Y_Coin: 2.0,  J_Fund: 0.9  } },
  { month: 3,  rates: { S_Elec: 0.9,   K_Semi: 1.3,  H_Const: 1.05, B_Dog: 0.85, D_Coin: 2.5,  Y_Coin: 0.7,  J_Fund: 1.0  } },
  { month: 4,  rates: { S_Elec: 0.85,  K_Semi: 1.1,  H_Const: 0.95, B_Dog: 0.9,  D_Coin: 0.5,  Y_Coin: 1.8,  J_Fund: 1.05 } },
  { month: 5,  rates: { S_Elec: 0.8,   K_Semi: 0.9,  H_Const: 1.0,  B_Dog: 0.95, D_Coin: 1.5,  Y_Coin: 0.9,  J_Fund: 1.1  } },
  { month: 6,  rates: { S_Elec: 0.75,  K_Semi: 0.8,  H_Const: 0.95, B_Dog: 1.1,  D_Coin: 0.8,  Y_Coin: 1.2,  J_Fund: 1.15 } },
  { month: 7,  rates: { S_Elec: 0.7,   K_Semi: 0.7,  H_Const: 1.1,  B_Dog: 1.3,  D_Coin: 1.8,  Y_Coin: 0.8,  J_Fund: 1.2  } },
  { month: 8,  rates: { S_Elec: 0.8,   K_Semi: 0.6,  H_Const: 1.2,  B_Dog: 1.5,  D_Coin: 0.6,  Y_Coin: 1.5,  J_Fund: 1.25 } },
  { month: 9,  rates: { S_Elec: 0.9,   K_Semi: 0.5,  H_Const: 1.4,  B_Dog: 1.4,  D_Coin: 0.4,  Y_Coin: 0.9,  J_Fund: 1.3  } },
  { month: 10, rates: { S_Elec: 0.7,   K_Semi: 0.4,  H_Const: 1.5,  B_Dog: 1.8,  D_Coin: 0.5,  Y_Coin: 0.7,  J_Fund: 1.35 } },
  { month: 11, rates: { S_Elec: 0.6,   K_Semi: 0.3,  H_Const: 1.8,  B_Dog: 2.0,  D_Coin: 0.35, Y_Coin: 0.6,  J_Fund: 1.4  } },
  { month: 12, rates: { S_Elec: 0.5,   K_Semi: 0.2,  H_Const: 2.6,  B_Dog: 2.7,  D_Coin: 0.30, Y_Coin: 0.50, J_Fund: 2.5  } },
];

const rooms = {};

const INITIAL_BALANCE = 10000000;

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createRoom', () => {
    const roomId = generateRoomCode();
    const hostKey = Math.random().toString(36).substring(2, 10);
    rooms[roomId] = {
      hostId: socket.id,
      hostKey,
      players: {},
      step: 0, // 0: 대기실, 1~15: 시나리오, 16: 주식시장(1~12월), 17: 최종결과
      currentMonth: 0,
    };
    socket.join(roomId);
    socket.emit('roomCreated', { roomId, hostKey });
    console.log(`Room created: ${roomId} by host: ${socket.id}`);
  });

  socket.on('reconnectHost', ({ roomId, hostKey }) => {
    const room = rooms[roomId];
    if (room && room.hostKey === hostKey) {
      room.hostId = socket.id;
      socket.join(roomId);
      socket.emit('roomCreated', { roomId, hostKey });
      socket.emit('updatePlayers', Object.values(room.players));
      // 현재 방 상태 복원
      if (room.step > 0 && room.step <= scenarios.length) {
        socket.emit('gameStateUpdated', { phase: 'scenario', scenario: scenarios[room.step - 1], step: room.step });
      } else if (room.step > scenarios.length && room.currentMonth <= 12) {
        socket.emit('gameStateUpdated', { phase: 'market', month: room.currentMonth, rates: stockRates[room.currentMonth - 1].rates });
      } else if (room.step > scenarios.length && room.currentMonth === 13) {
        socket.emit('gameStateUpdated', { phase: 'prayer_letter' });
      } else if (room.step > scenarios.length && room.currentMonth > 13) {
        socket.emit('gameStateUpdated', { phase: 'result', players: Object.values(room.players) });
      }
    } else {
      socket.emit('error', '방을 찾을 수 없거나 권한이 없습니다.');
      socket.emit('forceNewRoom'); // 클라이언트가 새로 방을 만들도록 유도
    }
  });

  socket.on('joinRoom', ({ roomId, nickname, playerId }) => {
    const room = rooms[roomId];
    if (room) {
      const existingPlayer = room.players[playerId];
      
      if (existingPlayer) {
        // 재접속 처리
        socket.join(roomId);
        existingPlayer.socketId = socket.id;
        socket.emit('joined', { roomId, player: existingPlayer });
        
        // 현재 상태 전송 (화면 복구)
        if (room.step > 0 && room.step <= scenarios.length) {
          socket.emit('gameStateUpdated', { phase: 'scenario', scenario: scenarios[room.step - 1], step: room.step });
        } else if (room.step > scenarios.length && room.currentMonth <= 12) {
          socket.emit('gameStateUpdated', { phase: 'market', month: room.currentMonth, rates: stockRates[room.currentMonth - 1].rates });
        } else if (room.step > scenarios.length && room.currentMonth === 13) {
          socket.emit('gameStateUpdated', { phase: 'prayer_letter' });
        } else if (room.step > scenarios.length && room.currentMonth > 13) {
          socket.emit('gameStateUpdated', { phase: 'result', players: Object.values(room.players) });
        } else {
          socket.emit('gameStateUpdated', { phase: 'lobby' });
        }
        io.to(roomId).emit('updatePlayers', Object.values(room.players));
        return;
      }

      if (room.step > 0) {
        socket.emit('error', '이미 게임이 시작되었습니다.');
        return;
      }

      // 같은 닉네임이 다른 playerId로 이미 존재하는지 확인 (중복 방지)
      const duplicateNick = Object.values(room.players).find(
        p => p.nickname === nickname.trim() && p.id !== playerId
      );
      if (duplicateNick) {
        socket.emit('error', `'${nickname}' 닉네임은 이미 사용 중입니다. 다른 이름을 입력해주세요.`);
        return;
      }

      socket.join(roomId);
      room.players[playerId] = {
        id: playerId,
        socketId: socket.id,
        nickname: nickname.trim(),
        balance: INITIAL_BALANCE,
        savings: 0,
        emergency: 0,
        insurance: false,
        stocks: { S_Elec: 0, K_Semi: 0, H_Const: 0, B_Dog: 0, D_Coin: 0, Y_Coin: 0, J_Fund: 0 },
        items: []
      };
      io.to(roomId).emit('updatePlayers', Object.values(room.players));
      socket.emit('joined', { roomId, player: room.players[playerId] });
    } else {
      socket.emit('error', '방을 찾을 수 없습니다.');
    }
  });

  socket.on('startGame', (roomId) => {
    console.log(`startGame called for room ${roomId} by socket ${socket.id}`);
    const room = rooms[roomId];
    if (room && room.hostId === socket.id) {
      console.log(`Host ID matched! Emitting gameStateUpdated to room ${roomId}`);
      room.step = 1;
      io.to(roomId).emit('gameStateUpdated', { phase: 'scenario', scenario: scenarios[0], step: room.step });
    } else {
      console.log(`Host ID MISMATCH! Room hostId: ${room?.hostId}, socket.id: ${socket.id}`);
      socket.emit('error', '서버가 재시작되었거나 방을 찾을 수 없습니다. 페이지를 새로고침하여 새 방을 만들어주세요.');
    }
  });

  socket.on('nextStep', (roomId) => {
    const room = rooms[roomId];
    if (room && room.hostId === socket.id) {
      room.step++;
      
      const currentScenario = scenarios[room.step - 1];

      if (currentScenario && currentScenario.type === 'accident') {
        Object.values(room.players).forEach(p => {
          if (!p.insurance) {
            p.balance -= 4000000; // 보험 없으면 400만원 차감
          }
        });
      }

      if (currentScenario && currentScenario.type === 'car_trap') {
        Object.values(room.players).forEach(p => {
          if (p.items.includes('자동차 할인')) {
            p.balance -= 1000000;
          }
        });
      }

      if (currentScenario && currentScenario.type === 'pension_result') {
        const allPlayers = Object.values(room.players);
        const winCount = Math.max(1, Math.floor(allPlayers.length * 0.1));
        const buyers = allPlayers.filter(p => p.items.includes('연금복권 10장'));
        
        // 무작위로 당첨자 선정
        const shuffled = buyers.sort(() => 0.5 - Math.random());
        const winners = shuffled.slice(0, winCount);
        
        allPlayers.forEach(p => {
           if (winners.includes(p)) {
              p.balance += 5000;
              p.pensionWinner = true;
           } else if (p.items.includes('연금복권 10장')) {
              p.pensionWinner = false;
           }
        });
      }

      if (room.step <= scenarios.length) {
        io.to(roomId).emit('gameStateUpdated', { phase: 'scenario', scenario: currentScenario, step: room.step });
      } else if (room.step === scenarios.length + 1) {
        // 주식 장 시작 (1월)
        room.currentMonth = 1;
        io.to(roomId).emit('gameStateUpdated', { phase: 'market', month: 1, rates: stockRates[0].rates });
      } else if (room.step > scenarios.length + 1) {
        room.currentMonth++;
        if (room.currentMonth <= 12) {
          io.to(roomId).emit('gameStateUpdated', { phase: 'market', month: room.currentMonth, rates: stockRates[room.currentMonth - 1].rates });
        } else if (room.currentMonth === 13) {
          // 기도편지
          io.to(roomId).emit('gameStateUpdated', { phase: 'prayer_letter' });
        } else {
          // 최종 결과
          // 이자 및 주식 매각 대금 입금 계산
          Object.values(room.players).forEach(p => {
             // 1. 적금 만기
             const savingsInterest = p.savings * 0.08; // 8% 이자
             p.savingsResult = { principal: p.savings, interest: savingsInterest };
             p.balance += (p.savings + savingsInterest); 
             p.savings = 0; // 현금으로 입금되었으므로 적금 통장 비움
             
             // 2. 주식 일괄 매각
             let stockValue = 0;
             let stockPrincipal = 0;
             const finalRates = stockRates[11].rates;
             for (const [key, amount] of Object.entries(p.stocks)) {
                 const stockItem = scenarios.find(s => s.type === 'invest').items.find(i => i.id === key);
                 if (stockItem && amount > 0) {
                     stockPrincipal += (stockItem.price * amount);
                     stockValue += (stockItem.price * amount * finalRates[key]);
                 }
             }
             p.stockResult = { principal: stockPrincipal, finalValue: stockValue, profit: stockValue - stockPrincipal };
             p.balance += stockValue;
             p.stocks = { S_Elec: 0, K_Semi: 0, H_Const: 0, B_Dog: 0, D_Coin: 0, Y_Coin: 0, J_Fund: 0 }; // 매각 완료
             
             // 상가 투자권 반영
             if (p.items.includes('지인 추천 상가 투자권')) {
                 p.balance += 500000; // 잔액으로 50만원 회수 (가치 폭락)
             }
             
             p.totalAsset = p.balance + p.emergency;
          });
          io.to(roomId).emit('gameStateUpdated', { phase: 'result', players: Object.values(room.players) });
        }
      }
      io.to(roomId).emit('updatePlayers', Object.values(room.players));
      // 각 플레이어의 개인 화면(상태) 동기화
      Object.values(room.players).forEach(p => {
        io.to(p.socketId).emit('playerUpdated', p);
      });
    }
  });

  socket.on('buyItem', ({ roomId, playerId, quantity = 1, investData = null }) => {
    const room = rooms[roomId];
    if (!room) return;
    const player = room.players[playerId];
    if (!player) return;

    const currentScenario = scenarios[room.step - 1];
    
    if (currentScenario.type === 'invest') {
       // 주식 투자
       let totalCost = 0;
       for (const [key, amount] of Object.entries(investData)) {
           const stockInfo = currentScenario.items.find(i => i.id === key);
           if (stockInfo) totalCost += stockInfo.price * amount;
       }
       if (player.balance >= totalCost) {
           player.balance -= totalCost;
           for (const [key, amount] of Object.entries(investData)) {
               player.stocks[key] += amount;
           }
       }
    } else if (currentScenario.type === 'lottery') {
       const cost = currentScenario.price;
       if (player.balance >= cost) {
           player.balance -= cost;
           // 로또 로직은 프론트엔드에서 번호 추첨 결과만 서버로 전송하도록 설계
       }
    } else if (currentScenario.type === 'accident' || currentScenario.type === 'car_trap' || currentScenario.type === 'prayer_letter' || currentScenario.type === 'pension_result') {
       // 돌발 상황: 호스트가 '다음'을 누르기 전, 자동 적용
    } else {
       const cost = currentScenario.price * quantity;
       if (player.balance >= cost) {
           player.balance -= cost;
           player.items.push(currentScenario.title);
           if (currentScenario.type === 'insurance') player.insurance = true;
           if (currentScenario.type === 'savings') player.savings += cost;
           if (currentScenario.type === 'emergency') player.emergency += cost;
       }
    }
    
    // 플레이어 개인에게 상태 업데이트
    socket.emit('playerUpdated', player);
    // 호스트를 위해 전체 상태 업데이트
    io.to(roomId).emit('updatePlayers', Object.values(room.players));
  });

  // 로또 결과 전송 (프론트엔드에서 당첨금을 계산해서 보냄)
  socket.on('lotteryResult', ({ roomId, playerId, prize }) => {
    const room = rooms[roomId];
    if (room && room.players[playerId]) {
        room.players[playerId].balance += prize;
        socket.emit('playerUpdated', room.players[playerId]);
        io.to(roomId).emit('updatePlayers', Object.values(room.players));
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
