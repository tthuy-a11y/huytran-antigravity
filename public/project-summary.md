# 🌌 TÀI LIỆU TOÀN DIỆN: DỰ ÁN ANTIGRAVITY PORTFOLIO (HUY.DEV)

> **Phạm vi:** Tài liệu này bao gồm **TẤT CẢ** nội dung liên quan đến dự án — cả phần đã có trong mã nguồn (codebase) lẫn phần đã được thiết kế/phát triển trong các file MD rải rác trên máy tính nhưng chưa tích hợp vào codebase hiện tại.

---

## MỤC LỤC
1. [Thông tin chung & Triết lý thiết kế](#1-thông-tin-chung--triết-lý-thiết-kế)
2. [Tech Stack](#2-tech-stack)
3. [Cấu trúc thư mục & Routing](#3-cấu-trúc-thư-mục--routing)
4. [PHẦN A — MÃ NGUỒN HIỆN TẠI TRONG CODEBASE](#phần-a--mã-nguồn-hiện-tại-trong-codebase)
   - [Trang chủ (Root)](#41-trang-chủ-root---srcapppagetsxhttpfilecsrcapppagetsxpagetsxhttpfilecsrcapppagetsxpagetsxl1-l73)
   - [Cosmic Odyssey (Creative)](#42-cosmic-odyssey-creative---srcappcreativepagetsxhttpfilecsrcappcreativepagetsxpagetsxhttpfilecsrcappcreativepagetsxpagetsxl1-l580)
   - [Exodus Engine (System)](#43-exodus-engine-v6-system---srcappsystempagetsxhttpfilecsrcappsystempagetsxpagetsxhttpfilecsrcappsystempagetsxpagetsxl1-l661)
   - [Sections (Hero, About, Skills, Projects, Contact)](#44-section-components-srccomponentssections)
5. [PHẦN B — TÍNH NĂNG COMMANDER (CHƯA TÍCH HỢP)](#phần-b--tính-năng-commander-chưa-tích-hợp-vào-codebase)
   - [CommanderTransmission Component](#51-commandertransmission-component)
   - [TransmissionAudio Engine](#52-transmissionaudio-engine)
   - [HolographicAvatar](#53-holographicavatar-component)
   - [Web Speech API & Phonetic](#54-web-speech-api--phonetic-hacks)
   - [Dossier / CV Panel](#55-dossier--cv-panel)
   - [Lịch sử phát triển Commander qua các phiên bản](#56-lịch-sử-phát-triển-commander-qua-các-phiên-bản)
6. [PHẦN C — TÍNH NĂNG 3D NÂNG CAO (CHƯA TÍCH HỢP)](#phần-c--tính-năng-3d-nâng-cao-chưa-tích-hợp)
   - [Cinematic Intro (R3F)](#61-cinematic-intro-30-giây-react-three-fiber)
   - [3D Procedural Ship System](#62-3d-procedural-ship-system)
   - [Hans Zimmer-style Ambient Audio](#63-hans-zimmer-style-ambient-audio)
   - [Creative Page Fixes](#64-creative-page-fixes-đã-thiết-kế)
7. [PHẦN D — CÁC FILE NGUỒN & VỊ TRÍ](#phần-d--bản-đồ-file-nguồn--vị-trí-trên-máy)
8. [PHẦN E — THÔNG TIN CÁ NHÂN TRONG DỰ ÁN](#phần-e--thông-tin-cá-nhân-được-nhúng-trong-dự-án)

---

## 1. THÔNG TIN CHUNG & TRIẾT LÝ THIẾT KẾ
- **Tên dự án:** Thanh Huy 2003 — Antigravity Portfolio
- **Định vị:** Không phải trang web tĩnh truyền thống, mà là **"không gian số có trọng lực riêng"**. Kết hợp phong cách khoa học viễn tưởng (Cypherpunk / Sci-fi), hệ mặt trời (Cosmic Odyssey), bảng điều khiển tàu vũ trụ (Command HUD), và hiệu ứng hologram.
- **Ngôn ngữ thiết kế:** Antigravity (Không trọng lực), Neon Physics, 3D DOM, UI/UX thao túng tâm lý.
- **Thông điệp cốt lõi:** *"Tôi không build website. Tôi kiến tạo không gian số có trọng lực riêng."*

---

## 2. TECH STACK

| Hạng mục | Công nghệ | Phiên bản |
|---|---|---|
| **Framework** | Next.js (App Router) | 16.2.6 |
| **UI Library** | React | 19.2.4 |
| **Ngôn ngữ** | TypeScript | ^5 |
| **Styling** | Tailwind CSS | ^4 |
| **Tiện ích CSS** | tailwind-merge, clsx, tw-animate-css | mới nhất |
| **UI Components** | Shadcn UI (Radix-based) | ^4.7.0 |
| **Iconography** | lucide-react | ^1.16.0 |
| **Animation** | Framer Motion | ^12.38.0 |
| **Vật lý 2D** | Matter.js | ^0.20.0 |
| **Âm thanh** | Web Audio API (tự viết, 0KB tải) | Built-in |
| **Giọng nói** | Web Speech API (vi-VN) | Built-in |
| **Canvas** | HTML5 Canvas API | Built-in |
| **3D (kế hoạch)** | React Three Fiber, drei, postprocessing | Chưa cài |

---

## 3. CẤU TRÚC THƯ MỤC & ROUTING

```
src/
├── app/
│   ├── page.tsx              ← Cổng không gian (Root, ngã rẽ 2 lựa chọn)
│   ├── layout.tsx            ← Root Layout
│   ├── globals.css           ← CSS toàn cục (4.4KB)
│   ├── favicon.ico
│   ├── creative/
│   │   └── page.tsx          ← Cosmic Odyssey (Hệ mặt trời 3D, 580 dòng, 40KB)
│   └── system/
│       └── page.tsx          ← Exodus Engine V6 (Hạm đội tàu, 661 dòng, 45KB)
├── components/
│   ├── providers.tsx         ← Theme provider (next-themes)
│   ├── sections/
│   │   ├── Hero.tsx          ← Physics Canvas (Matter.js, kéo thả chữ nổi)
│   │   ├── About.tsx         ← Giới thiệu bản thân
│   │   ├── Skills.tsx        ← Cây kỹ năng (IntersectionObserver)
│   │   ├── Projects.tsx      ← Danh sách dự án
│   │   └── Contact.tsx       ← Form liên hệ
│   └── ui/
│       ├── Navbar.tsx
│       └── button.tsx        ← Shadcn button
└── lib/                      ← Utilities
```

---

# PHẦN A — MÃ NGUỒN HIỆN TẠI TRONG CODEBASE

## 4.1. Trang Chủ (Root) — [page.tsx](file:///C:/Users/Dell%2014%20Pro%20PA14250/.gemini/antigravity/worktrees/huytran-antigravity/refactor-3d-project-view/src/app/page.tsx)
- **Chức năng:** Điểm chạm đầu tiên. 2 thẻ lớn cho người dùng chọn:
  - Card 1: **"Sáng tạo đột phá"** → `/creative` (Hệ mặt trời 3D)
  - Card 2: **"Logic & Tốc độ"** → `/system` (Hạm đội phi thuyền)
- **UI:** Nền lưới gradient nhạt, Card kính mờ (`backdrop-blur-3xl`), hover nghiêng icon (`rotate-12` → `0`)
- **Copy:** "Chọn một con đường • Sau 30 giây sẽ gợi ý con đường còn lại"

---

## 4.2. Cosmic Odyssey (Creative) — [page.tsx](file:///C:/Users/Dell%2014%20Pro%20PA14250/.gemini/antigravity/worktrees/huytran-antigravity/refactor-3d-project-view/src/app/creative/page.tsx)

### Cấu trúc dữ liệu — 7 Hành Tinh Kỹ Năng

| ID | Tên | Mã | Loại | Tốc độ | Quỹ đạo | Kích thước | Power/Sync/Stability |
|---|---|---|---|---|---|---|---|
| `ai` | Trí Tuệ Nhân Tạo | NEXUS-01 | Mạng Nơ-ron | 10s | 240px | 40px | 98/95/88 |
| `web` | Sáng Tạo Giao Diện | UIX-99 | Giao Diện DOM | 15s | 380px | 55px | 92/85/95 |
| `prompt` | Kỹ Sư Ngôn Ngữ | PRMPT-X | Ngôn Ngữ Học | 20s | 520px | 70px | 85/99/92 |
| `creative` | Hiệu Ứng Vật Lý | PHYS-42 | Động Lực Học | 25s | 660px | 85px | 90/88/85 |
| `uiux` | Trải Nghiệm Người Dùng | BEHAV-7 | Tâm Lý Hành Vi | 30s | 800px | 100px | 82/94/96 |
| `food` | Hệ Sinh Thái Tổng Thể | CORE-S | Hệ Thống Lõi | 35s | 960px | 120px | 100/90/98 |
| `backend` | Máy Chủ Dữ Liệu | REACT-B | Lõi Dữ Liệu | 40s | 1120px | 140px | 95/80/100 |

### Micro-Components

1. **`DecryptText`** — Hiệu ứng giải mã văn bản dùng `requestAnimationFrame`. Thay thế chuỗi bằng ký tự ngẫu nhiên (`A-Z0-9!@#$%^&*`) rồi dần khóa đúng từ trái sang phải.

2. **`CanvasStarfield`** — Canvas vẽ 1200 ngôi sao (400 trên mobile) di chuyển theo chiều sâu Z. Khi `isWarping = true`, tốc độ tăng từ 0.5 lên 30, tạo hiệu ứng Warp Speed. Sử dụng `strokeStyle = rgba(0, 242, 254, ...)` (cyan).

3. **`PlanetParticleBurst`** — Canvas vẽ 50 hạt nổ tung khi hover hành tinh. Mỗi hạt có vận tốc ngẫu nhiên, giảm dần theo hệ số ma sát 0.95.

4. **`PlanetNode`** — Node hành tinh 3D lồng nhau cực sâu:
   - Layer 1: Vòng quỹ đạo (orbit ring) sáng lên khi hover
   - Layer 2: Vệt sao chổi (comet trail) xoay theo `orbit-spin`
   - Layer 3: Khối cầu 3D tự xoay (`orbit-anti-spin` tốc độ 0.55x)
   - Layer 4: Icon + Label Billboard giữ vuông góc với camera (`orbit-anti-spin` tốc độ 1.0x)
   - Tất cả các layer đều counter-rotate theo `--mouse-x` và `--mouse-y` CSS variables

5. **`CentralHUD`** — Modal trung tâm hiển thị chi tiết hành tinh khi click. Gồm: Sphere preview, tên giải mã, mô tả, 3 thanh stats (Sức Mạnh/Đồng Bộ/Ổn Định), nút quay lại.

### Engine Vật Lý

- **Camera Rig:** `useMotionValue` + `useSpring` (stiffness: 120, damping: 30, mass: 0.8) ánh xạ tọa độ chuột thành góc nghiêng XY.
- **Pause Logic:** Khi click hành tinh hoặc hover, tất cả `animation-play-state` chuyển thành `paused` qua class `.system-paused`.
- **Sound Engine:** `playSound('hover')` = Sine wave 400→800Hz trong 0.1s. `playSound('click')` = Square wave 150→40Hz trong 0.3s.
- **Warp Intro:** 2.6 giây boot sequence ("INITIATING QUANTUM CORE V4..."), sau đó hệ mặt trời zoom từ scale 6 về 0.6.

---

## 4.3. Exodus Engine V6 (System) — [page.tsx](file:///C:/Users/Dell%2014%20Pro%20PA14250/.gemini/antigravity/worktrees/huytran-antigravity/refactor-3d-project-view/src/app/system/page.tsx)

### Cấu trúc dữ liệu — 6 Phi Thuyền

| ID | Mã | Tên | Phi thuyền | Màu | Hình dạng | Stats (4 chỉ số) |
|---|---|---|---|---|---|---|
| 0 | NEXUS-01 | Trí Tuệ Nhân Tạo | PHI THUYỀN AI | #00f2fe | sleek | 98/95/92/88 |
| 1 | UIX-99 | Thiết Kế Web 3D | PHI THUYỀN WEB | #b026ff | agile | 90/88/96/85 |
| 2 | PRMPT-X | Kỹ Thuật Prompt | PHI THUYỀN PROMPT | #ff0844 | command | 95/92/88/90 |
| 3 | PHYS-42 | Lập Trình Vật Lý | PHI THUYỀN VẬT LÝ | #00ff87 | heavy | 92/90/99/95 |
| 4 | CLOUD-7 | Dữ Liệu & Đám Mây | PHI THUYỀN DỮ LIỆU | #f5a623 | heavy | 85/99/90/80 |
| 5 | SHIELD-X | An Ninh Mạng | PHI THUYỀN BẢO MẬT | #ff007f | command | 88/92/85/98 |

### Sub-Components

1. **`BootTerminal`** — Màn hình DOS gõ từng dòng (EXODUS KERNEL v9.0.4, 7 dòng text). Typewriter speed: random 10-30ms/ký tự. Âm thanh `boot` (Sawtooth 50→150Hz, 3s).

2. **`FPSMonitor`** — Hiển thị FPS thời gian thực (góc trên phải).

3. **`InteractiveHologram`** — Icon 3D theo dõi chuột (±20° tilt). 3 layer: Red split (blur 3px, offset -5px), Cyan split (blur 3px, offset +5px), White core (drop-shadow 30px, pulse animation).

4. **`MatrixRain`** — Canvas vẽ chữ rơi kiểu Matrix (`01ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&*<>[]{}` ) với opacity 0.2, mask gradient dọc.

5. **`ScrambleText`** — Văn bản mã hóa/giải mã dần, tốc độ 30ms/interval, 1/3 ký tự/frame.

### AudioSystem Class (8 loại âm thanh)

| Loại | Sóng | Tần số | Thời lượng | Mô tả |
|---|---|---|---|---|
| `type` | Square | 800-1000Hz | 50ms | Tiếng gõ phím |
| `boot` | Sawtooth | 50→150Hz | 3s | Tiếng khởi động hệ thống |
| `hover` | Sine | 400→800Hz | 100ms | Hiệu ứng rê chuột |
| `click` | *(không định nghĩa riêng)* | — | — | — |
| `warp` | Sawtooth | 40→800Hz | 1.2s | Tiếng tăng tốc Warp |
| `abort` | Square | 300→40Hz | 400ms | Tiếng hủy bỏ nhiệm vụ |
| `deploy` | Square | 400→800→400→1200Hz | 1.2s | Tiếng triển khai |
| `impact` | Sawtooth | 200→30Hz | 300ms | Tiếng va chạm tiểu hành tinh |
| `beep` | Sine | 1500Hz | 100ms | Tiếng xác nhận |

### God-Tier Canvas Engine

- **Idle State — Hố Đen (Blackhole):**
  - Accretion Disk: Gradient xoay (cyan → purple), 150 hạt bị hút vào Event Horizon (r = 60px).
  - Gravitational Lensing: Nếu ngôi sao gần Hố đen (`distSq < 500000`), tọa độ bị bẻ cong theo `force = 40000 / distSq`.
  - Event Horizon: Hình tròn đen tuyệt đối, viền phát sáng cyan.

- **Warp State — Hố Giun (Wormhole):**
  - 15 vòng tròn lồng nhau, bán kính thay đổi theo Z-depth (`r = 3000*300/z`), tạo hiệu ứng đường hầm.
  - RGB split trên ngôi sao: Red offset (-2px), Cyan offset (+2px), White center.

- **Shockwaves:** Vòng sóng xung kích mở rộng 30px/frame, alpha giảm 0.02/frame.

### Cinematic Ship Sequence (1.8 giây)

```
0%    → Tàu đứng yên (scale 1)
8%    → Tàu ngồi xổm (scale 0.9, nghiêng -3°)
18%   → Tàu lao lên (scale 1.15, nghiêng 12°)
25%   → Né trái (translateX -30px, nghiêng -25°)
32%   → Né phải (translateX +35px, nghiêng 18°)
42%   → Barrel roll 1 (rotate 360°)
55%   → Barrel roll 2 (rotate 720°)
68%   → Barrel roll 3 (rotate 1080°, opacity 0.8)
80%   → Bay xa (scale 0.5, opacity 0.4)
100%  → Biến mất (scale 0.1, opacity 0)
```

Kèm theo: 6 tiểu hành tinh bay ngang + 40 mảnh vỡ nổ tung + Flash trắng toàn màn hình.

---

## 4.4. Section Components (`src/components/sections/`)

### [Hero.tsx](file:///C:/Users/Dell%2014%20Pro%20PA14250/.gemini/antigravity/worktrees/huytran-antigravity/refactor-3d-project-view/src/components/sections/Hero.tsx) — Matter.js Physics Canvas
- Engine: `gravity: { x: 0, y: 0 }` (Zero-G)
- 4 bức tường vô hình
- 8 từ khóa nổi: Next.js (#00D9FF), AI (#FF00E5), Physics (#00FF9D), Backend (#FFD600), Creative (#FF6B00), RESTful (#9D4EDD), Antigravity (#00D9FF), 10x (#FF00E5)
- `MouseConstraint` cho phép kéo thả
- Custom Canvas render: Text neon + `shadowBlur: 20`

### [About.tsx](file:///C:/Users/Dell%2014%20Pro%20PA14250/.gemini/antigravity/worktrees/huytran-antigravity/refactor-3d-project-view/src/components/sections/About.tsx) — Giới thiệu
- Grid 12 cột (7+5), gradient text
- 3 năng lực cốt lõi: Antigravity 🪐, AI × 10x ⚡, Neon Physics 🌌
- CTA: "Bắt đầu một dự án" + Badge "AVAILABLE FOR PROJECTS"

### [Skills.tsx](file:///C:/Users/Dell%2014%20Pro%20PA14250/.gemini/antigravity/worktrees/huytran-antigravity/refactor-3d-project-view/src/components/sections/Skills.tsx) — Cây Kỹ Năng
- `IntersectionObserver` (threshold 30%)
- 3 nhóm: Frontend (Next.js 95%, React/TS 92%, Tailwind 98%, Shadcn 90%), Backend & AI (RESTful 90%, Node 85%, AI 88%, Prompt 85%), Creative & Physics (Canvas 85%, Neon Motion 95%, Physics 80%, 3D 75%)
- Tags nổi: Antigravity, Creative Coding, Neon Glow, Physics Canvas, RESTful, AI 10x, UI/UX Magic

### [Projects.tsx](file:///C:/Users/Dell%2014%20Pro%20PA14250/.gemini/antigravity/worktrees/huytran-antigravity/refactor-3d-project-view/src/components/sections/Projects.tsx) — 3 Dự Án
1. **Antigravity Portfolio** — Next.js 15, TypeScript, Tailwind, Physics Canvas
2. **RESTful AI Dashboard** — Next.js, Node.js, RESTful API, AI
3. **Neon Physics Playground** — React, Canvas, Physics, Framer Motion

### [Contact.tsx](file:///C:/Users/Dell%2014%20Pro%20PA14250/.gemini/antigravity/worktrees/huytran-antigravity/refactor-3d-project-view/src/components/sections/Contact.tsx) — Liên Hệ
- Email: huytran.work.02@gmail.com
- GitHub: github.com/BLGCK44
- LinkedIn: linkedin.com/in/huytran4
- Form: Name + Email + Message, nút gradient cyan→purple

---

# PHẦN B — TÍNH NĂNG COMMANDER (CHƯA TÍCH HỢP VÀO CODEBASE)

> [!IMPORTANT]
> Các tính năng dưới đây đã được thiết kế chi tiết và viết code đầy đủ trong các file `.MD` trên Desktop/Downloads, nhưng **CHƯA** tồn tại trong thư mục mã nguồn hiện tại (`refactor-3d-project-view`).

## 5.1. CommanderTransmission Component

### Mô tả
Một **cutscene holographic tự động xuất hiện** sau một khoảng thời gian nhất định, giới thiệu bản thân chủ nhân website dưới dạng một "Commander" đang truyền tín hiệu qua không gian. Đây là tính năng "WOW factor" chính — tạo cảm giác như đang nhận được một cuộc gọi video hologram từ vũ trụ.

### State Machine (Máy trạng thái)

```
idle → alert → dialogue → dossier → collapsing → collapsed → dossier-reopen
```

| Trạng thái | Mô tả |
|---|---|
| `idle` | Chờ đợi trigger (4 phút hoặc đã vào creative+system+1 phút) |
| `alert` | Panel "INCOMING TRANSMISSION" xuất hiện ở góc dưới phải |
| `dialogue` | Hologram Commander xuất hiện full-screen, nói 8 câu thoại |
| `dossier` | Bảng CV/Hồ sơ cá nhân 3 cột hiện ra |
| `collapsing` | Thu nhỏ panel (flash trắng) |
| `collapsed` | Icon SignalHigh nhỏ ở góc dưới phải, click để mở lại |
| `dossier-reopen` | Mở lại bảng CV từ trạng thái collapsed |

### Trigger Logic (Kích hoạt thông minh)
- **Trigger 1:** Timer toàn cục 4 phút (240 giây)
- **Trigger 2:** Người dùng đã ghé thăm cả `/creative` LẪN `/system` + chờ thêm 1 phút
- Dùng `usePathname()` để theo dõi lịch sử truy cập

### 8 Câu Thoại Dialogue
```
1. "Uplink secure. Đây là CMDR Thanh Huy, 2003."
2. "Bạn vừa bước vào không gian số có trọng lực riêng của tôi."
3. "Tôi là một Fresher IT — nhưng tốc độ của tôi không Fresher chút nào."
4. "AI là động cơ Warp Drive. Tôi dùng nó để bứt tốc 10x."
5. "Frontend là vũ trụ. Backend là lực hấp dẫn giữ mọi thứ lại."
6. "Mỗi pixel tôi đặt xuống đều mang một lực hút riêng."
7. "Bạn đã sẵn sàng khám phá hồ sơ của tôi chưa?"
8. "Truyền dữ liệu Dossier... Mở khóa ngay."
```

---

## 5.2. TransmissionAudio Engine

### Phiên bản cơ bản (trong `claude_code.MD`)
- BGM: 2 oscillator lồng nhau (45Hz + 60Hz) với gain cực nhỏ (0.015)
- Alert: Sine wave 800→1200Hz, lặp 3 lần
- Type: Square wave random 800-1000Hz, 50ms
- Click: Sine 600→1000Hz, 150ms

### Phiên bản nâng cao (trong `chuyển động và âm thanh.MD`)
- `loadVoices()`: Tìm giọng vi-VN trong `speechSynthesis.getVoices()`
- `speakLine(text, onEndCallback)`: Phát giọng nói với callback khi kết thúc
- `playWarp()`: Noise buffer (white noise) fade-in/fade-out 2 giây
- `playDownloadSuccess()`: 3 nốt nhạc (523Hz → 659Hz → 784Hz) tạo âm thanh chiến thắng
- `startVoiceEffects()` / `stopVoiceEffects()`: BGM thay đổi khi Commander đang nói

---

## 5.3. HolographicAvatar Component

### Phiên bản 1 (trong `claude_code.MD`)
- Ảnh `/commander-transparent.png` với CSS filter: `sepia(1) hue-rotate(120deg) saturate(5) brightness(1.3)`
- `mix-blend-mode: screen` (chỉ giữ phần sáng)
- 2 lớp RGB split clone (red + cyan, offset ±3px)
- Animation: `holo-float` (lên xuống 10px, 3s)
- Khi đang nói: `talking-glitch` animation (clip-path ngẫu nhiên, 200ms)
- Scan beam: Thanh sáng quét từ trên xuống (3s)
- CRT scanlines overlay

### Phiên bản 2 — Nâng cao (trong `chuyển động và âm thanh.MD`)
- Ảnh `/commander-portrait.png` (ảnh trắng sạch, rõ mặt thực)
- **Mắt giả 3D:** 2 hình elip xanh lá nhấp nháy bằng `clip-path` animation (nhắm 100ms, mở 3-5s ngẫu nhiên)
- **Miệng giả 3D:** Hình elip đỏ nhạt, lip-sync khi `isTalking` = true (mở/đóng 150ms)
- **18 hạt nổi:** Hình tròn nhỏ bay lên từ đáy, kích thước 2-5px, opacity 0.3-0.8
- **7 thanh Audio Visualizer:** Chiều cao thay đổi ngẫu nhiên khi đang nói
- **HUD elements:** Khung góc target (4 góc), text "UPLINK: SECURE", "SYNC: 99.9%"

---

## 5.4. Web Speech API & Phonetic Hacks

### Bảng chuyển đổi phiên âm
| Từ gốc | Phiên âm (vi-VN) | Lý do |
|---|---|---|
| Fresher IT | "Ai Ti" (rút gọn) hoặc "phờ rét dơ ai ti" (đầy đủ) | Đọc tự nhiên hơn bằng tiếng Việt |
| UPLINK SECURE | "ắp linh si kiêu" | Giọng Việt đọc từ tiếng Anh |
| CMDR | "cơm man đờ" | Viết tắt Commander |
| UI/UX | "diu ai diu ích" | Viết tắt kỹ thuật |
| Frontend | "phờ rôn en" | Thuật ngữ lập trình |
| Backend | "bách en" | Thuật ngữ lập trình |

### Cấu hình giọng nói
- `utterance.lang = 'vi-VN'`
- `utterance.rate = 1.05` (hơi nhanh hơn bình thường)
- `utterance.pitch = 1.02` (giọng nam tự nhiên)
- `utterance.onend` callback đảm bảo giọng nói hết câu mới chuyển tiếp

---

## 5.5. Dossier / CV Panel

### Layout: Grid 3 cột

| Cột 1 — IDENTITY | Cột 2 — BIO | Cột 3 — SKILLS |
|---|---|---|
| Ảnh chân dung | Tên: TRẦN THANH HUY | Frontend: Next.js, React, Tailwind |
| Mã: CMDR-2003 | Vai trò: Frontend Developer (Fresher) | Backend: RESTful APIs, Node.js |
| Trạng thái: ACTIVE | Học vấn: ĐH Tây Đô, CNTT 2021-2025 | AI: Prompt Engineering, 10x |
| | Địa chỉ: Ninh Kiều, Cần Thơ | Creative: Physics Canvas, 3D |

### Nút hành động
- **"TẢI DOSSIER (CV)"** — Tải file CV PDF kèm hiệu ứng particle burst confetti (35 hạt bay ra)
- **"KHÁM PHÁ KHÔNG GIAN"** — Điều hướng đến `/creative`
- **Keyboard support:** Enter/Space để accept, Escape để đóng

---

## 5.6. Lịch Sử Phát Triển Commander Qua Các Phiên Bản

| File nguồn | Kích thước | Nội dung chính | Tiến hóa |
|---|---|---|---|
| `PROMPT_COMMANDER_V6_FINAL.md` | 6KB | Spec/Prompt gốc đầu tiên | Đặc tả yêu cầu ban đầu |
| `PROMPT_COMMANDER_V7_FINAL.md` | 6.5KB | Spec cập nhật: ảnh nền trắng | Thay đổi ảnh portrait |
| `claude_code.MD` | 35KB | Code đầy đủ phiên bản 1 (hologram filter) | Triển khai code hoàn chỉnh |
| `COMMAnder chỉnh sửa.MD` | 27KB | Code phiên bản 2 (refined, sạch hơn) | Chỉnh UI panel, thêm phonetic |
| `chuyển động và âm thanh.MD` | 53KB | Code phiên bản 3 (cao cấp nhất) | Thêm mắt/miệng 3D, voice sync, confetti |
| `những vấn đề bạn nêu.MD` | 6KB | Bug fixes: ảnh, voice, text hiển thị | Sửa lỗi cụ thể |

---

# PHẦN C — TÍNH NĂNG 3D NÂNG CAO (CHƯA TÍCH HỢP)

## 6.1. Cinematic Intro 30 Giây (React Three Fiber)

> Được đặc tả trong `PROMPT_GUI_CLAUDE.md` / `cinematic_3d_upgrade_script.md`

### 4 Cảnh (Scenes)

| Cảnh | Thời gian | Nội dung | Kỹ thuật |
|---|---|---|---|
| 1. Creation | 0-8s | Mặt trời plasma + tinh vân | Custom GLSL shader, Bloom |
| 2. Technology | 8-16s | Mạng lưới code + data stream | Particle system, instancing |
| 3. Big Bang | 16-22s | Vụ nổ hội tụ | Shockwave, ChromaticAberration |
| 4. Awakening | 22-30s | Logo HUY.DEV xuất hiện | Camera dolly, fade |

### 10 Câu Thoại Tiếng Việt (có timing)
```
2.0s  → "Từ hư vô... ánh sáng đầu tiên bùng cháy."
5.0s  → "Một vũ trụ số bắt đầu hình thành."
8.5s  → "Code là ngôn ngữ. Logic là trọng lực."
11.0s → "Mỗi thuật toán... là một ngôi sao mới."
14.0s → "Từ Backend đến Frontend..."
16.5s → "...hai thế giới hội tụ."
19.0s → "Và trong khoảnh khắc hội tụ đó..."
22.0s → "...một hệ sinh thái hoàn chỉnh ra đời."
25.0s → "Chào mừng đến với không gian của tôi."
28.0s → "TRẦN THANH HUY — Developer."
```

---

## 6.2. 3D Procedural Ship System

> Được đặc tả trong `phi thuyền.MD`

### `Ship3D.tsx` — 6 hình dạng tàu thủ tục
- Mỗi hình dạng (sleek/agile/heavy/command/carrier/stealth) được tạo bằng `BufferGeometry` thuần
- Engine glow trails: Particle emitter phía sau tàu
- Floating labels: Text3D với `<Billboard>` component từ drei

### `FleetSystem3D.tsx` — Scene 3D đầy đủ
- `<Canvas>` React Three Fiber
- `CameraRig`: Theo dõi chuột với lerp
- `WarpTunnel`: Hiệu ứng đường hầm Warp 3D thực sự (thay cho Canvas 2D)
- V-formation: 6 tàu xếp hình chữ V
- Post-processing: `Bloom` + `ChromaticAberration` + `Noise`

---

## 6.3. Hans Zimmer-style Ambient Audio

> Được đặc tả trong `Bản này giải quyết triệt để 5 vấn đề.MD`

- **Chord drone:** 2-3 oscillator tạo hợp âm trầm liên tục (A2 + E3 + A3)
- **Spatial beeps:** Sine wave ngẫu nhiên (800-2000Hz) với panning trái/phải, phát mỗi 3-7 giây
- Tạo cảm giác đang ở trong trạm không gian

---

## 6.4. Creative Page Fixes (Đã Thiết Kế)

> Từ `✅ PH.MD` và `Bản này giải quyết triệt để 5 vấn đề.MD`

1. **Zoom (Mouse Wheel):** Luôn hoạt động kể cả khi modal mở
2. **Camera không bị khóa cứng:** Dampen 0.25 + auto-shift trái
3. **Sidebar Glassmorphism Modal:** Không che khuất hành tinh (thay vì modal giữa màn hình)
4. **Comet-trail orbit:** Vệt đuôi sao chổi cho quỹ đạo + 3D planet core rendering
5. **FPS Optimization:** Giảm interval cinematic xuống 160ms
6. **Planet text glassmorphism box:** Backdrop-blur cho tên hành tinh + animation `planetTextPop`

---

# PHẦN D — BẢN ĐỒ FILE NGUỒN & VỊ TRÍ TRÊN MÁY

## Codebase hiện tại
```
C:\Users\Dell 14 Pro PA14250\.gemini\antigravity\worktrees\huytran-antigravity\refactor-3d-project-view\
```

## File thiết kế/code Commander trên Downloads

| File | Kích thước | Nội dung |
|---|---|---|
| `claude_code.MD` | 35KB | CommanderTransmission v1 (hologram filter) |
| `COMMAnder chỉnh sửa.MD` | 27KB | CommanderTransmission v2 (refined) |
| `chuyển động và âm thanh.MD` | 53KB | CommanderTransmission v3 (mắt/miệng/voice) |
| `những vấn đề bạn nêu.MD` | 6KB | Bug fixes cho Commander |
| `PROMPT_COMMANDER_V6_FINAL.md` | 6KB | Spec gốc Commander |
| `PROMPT_COMMANDER_V7_FINAL.md` | 6.5KB | Spec cập nhật Commander |
| `PROMPT_GUI_CLAUDE.md` | 10.7KB | Spec cinematic intro R3F |
| `cinematic_3d_upgrade_script.md` | 11.6KB | Spec cinematic intro (bản sao) |
| `phi thuyền.MD` | 20KB | Spec 3D procedural ship system |
| `✅ PH.MD` | 7.3KB | Fix creative page planet text |
| `Bản này giải quyết triệt để 5 vấn đề.MD` | 18KB | 5 fixes + ambient audio |
| `implementation_plan.md` | 8KB | Kế hoạch triển khai |

## Source dumps trên Desktop

| File | Kích thước | Nội dung |
|---|---|---|
| `Huytran_Antigravity_Source.md` | 505KB | Toàn bộ source code (dump) |
| `Huytran_Antigravity_Source_Full.md` | 919KB | Source code mở rộng (dump) |
| `Thanh Huy 2003/` (thư mục) | — | Bản backup dự án + nhiều file phụ trợ |

---

# PHẦN E — THÔNG TIN CÁ NHÂN ĐƯỢC NHÚNG TRONG DỰ ÁN

| Trường | Giá trị |
|---|---|
| Họ tên | Trần Thanh Huy |
| Ngày sinh | 01/10/2003 |
| Vai trò | Frontend Developer (Fresher) |
| Học vấn | Đại học Tây Đô, Công nghệ Thông tin, 2021-2025 |
| Địa chỉ | Ninh Kiều, Cần Thơ |
| Số điện thoại | 0944329202 |
| Email | huytran.work.02@gmail.com |
| LinkedIn | huytran4 |
| GitHub | BLGCK44 |
| Triết lý | "Không gian số có trọng lực riêng" |
| Tốc độ | AI bứt tốc 10x |
| Phong cách | Antigravity + Neon Physics |
