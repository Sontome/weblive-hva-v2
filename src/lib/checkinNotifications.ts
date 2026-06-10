import { sendTelegram } from '@/services/resourceService';

const fmtNow = () => new Date().toLocaleString('vi-VN');
const fmtDur = (m: number) => `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`;

export const notifyPrimaryCheckIn = (employee: string, resourceType: string, resourceName: string) =>
  sendTelegram(`🟢 CHECK-IN CHÍNH\n\nNhân viên:\n${employee}\n\nLoại:\n${resourceType}\n\nKênh:\n${resourceName}\n\nThời gian:\n${fmtNow()}`);

export const notifyPrimaryCheckOut = (employee: string, resourceType: string, resourceName: string, durationMin: number) =>
  sendTelegram(`🔴 CHECK-OUT CHÍNH\n\nNhân viên:\n${employee}\n\nLoại:\n${resourceType}\n\nKênh:\n${resourceName}\n\nThời gian:\n${fmtNow()}\n\nTổng thời gian:\n${fmtDur(durationMin)}`);

export const notifySupportRequest = (requester: string, resourceType: string, resourceName: string) =>
  sendTelegram(`🆘 YÊU CẦU HỖ TRỢ\n\nNhân viên:\n${requester}\n\nĐang trực:\n${resourceName}\n\nLoại:\n${resourceType}\n\nCần thêm người hỗ trợ.\n\nThời gian:\n${fmtNow()}`);

export const notifyJoinSupport = (support: string, requester: string, resourceType: string, resourceName: string) =>
  sendTelegram(`🤝 NHẬN HỖ TRỢ\n\nNhân viên:\n${support}\n\nĐã vào hỗ trợ\n\nKênh:\n${resourceName}\n\nLoại:\n${resourceType}\n\nTheo yêu cầu của:\n${requester}\n\nThời gian:\n${fmtNow()}`);

export const notifySupportCheckOut = (employee: string, resourceType: string, resourceName: string, durationMin: number) =>
  sendTelegram(`🚪 RỜI HỖ TRỢ\n\nNhân viên:\n${employee}\n\nKênh:\n${resourceName}\n\nLoại:\n${resourceType}\n\nThời gian:\n${fmtNow()}\n\nTổng thời gian hỗ trợ:\n${fmtDur(durationMin)}`);

export const notifySupportResolved = (requester: string, supportEmp: string, resourceType: string, resourceName: string, minutesSinceRequest: number) =>
  sendTelegram(`✅ YÊU CẦU HỖ TRỢ ĐÃ ĐƯỢC XỬ LÝ\n\nKênh:\n${resourceName}\n\nLoại:\n${resourceType}\n\nNgười yêu cầu:\n${requester}\n\nNhân viên hỗ trợ:\n${supportEmp}\n\nThời gian phản hồi:\n${minutesSinceRequest} phút`);

export const notifySupportExpired = (requester: string, resourceType: string, resourceName: string) =>
  sendTelegram(`⌛ YÊU CẦU HỖ TRỢ HẾT HẠN\n\nKênh:\n${resourceName}\n\nLoại:\n${resourceType}\n\nNgười yêu cầu:\n${requester}\n\nKhông có thêm nhân viên hỗ trợ trong thời gian yêu cầu.`);
