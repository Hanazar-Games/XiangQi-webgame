type MessageHandler = (data: string) => void;
type ConnectionStateHandler = (state: 'connecting' | 'connected' | 'disconnected') => void;

export interface GameMessage {
  type: 'move' | 'chat' | 'ping' | 'draw-request' | 'draw-accept' | 'draw-decline' | 'resign' | 'invalid';
  payload: string;
}

export function wrapMessage(type: GameMessage['type'], payload: string): string {
  return JSON.stringify({ type, payload });
}

const VALID_TYPES = new Set(['move', 'chat', 'ping', 'draw-request', 'draw-accept', 'draw-decline', 'resign']);

export function parseMessage(data: string): GameMessage {
  try {
    const obj = JSON.parse(data);
    if (obj && typeof obj.type === 'string' && VALID_TYPES.has(obj.type) && typeof obj.payload === 'string') {
      return obj as GameMessage;
    }
  } catch {}
  // 兼容旧版纯move消息：仅当payload看起来是JSON对象时才回退
  if (data.trim().startsWith('{')) {
    return { type: 'move', payload: data };
  }
  return { type: 'invalid', payload: data };
}

export class P2PConnection {
  private pc: RTCPeerConnection | null = null;
  private channel: RTCDataChannel | null = null;
  private onMessage: MessageHandler;
  private onStateChange: ConnectionStateHandler;
  private iceCandidates: RTCIceCandidateInit[] = [];
  private gatheringComplete = false;
  private iceCheckInterval: ReturnType<typeof setInterval> | null = null;
  private iceCheckTimeout: ReturnType<typeof setTimeout> | null = null;
  private pendingQueue: string[] = [];
  private maxPendingQueue = 100;
  private closed = false;
  private lastState: 'connecting' | 'connected' | 'disconnected' | null = null;

  constructor(onMessage: MessageHandler, onStateChange: ConnectionStateHandler) {
    this.onMessage = onMessage;
    this.onStateChange = onStateChange;
  }

  private emitState(state: 'connecting' | 'connected' | 'disconnected'): void {
    if (this.lastState === state) return;
    this.lastState = state;
    this.onStateChange(state);
  }

