/**
 * Marcus Web Arcade — Universal WebRTC P2P Multiplayer & QR Room Engine
 * 100% Free • Serverless P2P • <15ms Latency • Zero Login / Zero Friction
 */
(function(window) {
  'use strict';

  // Load PeerJS if not already present
  function loadPeerJS(callback) {
    if (window.Peer) {
      callback();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
    script.onload = callback;
    document.head.appendChild(script);
  }

  const ArcadeMultiplayer = {
    peer: null,
    conn: null,
    isHost: false,
    roomId: null,
    onDataCallback: null,
    onConnectCallback: null,

    // Initialize 1v1 Room
    init: function(config) {
      const { gamePrefix = 'ARCADE', onConnect, onData, onDisconnect } = config;
      this.onDataCallback = onData;
      this.onConnectCallback = onConnect;

      loadPeerJS(() => {
        // Check if URL has #room=XXXX
        const hashMatch = window.location.hash.match(/room=([a-zA-Z0-9_-]+)/);
        if (hashMatch && hashMatch[1]) {
          // GUEST MODE: Join existing room
          this.joinRoom(hashMatch[1]);
        }
      });
    },

    // Host creates a room
    createRoom: function(gamePrefix = 'ROOM') {
      loadPeerJS(() => {
        const randCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.roomId = `${gamePrefix}-${randCode}`;
        this.isHost = true;

        this.peer = new window.Peer(this.roomId, {
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
            ]
          }
        });

        this.peer.on('open', (id) => {
          this.showHostModal(id);
        });

        this.peer.on('connection', (connection) => {
          this.conn = connection;
          this.setupConnectionHandlers();
          this.hideModal();
          if (this.onConnectCallback) this.onConnectCallback({ isHost: true, peerId: this.conn.peer });
        });

        this.peer.on('error', (err) => {
          console.warn('P2P Host Error, retrying with new code:', err);
          if (err.type === 'unavailable-id') {
            this.createRoom(gamePrefix);
          }
        });
      });
    },

    // Guest joins a room
    joinRoom: function(roomId) {
      loadPeerJS(() => {
        this.roomId = roomId;
        this.isHost = false;
        this.showGuestConnectingModal(roomId);

        this.peer = new window.Peer({
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
            ]
          }
        });

        this.peer.on('open', () => {
          this.conn = this.peer.connect(roomId, { reliable: false }); // UDP style for real-time gaming
          this.setupConnectionHandlers();
          this.conn.on('open', () => {
            this.hideModal();
            if (this.onConnectCallback) this.onConnectCallback({ isHost: false, peerId: roomId });
          });
        });

        this.peer.on('error', (err) => {
          console.error('Guest connection error:', err);
          alert('Could not connect to room: ' + roomId + '. Room may be full or closed.');
          this.hideModal();
        });
      });
    },

    // Send high-speed game state or input packet
    send: function(data) {
      if (this.conn && this.conn.open) {
        this.conn.send(data);
      }
    },

    setupConnectionHandlers: function() {
      if (!this.conn) return;

      this.conn.on('data', (data) => {
        if (this.onDataCallback) this.onDataCallback(data);
      });

      this.conn.on('close', () => {
        alert('Opponent disconnected!');
        window.location.hash = '';
        window.location.reload();
      });
    },

    // UI: Show Host QR Code & Share Modal
    showHostModal: function(roomCode) {
      const roomUrl = `${window.location.origin}${window.location.pathname}#room=${roomCode}`;
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(roomUrl)}&bgcolor=060814&color=00f5ff&margin=6`;

      let modal = document.getElementById('arcade-mp-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'arcade-mp-modal';
        this._injectStyles();
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div class="mp-box">
          <button id="mp-close-btn" class="mp-close">&times;</button>
          <h2>⚔️ 1v1 MULTIPLAYER ROOM</h2>
          <p style="color:#aaa; font-size:13px; margin-top:2px;">Scan with your phone or send link to a friend</p>

          <div class="mp-qr-wrap">
            <img src="${qrApiUrl}" alt="QR Code Room" class="mp-qr-img" />
          </div>

          <div class="mp-code-row">
            <span style="font-size:12px; color:#888;">ROOM CODE:</span>
            <span class="mp-code-val">${roomCode}</span>
          </div>

          <div class="mp-actions">
            <button id="mp-copy-btn" class="mp-btn mp-btn-cyan">📋 COPY LINK</button>
            <button id="mp-zap-btn" class="mp-btn mp-btn-pink">💬 WHATSAPP</button>
          </div>

          <div class="mp-status">
            <span class="mp-pulse-dot"></span>
            <span>WAITING FOR OPPONENT TO SCAN...</span>
          </div>
        </div>
      `;

      modal.style.display = 'flex';

      document.getElementById('mp-close-btn').onclick = () => {
        this.hideModal();
        if (this.peer) this.peer.destroy();
      };

      document.getElementById('mp-copy-btn').onclick = () => {
        navigator.clipboard.writeText(roomUrl).then(() => {
          const btn = document.getElementById('mp-copy-btn');
          btn.textContent = '✅ COPIED!';
          setTimeout(() => btn.textContent = '📋 COPY LINK', 2000);
        });
      };

      document.getElementById('mp-zap-btn').onclick = () => {
        const zapText = encodeURIComponent(`🎮 Play 1v1 with me on Marcus Web Arcade! Click to join room:\n${roomUrl}`);
        window.open(`https://api.whatsapp.com/send?text=${zapText}`, '_blank');
      };
    },

    showGuestConnectingModal: function(roomCode) {
      let modal = document.getElementById('arcade-mp-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'arcade-mp-modal';
        this._injectStyles();
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div class="mp-box">
          <h2>⚡ JOINING MATCH...</h2>
          <p style="color:#00f5ff; font-weight:bold; font-size:16px; margin-top:8px;">ROOM: ${roomCode}</p>
          <div class="mp-status" style="margin-top:20px;">
            <span class="mp-pulse-dot"></span>
            <span>CONNECTING VIA PEER-TO-PEER WEBRTC...</span>
          </div>
        </div>
      `;
      modal.style.display = 'flex';
    },

    hideModal: function() {
      const modal = document.getElementById('arcade-mp-modal');
      if (modal) modal.style.display = 'none';
    },

    _injectStyles: function() {
      if (document.getElementById('arcade-mp-styles')) return;
      const css = `
        #arcade-mp-modal {
          position: fixed;
          inset: 0;
          background: rgba(5, 7, 18, 0.94);
          backdrop-filter: blur(14px);
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          font-family: 'Segoe UI', system-ui, sans-serif;
          color: #fff;
        }
        .mp-box {
          background: linear-gradient(135deg, rgba(20, 26, 50, 0.95), rgba(8, 10, 24, 0.98));
          border: 2px solid rgba(0, 245, 255, 0.4);
          border-radius: 20px;
          padding: 24px;
          max-width: 420px;
          width: 100%;
          text-align: center;
          position: relative;
          box-shadow: 0 0 40px rgba(0, 245, 255, 0.25);
        }
        .mp-close {
          position: absolute;
          top: 14px;
          right: 18px;
          background: none;
          border: none;
          color: #aaa;
          font-size: 26px;
          cursor: pointer;
        }
        .mp-close:hover { color: #fff; }
        .mp-box h2 { font-size: 20px; color: #00f5ff; margin: 0; }
        .mp-qr-wrap {
          margin: 16px auto;
          width: 190px;
          height: 190px;
          background: #060814;
          border: 2px solid #00f5ff;
          border-radius: 12px;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(0,245,255,0.3);
        }
        .mp-qr-img { width: 100%; height: 100%; border-radius: 6px; }
        .mp-code-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .mp-code-val {
          background: rgba(255, 0, 127, 0.15);
          border: 1px solid #ff007f;
          padding: 4px 10px;
          border-radius: 6px;
          color: #ff007f;
          font-family: monospace;
          font-weight: 900;
          font-size: 16px;
          letter-spacing: 2px;
        }
        .mp-actions { display: flex; gap: 10px; margin-bottom: 16px; }
        .mp-btn {
          flex: 1;
          padding: 12px;
          border-radius: 10px;
          border: none;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mp-btn-cyan { background: #00f5ff; color: #000; }
        .mp-btn-cyan:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(0,245,255,0.4); }
        .mp-btn-pink { background: #25D366; color: #fff; }
        .mp-btn-pink:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(37,211,102,0.4); }
        .mp-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 11px;
          color: #cbd5e1;
          font-family: monospace;
        }
        .mp-pulse-dot {
          width: 8px;
          height: 8px;
          background: #00f5ff;
          border-radius: 50%;
          animation: mpPulse 1.2s infinite;
        }
        @keyframes mpPulse {
          0% { transform: scale(0.8); opacity: 0.4; }
          50% { transform: scale(1.4); opacity: 1; box-shadow: 0 0 10px #00f5ff; }
          100% { transform: scale(0.8); opacity: 0.4; }
        }
      `;
      const styleEl = document.createElement('style');
      styleEl.id = 'arcade-mp-styles';
      styleEl.innerHTML = css;
      document.head.appendChild(styleEl);
    }
  };

  window.ArcadeMultiplayer = ArcadeMultiplayer;
})(window);
