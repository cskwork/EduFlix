# Cloudflare Tunnel 배포 가이드

## 개요

Cloudflare Tunnel은 Vercel 배포의 백업 옵션으로, 로컬 서버를 안전하게 인터넷에 노출합니다. AI 생성 기능을 포함한 전체 기능을 사용할 수 있습니다.

---

## 배포 정보

- **URL**: https://eduflix.example.com
- **터널 ID**: `<your-tunnel-id>`
- **설정 파일**: `~/.cloudflared/eduflix-config.yml`

---

## 사전 요구 사항

### 1. cloudflared 설치

```bash
# macOS (Homebrew)
brew install cloudflared

# Linux
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/
```

### 2. Cloudflare 인증

```bash
cloudflared tunnel login
```

브라우저에서 Cloudflare 계정에 로그인하고 도메인을 선택합니다.

---

## 터널 설정

### 터널 생성 (최초 1회)

```bash
cloudflared tunnel create eduflix
```

### 설정 파일

`~/.cloudflared/eduflix-config.yml`:

```yaml
tunnel: <your-tunnel-id>
credentials-file: /Users/your-username/.cloudflared/<your-tunnel-id>.json

ingress:
  - hostname: eduflix.example.com
    service: http://localhost:9888
  - service: http_status:404
```

### DNS 라우팅

```bash
cloudflared tunnel route dns eduflix eduflix.example.com
```

---

## 배포 순서

### 1. 프로덕션 빌드

```bash
bun run build
```

### 2. API 서버 시작

```bash
PORT=9888 bun run start &
```

이 서버는 다음을 제공합니다:
- 정적 파일 (dist/)
- API 엔드포인트 (/api/*)

### 3. 터널 시작

```bash
cloudflared tunnel --config ~/.cloudflared/eduflix-config.yml run eduflix &
```

### 한 줄로 실행

```bash
bun run build && PORT=9888 bun run start &
sleep 2 && cloudflared tunnel --config ~/.cloudflared/eduflix-config.yml run eduflix &
```

---

## Vercel vs Cloudflare Tunnel

| 특징 | Vercel | Cloudflare Tunnel |
|------|--------|-------------------|
| 호스팅 | Vercel Edge | 로컬 서버 |
| AI 기능 | 비활성화 (정적 모드) | 활성화 |
| API 서버 | 없음 | 필요 |
| 가용성 | 24/7 | 서버 실행 시만 |
| 비용 | 무료 (한도 내) | 무료 |
| 용도 | 기본 배포 | 개발/데모 |

---

## 시스템 서비스 설정 (선택)

### macOS (launchd)

`~/Library/LaunchAgents/com.eduflix.server.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.eduflix.server</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/bun</string>
    <string>run</string>
    <string>start</string>
  </array>
  <key>WorkingDirectory</key>
  <string>/path/to/EduFlix</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PORT</key>
    <string>9888</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
</dict>
</plist>
```

```bash
launchctl load ~/Library/LaunchAgents/com.eduflix.server.plist
```

### Linux (systemd)

`/etc/systemd/system/eduflix.service`:

```ini
[Unit]
Description=EduFlix Server
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/EduFlix
Environment=PORT=9888
ExecStart=/usr/local/bin/bun run start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable eduflix
sudo systemctl start eduflix
```

---

## 터널 서비스 설정

### cloudflared 시스템 서비스

```bash
sudo cloudflared service install
```

또는 수동으로:

`/etc/systemd/system/cloudflared.service`:

```ini
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=your-username
ExecStart=/usr/local/bin/cloudflared tunnel --config /home/your-username/.cloudflared/eduflix-config.yml run eduflix
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

---

## 문제 해결

### 터널 연결 실패

```bash
# 터널 상태 확인
cloudflared tunnel info eduflix

# 인증 갱신
cloudflared tunnel login
```

### 포트 충돌

```bash
# 9888 포트 사용 중인 프로세스 확인
lsof -i :9888

# 프로세스 종료
kill -9 <PID>
```

### 서버 로그 확인

```bash
# API 서버 로그
journalctl -u eduflix -f

# 터널 로그
journalctl -u cloudflared -f
```

### 연결 테스트

```bash
# 로컬 서버 테스트
curl http://localhost:9888/api/content

# 터널 테스트
curl https://eduflix.example.com/api/content
```

---

## 환경 변수

```bash
# .env
PORT=9888                    # Cloudflare Tunnel용 포트
ANTHROPIC_API_KEY=sk-...     # Claude API 키
GEMINI_API_KEY=...           # Gemini API 키
```

---

## 보안 고려사항

1. **API 키 보호**: `.env` 파일은 절대 git에 커밋하지 않음
2. **접근 제어**: 필요시 Cloudflare Access 설정
3. **HTTPS**: Cloudflare에서 자동 제공

---

## 다음 단계

- [Vercel 배포](./vercel.md)
- [백엔드 아키텍처](../architecture/backend.md)
- [API 엔드포인트](../api/endpoints.md)