  // 创建房间（Host）
  async createOffer(): Promise<string> {
    this.close();
    this.iceCandidates = [];
    this.gatheringComplete = false;
    this.closed = false;
    this.lastState = null;
    this.emitState('connecting');
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    this.channel = this.pc.createDataChannel('xiangqi', {
      ordered: true,
    });
    this.setupChannel(this.channel);

    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.iceCandidates.push(e.candidate.toJSON());
      }
    };

    this.pc.onicegatheringstatechange = () => {
      if (this.pc?.iceGatheringState === 'complete') {
        this.gatheringComplete = true;
      }
    };

    this.pc.onconnectionstatechange = () => {
      const state = this.pc?.connectionState;
      if (state === 'failed' || state === 'disconnected' || state === 'closed') {
        this.emitState('disconnected');
        this.close();
      }
    };

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    // 等待ICE收集完成
    await this.waitForIceComplete();

    const payload = JSON.stringify({
      sdp: this.pc.localDescription,
      candidates: this.iceCandidates,
    });
    return btoa(encodeURIComponent(payload));
  }

  // Host接收Answer
  async acceptAnswer(answerJson: string): Promise<void> {
    if (!this.pc) throw new Error('No peer connection');
    try {
      const data = JSON.parse(decodeURIComponent(atob(answerJson)));
      await this.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const candidates = (data.candidates || []) as RTCIceCandidateInit[];
      for (const c of candidates) {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(c));
        } catch (e) {
          // 忽略无效的ICE候选
          console.warn('Invalid ICE candidate ignored:', e);
        }
      }
    } catch (e) {
      this.emitState('disconnected');
      throw e;
    }
  }

  // 加入房间（Join）
  async join(offerJson: string): Promise<string> {
    this.close();
    this.iceCandidates = [];
    this.gatheringComplete = false;
    this.closed = false;
    this.lastState = null;
    this.emitState('connecting');
    let data: { sdp: RTCSessionDescriptionInit; candidates?: RTCIceCandidateInit[] };
    try {
      data = JSON.parse(decodeURIComponent(atob(offerJson)));
    } catch (e) {
      this.emitState('disconnected');
      throw e;
    }

    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    this.pc.ondatachannel = (e) => {
      this.channel = e.channel;
      this.setupChannel(this.channel);
    };

    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.iceCandidates.push(e.candidate.toJSON());
      }
    };

    this.pc.onicegatheringstatechange = () => {
      if (this.pc?.iceGatheringState === 'complete') {
        this.gatheringComplete = true;
      }
    };

    this.pc.onconnectionstatechange = () => {
      const state = this.pc?.connectionState;
      if (state === 'failed' || state === 'disconnected' || state === 'closed') {
        this.emitState('disconnected');
        this.close();
      }
    };

    await this.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

    for (const cand of data.candidates || []) {
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(cand));
      } catch (e) {
        console.warn('Invalid ICE candidate ignored:', e);
      }
    }

    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);

    await this.waitForIceComplete();

    const payload = JSON.stringify({
      sdp: this.pc.localDescription,
      candidates: this.iceCandidates,
    });
    return btoa(encodeURIComponent(payload));
  }

  private async waitForIceComplete(): Promise<void> {
    if (this.gatheringComplete) return;

    // 如果已经在complete状态
    if (this.pc?.iceGatheringState === 'complete') {
      this.gatheringComplete = true;
      return;
    }

    // 等待最多10秒
    return new Promise((resolve) => {
      this.iceCheckInterval = setInterval(() => {
        if (this.gatheringComplete || this.pc?.iceGatheringState === 'complete') {
          this.clearIceTimers();
          resolve();
        }
      }, 200);
      this.iceCheckTimeout = setTimeout(() => {
        this.clearIceTimers();
        resolve();
      }, 10000);
    });
  }

  private clearIceTimers(): void {
    if (this.iceCheckInterval) { clearInterval(this.iceCheckInterval); this.iceCheckInterval = null; }
    if (this.iceCheckTimeout) { clearTimeout(this.iceCheckTimeout); this.iceCheckTimeout = null; }
  }

  private setupChannel(channel: RTCDataChannel): void {
    channel.onopen = () => {
      this.emitState('connected');
      this.drainQueue();
    };

    channel.onclose = () => {
      this.emitState('disconnected');
    };

    channel.onerror = (e) => {
      console.error('DataChannel error:', e);
      this.emitState('disconnected');
    };

    channel.onmessage = (e) => {
      this.onMessage(e.data);
    };
  }

  private drainQueue(): void {
    while (this.pendingQueue.length > 0 && this.channel?.readyState === 'open') {
      this.channel.send(this.pendingQueue.shift()!);
    }
  }

  send(data: string): boolean {
    if (this.closed) return false;
    if (this.channel && this.channel.readyState === 'open') {
      this.channel.send(data);
      return true;
    }
    if (this.pendingQueue.length >= this.maxPendingQueue) {
      this.pendingQueue.shift(); // 丢弃最旧的消息
      console.warn('Pending queue full, dropped oldest message');
    }
    this.pendingQueue.push(data);
    return false;
  }

  isConnected(): boolean {
    return !this.closed && this.channel?.readyState === 'open' && this.pc?.connectionState !== 'failed' && this.pc?.connectionState !== 'closed';
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.clearIceTimers();

    // 先移除事件监听器，防止重复触发
    if (this.channel) {
      this.channel.onopen = null;
      this.channel.onclose = null;
      this.channel.onerror = null;
      this.channel.onmessage = null;
      try { this.channel.close(); } catch {}
      this.channel = null;
    }

    if (this.pc) {
      this.pc.onicecandidate = null;
      this.pc.onicegatheringstatechange = null;
      this.pc.onconnectionstatechange = null;
      this.pc.ondatachannel = null;
      try { this.pc.close(); } catch {}
      this.pc = null;
    }

    this.iceCandidates = [];
    this.gatheringComplete = false;
    this.pendingQueue = [];
    this.lastState = null;
  }
}
