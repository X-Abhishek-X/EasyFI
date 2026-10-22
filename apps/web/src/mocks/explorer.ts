// MOCK DATA — Investment Explorer. Replace with POST /api/v1/explorer/messages (structured answer).
import type { AssistantMessage } from '@/components/explorer/types';

export const explorerSuggestions = [
  'Should I add SCHD if I already own VOO and QQQ?',
  'Which ETFs hold the most NVIDIA?',
  'How much do VTI and VOO overlap?',
  'Where does my tech exposure come from?',
];

export const cannedReply: Omit<AssistantMessage, 'id'> = {
  role: 'assistant',
  text: 'Adding SCHD next to VOO and QQQ would pull your Technology weight down by about 6 points and lift Consumer Staples, Energy and Health Care. SCHD shares few top names with the other two funds, so it mostly adds companies you do not own yet. This describes exposure only; it is not a recommendation to buy or skip the fund.',
  blocks: [
    {
      type: 'sector_shift',
      title: 'Sector shift',
      subtitle: 'Your look-through weights before and after adding $10,000 of SCHD',
      asOf: '2026-09-05',
      rows: [
        { sector: 'Technology', before: 0.41, after: 0.35 },
        { sector: 'Communication', before: 0.12, after: 0.11 },
        { sector: 'Consumer Staples', before: 0.05, after: 0.08 },
        { sector: 'Energy', before: 0.03, after: 0.06 },
        { sector: 'Health Care', before: 0.09, after: 0.11 },
        { sector: 'Financials', before: 0.1, after: 0.1 },
      ],
    },
    {
      type: 'table',
      title: 'Shared holdings',
      subtitle: '126 shared of 574 constituents',
      asOf: '2026-09-05',
      columns: [
        { key: 'VOO', label: 'VOO' },
        { key: 'QQQ', label: 'QQQ' },
        { key: 'SCHD', label: 'SCHD' },
      ],
      rows: [
        {
          ticker: 'NVDA',
          name: 'NVIDIA Corp',
          values: { VOO: 0.0251, QQQ: 0.0253, SCHD: null },
          total: 0.0505,
        },
        {
          ticker: 'AAPL',
          name: 'Apple Inc',
          values: { VOO: 0.022, QQQ: 0.0222, SCHD: null },
          total: 0.0443,
        },
        {
          ticker: 'MSFT',
          name: 'Microsoft Corp',
          values: { VOO: 0.0144, QQQ: 0.0145, SCHD: null },
          total: 0.0289,
        },
        {
          ticker: 'QCOM',
          name: 'Qualcomm Inc',
          values: { VOO: 0.001, QQQ: 0.0028, SCHD: 0.0225 },
          total: 0.0263,
        },
        {
          ticker: 'MU',
          name: 'Micron Technology',
          values: { VOO: 0.0067, QQQ: 0.0188, SCHD: null },
          total: 0.0256,
        },
        {
          ticker: 'AMZN',
          name: 'Amazon.com Inc',
          values: { VOO: 0.0121, QQQ: 0.0134, SCHD: null },
          total: 0.0255,
        },
        {
          ticker: 'TXN',
          name: 'Texas Instruments',
          values: { VOO: 0.0014, QQQ: 0.0039, SCHD: 0.0197 },
          total: 0.025,
        },
        {
          ticker: 'GOOGL',
          name: 'Alphabet Inc',
          values: { VOO: 0.0109, QQQ: 0.0109, SCHD: null },
          total: 0.0218,
        },
        {
          ticker: 'CSCO',
          name: 'Cisco Systems',
          values: { VOO: 0.0021, QQQ: 0.0052, SCHD: 0.0139 },
          total: 0.0212,
        },
        {
          ticker: 'PEP',
          name: 'PepsiCo Inc',
          values: { VOO: 0.0024, QQQ: 0.0061, SCHD: 0.0119 },
          total: 0.0204,
        },
      ],
    },
  ],
};
