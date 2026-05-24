export interface PlanetData {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  emissiveColor: string;
  radius: number;
  orbitRadius: number;
  orbitEccentricity: number; // 0 = tròn, >0 = elip
  orbitSpeed: number;
  spinSpeed: number;
  inclination: number; // độ nghiêng trục
  orbitTilt: number; // độ nghiêng quỹ đạo
  hoverFreq: number; // tần số âm thanh hover (Hz)
  stats: { label: string; value: string | number; level?: number }[];
  details?: string[];
  technologies?: string[];
  contact?: { label: string; value: string; href: string }[];
}

export const SUN_DATA: PlanetData = {
  id: "sun-core",
  name: "Trần Thanh Huy",
  code: "CMDR-2003",
  description: "Frontend Developer Intern khám phá điểm giao giữa thiết kế, công nghệ và AI. Sẵn sàng kiến tạo những không gian số có trọng lực riêng.",
  color: "#FFB347",
  emissiveColor: "#FFA000",
  radius: 4.5,
  orbitRadius: 0,
  orbitEccentricity: 0,
  orbitSpeed: 0,
  spinSpeed: 0.1,
  inclination: 0,
  orbitTilt: 0,
  hoverFreq: 432.0,
  stats: [], // Dùng contact thay cho stats
  details: [
    "Khởi nguồn từ một kỹ sư đam mê sự hoàn mỹ của UI/UX, hướng tới việc kiến tạo những trải nghiệm số siêu thực và mang tính tương tác cao.",
    "Luôn tìm kiếm sự giao thoa hoàn hảo giữa nghệ thuật thiết kế (Design) và sức mạnh vô hạn của Trí Tuệ Nhân Tạo (AI)."
  ],
  technologies: ["React", "Next.js", "Three.js", "Framer Motion", "WebGL", "GenAI"],
  contact: [
    { label: "Email", value: "huytran.work.02@gmail.com", href: "mailto:huytran.work.02@gmail.com" },
    { label: "GitHub", value: "github.com/BLGCK44", href: "https://github.com/BLGCK44" },
    { label: "LinkedIn", value: "linkedin.com/in/huytran4", href: "https://linkedin.com/in/huytran4" }
  ]
};

