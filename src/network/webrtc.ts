type MessageHandler = (data: string) => void;
type ConnectionStateHandler = (state: 'connecting' | 'connected' | 'disconnected') => void;

export interface GameMessage {
  type: 'move' | 'chat' | 'ping' | 'draw-request' | 'draw-accept' | 'draw-decline' | 'resign';
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
  // 兼容旧版纯move消息
  return { type: 'move', payload: data };
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

  constructor(onMessage: MessageHandler, onStateChange: ConnectionStateHandler) {
    this.onMessage = onMessage;
    this.onStateChange = onStateChange;
  }

  // 创建房间（Host）
  async createOffer(): Promise<string> {
    this.close();
    this.iceCandidates = [];
    this.gatheringComplete = false;
    this.onStateChange('connecting');
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
      if (state === 'failed' || state === 'disconnected') {
        this.onStateChange('disconnected');
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
      await Promise.all((data.candidates || []).map((c: RTCIceCandidateInit) =>
        this.pc!.addIceCandidate(new RTCIceCandidate(c))
      ));
    } catch (e) {
      this.onStateChange('disconnected');
      throw e;
    }
  }

  // 加入房间（Join）
  async join(offerJson: string): Promise<string> {
    this.close();
    this.iceCandidates = [];
    this.gatheringComplete = false;
    this.onStateChange('connecting');
    let data: { sdp: RTCSessionDescriptionInit; candidates?: RTCIceCandidateInit[] };
    try {
      data = JSON.parse(decodeURIComponent(atob(offerJson)));
    } catch (e) {
      this.onStateChange('disconnected');
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

    await this.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

    for (const cand of data.candidates || []) {
      await this.pc.addIceCandidate(new RTCIceCandidate(cand));
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
          if (this.iceCheckInterval) clearInterval(this.iceCheckInterval);
          if (this.iceCheckTimeout) clearTimeout(this.iceCheckTimeout);
          this.iceCheckInterval = null;
          this.iceCheckTimeout = null;
          resolve();
        }
      }, 200);
      this.iceCheckTimeout = setTimeout(() => {
        if (this.iceCheckInterval) clearInterval(this.iceCheckInterval);
        this.iceCheckInterval = null;
        this.iceCheckTimeout = null;
        resolve();
      }, 10000);
    });
  }

  private setupChannel(channel: RTCDataChannel): void {
    channel.onopen = () => {
      this.onStateChange('connected');
      this.drainQueue();
    };

    channel.onclose = () => {
      this.onStateChange('disconnected');
    };

    channel.onerror = (e) => {
      console.error('DataChannel error:', e);
      this.onStateChange('disconnected');
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
    if (this.channel && this.channel.readyState === 'open') {
      this.channel.send(data);
      return true;
    }
    this.pendingQueue.push(data);
    return false;
  }

  isConnected(): boolean {
    return this.channel?.readyState === 'open';
  }

  close(): void {
    if (this.iceCheckInterval) { clearInterval(this.iceCheckInterval); this.iceCheckInterval = null; }
    if (this.iceCheckTimeout) { clearTimeout(this.iceCheckTimeout); this.iceCheckTimeout = null; }
    this.channel?.close();
    this.pc?.close();
    this.channel = null;
    this.pc = null;
    this.iceCandidates = [];
    this.gatheringComplete = false;
    this.pendingQueue = [];
  }
}
