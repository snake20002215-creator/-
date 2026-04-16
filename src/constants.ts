import { CommissionStatus } from './types';

export const STATUS_NODES: { value: CommissionStatus; label: string; description: string }[] = [
  { value: 'submitted', label: '已填單', description: '收到委託申請' },
  { value: 'queued', label: '排單中', description: '等待開始製作' },
  { value: 'draft', label: '草稿', description: '構圖與草稿階段' },
  { value: 'delivered', label: '已交稿', description: '檔案已發送' },
];

export const COMMISSION_TYPES = [
  { value: 'single', label: '單人' },
  { value: 'multiple', label: '雙人/雙人以上' },
  { value: 'halfbody', label: '半身' },
  { value: 'fullbody', label: '全身' },
  { value: 'r18g', label: 'R18G' },
  { value: 'nobg', label: '無背景' },
  { value: 'withbg', label: '含背景' },
];

export const DEFAULT_ADMIN_PASSWORD = 'admin';