export const PLANETS: PlanetData[] = [
  {
    id: "frontend-core",
    name: "Frontend Mastery",
    code: "FRONT-01",
    description: "Lõi hệ thống giao diện, phát triển trên nền tảng React và Next.js để đảm bảo tốc độ và SEO.",
    color: "#00FFE5",
    emissiveColor: "#0AF5DD",
    radius: 0.9,
    orbitRadius: 9,
    orbitEccentricity: 0.05,
    orbitSpeed: 0.25,
    spinSpeed: 0.8,
    inclination: 18,
    orbitTilt: 3,
    hoverFreq: 523.25,
    stats: [
      { label: "Next.js 15", value: "95%", level: 95 },
      { label: "React & TS", value: "92%", level: 92 },
    ],
    details: [
      "Xây dựng ứng dụng web hiện đại với Next.js App Router, tối ưu hóa quá trình prerendering (SSR/SSG).",
      "Sử dụng TypeScript để đảm bảo tính toàn vẹn của luồng dữ liệu (Type-safety) và dễ dàng bảo trì quy mô lớn."
    ],
    technologies: ["Next.js 15", "React 19", "TypeScript", "Zustand"],
  },
  {
    id: "ui-ux",
    name: "UI/UX Architecture",
    code: "UIX-02",
    description: "Hành tinh của thiết kế giao diện hiện đại. Mọi pixel đều được chăm chút kỹ lưỡng.",
    color: "#FF2EC4",
    emissiveColor: "#FF66D9",
    radius: 1.0,
    orbitRadius: 12,
    orbitEccentricity: 0,
    orbitSpeed: 0.2,
    spinSpeed: 0.6,
    inclination: 22,
    orbitTilt: -5,
    hoverFreq: 587.33,
    stats: [
      { label: "Tailwind CSS", value: "98%", level: 98 },
      { label: "Shadcn/ui", value: "90%", level: 90 },
    ],
    details: [
      "Triển khai các hệ thống Atomic Design, đảm bảo tính nhất quán qua Tailwind CSS và Shadcn/ui.",
      "Tập trung vào trải nghiệm người dùng (UX) mượt mà, tối ưu hóa điểm tiếp xúc (Touchpoints)."
    ],
    technologies: ["Tailwind CSS", "Shadcn UI", "Figma", "CSS Modules"],
  },
  {
    id: "backend-api",
    name: "Backend & Systems",
    code: "BACK-03",
    description: "Nền tảng hạ tầng phía sau, cung cấp dữ liệu ổn định và bảo mật cho toàn bộ hệ sinh thái.",
    color: "#FFC857",
    emissiveColor: "#FFDA85",
    radius: 0.85,
    orbitRadius: 15,
    orbitEccentricity: 0.08,
    orbitSpeed: 0.17,
    spinSpeed: 0.9,
    inclination: 15,
    orbitTilt: 7,
    hoverFreq: 659.25,
    stats: [
      { label: "RESTful APIs", value: "90%", level: 90 },
      { label: "Node.js / Express", value: "85%", level: 85 },
    ],
    details: [
      "Thiết kế các kiến trúc Microservices và luồng API RESTful tốc độ cao để trao đổi dữ liệu an toàn.",
      "Xử lý cơ sở dữ liệu và tối ưu hóa truy vấn để tránh độ trễ trong các tương tác realtime."
    ],
    technologies: ["Node.js", "Express", "RESTful API", "MongoDB", "PostgreSQL"],
  },
  {
    id: "ai-integration",
    name: "AI Integration",
    code: "AI-04",
    description: "Sức mạnh tự động hóa — biến ý tưởng thành dòng code thông qua các mô hình trí tuệ nhân tạo.",
    color: "#FF4500",
    emissiveColor: "#FF7A40",
    radius: 0.95,
    orbitRadius: 19,
    orbitEccentricity: 0.03,
    orbitSpeed: 0.13,
    spinSpeed: 0.5,
    inclination: 25,
    orbitTilt: -2,
    hoverFreq: 698.46,
    stats: [
      { label: "AI Integration", value: "88%", level: 88 },
      { label: "Prompt Eng", value: "85%", level: 85 },
    ],
    details: [
      "Áp dụng AI vào quy trình lập trình (10x speed), giúp tự động hóa tạo boilerplate và tối ưu hóa thuật toán.",
      "Kỹ thuật Prompt Engineering chuyên sâu để thao túng và khai thác sức mạnh của LLMs."
    ],
    technologies: ["OpenAI GPT-4", "Claude 3.5", "Vercel AI SDK", "Prompt Engineering"],
  },
  {
    id: "creative-canvas",
    name: "Creative Canvas",
    code: "CVS-05",
    description: "Không gian kết nối giữa mỹ thuật 3D và lập trình trình duyệt. WebGL và Antigravity.",
    color: "#8A2BE2",
    emissiveColor: "#9D4EDD",
    radius: 1.1,
    orbitRadius: 23,
    orbitEccentricity: 0.06,
    orbitSpeed: 0.1,
    spinSpeed: 0.7,
    inclination: 20,
    orbitTilt: 4,
    hoverFreq: 783.99,
    stats: [
      { label: "Antigravity", value: "85%", level: 85 },
      { label: "3D Interaction", value: "75%", level: 75 },
    ],
    details: [
      "Ứng dụng R3F (React Three Fiber) để kết xuất đồ họa 3D trực tiếp trên DOM của trình duyệt.",
      "Tạo ra hiệu ứng vũ trụ vô tận, các hạt tinh vân và hệ hành tinh xoay quanh quỹ đạo toán học."
    ],
    technologies: ["Three.js", "React Three Fiber", "WebGL", "GLSL Shaders"],
  },
  {
    id: "physics-motion",
    name: "Physics & Motion",
    code: "PHYS-06",
    description: "Mô phỏng quy luật vật lý ảo và điều phối các chuỗi chuyển động siêu mượt.",
    color: "#2EFF7A",
    emissiveColor: "#5FFF9C",
    radius: 0.8,
    orbitRadius: 28,
    orbitEccentricity: 0.04,
    orbitSpeed: 0.08,
    spinSpeed: 0.4,
    inclination: 12,
    orbitTilt: -8,
    hoverFreq: 880.00,
    stats: [
      { label: "Neon Motion", value: "95%", level: 95 },
      { label: "Physics Sim", value: "80%", level: 80 },
    ],
    details: [
      "Dàn dựng biên đạo chuyển động (Choreography) kết hợp với âm thanh Cinematic không độ trễ.",
      "Sử dụng công cụ chuyển động mạnh mẽ (Framer Motion) và Engine vật lý (Matter.js, Rapier) để mô phỏng lực hấp dẫn."
    ],
    technologies: ["Framer Motion", "Matter.js", "Rapier", "GSAP"],
  }
];
