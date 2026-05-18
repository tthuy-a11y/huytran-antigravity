// lib/cosmic-data.ts — Dữ liệu dùng chung giữa CosmicOdyssey & System
export type CosmicItem = {
  id: string;
  name: string;
  code: string;
  desc: string;
  color: string;
  capability: string;
  items: string[];
};

export const cosmicData: CosmicItem[] = [
  {
    id: 'ai',
    name: 'PHI THUYỀN AI',
    code: 'NEXUS-01',
    desc: 'Mạng lưới Neural tự trị. Tích hợp Antigravity & OpenClaw kiểm soát siêu logic hệ thống.',
    color: '#00f2fe',
    capability: 'Trí Tuệ Nhân Tạo',
    items: ['Tự động hóa toàn bộ quy trình thông minh', 'Phân tích dữ liệu lớn, trích xuất thông tin tức thời', 'Tối ưu 300% tốc độ xử lý công việc', 'Tạo trợ lý AI từ câu lệnh tự nhiên'],
  },
  {
    id: 'web',
    name: 'PHI THUYỀN WEB',
    code: 'UIX-99',
    desc: 'Bẻ cong định luật UI/UX bằng kiến trúc DOM 3D không gian.',
    color: '#b026ff',
    capability: 'Thiết Kế Web 3D',
    items: ['Thiết kế giao diện không gian 3 chiều', 'Trải nghiệm người dùng đỉnh cao', 'Hiệu ứng chuyển động siêu mượt mà', 'Hiển thị hoàn hảo trên mọi thiết bị'],
  },
  {
    id: 'prompt',
    name: 'PHI THUYỀN PROMPT',
    code: 'PRMPT-X',
    desc: 'Kiến trúc sư ngôn ngữ máy. Tạo sinh hình ảnh & nội dung cực nhanh.',
    color: '#ff0844',
    capability: 'Kỹ Thuật Prompt',
    items: ['Kiến trúc sư ngôn ngữ cho AI', 'Tạo hình ảnh và nội dung cực nhanh', 'Tư duy chuỗi và tư duy phân nhánh', 'Làm chủ câu lệnh đa phương thức'],
  },
  {
    id: 'physics',
    name: 'PHI THUYỀN VẬT LÝ',
    code: 'PHYS-42',
    desc: 'Ban sự sống cho Pixel. Vật lý mã nguồn & animation thực tế.',
    color: '#00ff87',
    capability: 'Lập Trình Vật Lý',
    items: ['Hoạt hình theo quy luật vật lý thực tế', 'Hệ thống hạt và mô phỏng chất lỏng', 'Phát hiện và xử lý va chạm', 'Mô phỏng vật lý thời gian thực'],
  },
  {
    id: 'data',
    name: 'PHI THUYỀN DỮ LIỆU',
    code: 'CLOUD-7',
    desc: 'Kiến trúc phân tán siêu tốc. Đám mây và kho dữ liệu thông minh.',
    color: '#f5a623',
    capability: 'Dữ Liệu & Đám Mây',
    items: ['Kiến trúc phân tán siêu tốc độ', 'Đường ống xử lý và kho dữ liệu', 'Kiến trúc ứng dụng đám mây', 'Bảng điều khiển phân tích thời gian thực'],
  },
  {
    id: 'security',
    name: 'PHI THUYỀN BẢO MẬT',
    code: 'SHIELD-X',
    desc: 'Pháo đài kỹ thuật số. Mã hóa đa lớp và phòng thủ tuyệt đối.',
    color: '#ff007f',
    capability: 'An Ninh Mạng',
    items: ['Mã hóa và bảo mật đa lớp', 'Kiểm thử xâm nhập và đánh giá', 'Kiến trúc không tin cậy (Zero-Trust)', 'Quy trình ứng phó sự cố'],
  },
];

export default cosmicData;
