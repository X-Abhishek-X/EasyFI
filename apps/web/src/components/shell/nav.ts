import {
  ArrowLeftRight,
  Coins,
  Gauge,
  House,
  LifeBuoy,
  type LucideIcon,
  MessageSquareText,
  PieChart,
  Settings,
  Sparkles,
} from 'lucide-react';

export type NavItem = { href: string; label: string; short?: string; icon: LucideIcon };

export const PRIMARY_NAV: NavItem[] = [
  { href: '/', label: 'Home', icon: House },
  { href: '/explorer', label: 'Investment Explorer', short: 'Explorer', icon: MessageSquareText },
  { href: '/portfolios', label: 'Portfolios', icon: PieChart },
  { href: '/compare', label: 'Compare', icon: ArrowLeftRight },
  { href: '/dividends', label: 'Dividends', icon: Coins },
  { href: '/inflation', label: 'Inflation', icon: Gauge },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: '/help', label: 'Help', icon: LifeBuoy },
  { href: '/whats-new', label: "What's new", icon: Sparkles },
];

export function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
