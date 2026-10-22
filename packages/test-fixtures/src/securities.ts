// Security metadata for every fund and every constituent referenced by the fixtures.
// Shapes structurally match `Security` / `SecurityMap` in @easyfi/core (no import on purpose).

export interface FixtureSecurity {
  ticker: string;
  name: string;
  type: 'stock' | 'etf' | 'mutual_fund' | 'mmf' | 'crypto' | 'bond' | 'other';
  sector: string | null;
  industry: string | null;
  expenseRatio: number | null;
}

export const IT = 'Information Technology';
export const FIN = 'Financials';
export const COMM = 'Communication Services';
export const CD = 'Consumer Discretionary';
export const CS = 'Consumer Staples';
export const HC = 'Health Care';
export const IND = 'Industrials';
export const EN = 'Energy';
export const UT = 'Utilities';
export const RE = 'Real Estate';
export const MAT = 'Materials';

type CompanyRow = [ticker: string, name: string, sector: string, industry: string];

const SEMIS = 'Semiconductors';
const SEMI_EQUIP = 'Semiconductor Equipment';
const SOFTWARE = 'Software';
const PHARMA = 'Pharmaceuticals';
const BIOTECH = 'Biotechnology';
const BANKS = 'Banks';
const CAP_MKTS = 'Capital Markets';
const FIN_SVCS = 'Financial Services';
const OIL_GAS = 'Oil, Gas & Consumable Fuels';
const HC_EQUIP = 'Health Care Equipment & Supplies';
const AERO = 'Aerospace & Defense';
const HOTELS = 'Hotels, Restaurants & Leisure';
const SPEC_RETAIL = 'Specialty Retail';
const STAPLES_RETAIL = 'Consumer Staples Distribution & Retail';
const ELEC_UTIL = 'Electric Utilities';

const COMPANIES: CompanyRow[] = [
  ['AAPL', 'Apple Inc', IT, 'Technology Hardware, Storage & Peripherals'],
  ['MSFT', 'Microsoft Corp', IT, SOFTWARE],
  ['NVDA', 'NVIDIA Corp', IT, SEMIS],
  ['AMZN', 'Amazon.com Inc', CD, 'Broadline Retail'],
  ['META', 'Meta Platforms Inc', COMM, 'Interactive Media & Services'],
  ['AVGO', 'Broadcom Inc', IT, SEMIS],
  ['GOOGL', 'Alphabet Inc', COMM, 'Interactive Media & Services'],
  ['TSLA', 'Tesla Inc', CD, 'Automobiles'],
  ['BRK.B', 'Berkshire Hathaway Inc', FIN, FIN_SVCS],
  ['JPM', 'JPMorgan Chase & Co', FIN, BANKS],
  ['LLY', 'Eli Lilly and Co', HC, PHARMA],
  ['V', 'Visa Inc', FIN, FIN_SVCS],
  ['ORCL', 'Oracle Corp', IT, SOFTWARE],
  ['NFLX', 'Netflix Inc', COMM, 'Entertainment'],
  ['XOM', 'Exxon Mobil Corp', EN, OIL_GAS],
  ['MA', 'Mastercard Inc', FIN, FIN_SVCS],
  ['WMT', 'Walmart Inc', CS, STAPLES_RETAIL],
  ['COST', 'Costco Wholesale Corp', CS, STAPLES_RETAIL],
  ['JNJ', 'Johnson & Johnson', HC, PHARMA],
  ['PLTR', 'Palantir Technologies Inc', IT, SOFTWARE],
  ['HD', 'Home Depot Inc', CD, SPEC_RETAIL],
  ['ABBV', 'AbbVie Inc', HC, BIOTECH],
  ['BAC', 'Bank of America Corp', FIN, BANKS],
  ['PG', 'Procter & Gamble Co', CS, 'Household Products'],
  ['AMD', 'Advanced Micro Devices Inc', IT, SEMIS],
  ['UNH', 'UnitedHealth Group Inc', HC, 'Health Care Providers & Services'],
  ['GE', 'GE Aerospace', IND, AERO],
  ['CVX', 'Chevron Corp', EN, OIL_GAS],
  ['KO', 'Coca-Cola Co', CS, 'Beverages'],
  ['CSCO', 'Cisco Systems Inc', IT, 'Communications Equipment'],
  ['WFC', 'Wells Fargo & Co', FIN, BANKS],
  ['IBM', 'International Business Machines Corp', IT, 'IT Services'],
  ['PM', 'Philip Morris International Inc', CS, 'Tobacco'],
  ['MS', 'Morgan Stanley', FIN, CAP_MKTS],
  ['GS', 'Goldman Sachs Group Inc', FIN, CAP_MKTS],
  ['CRM', 'Salesforce Inc', IT, SOFTWARE],
  ['ABT', 'Abbott Laboratories', HC, HC_EQUIP],
  ['AXP', 'American Express Co', FIN, 'Consumer Finance'],
  ['LIN', 'Linde plc', MAT, 'Chemicals'],
  ['MCD', "McDonald's Corp", CD, HOTELS],
  ['MRK', 'Merck & Co Inc', HC, PHARMA],
  ['RTX', 'RTX Corp', IND, AERO],
  ['CAT', 'Caterpillar Inc', IND, 'Machinery'],
  ['PEP', 'PepsiCo Inc', CS, 'Beverages'],
  ['DIS', 'Walt Disney Co', COMM, 'Entertainment'],
  ['T', 'AT&T Inc', COMM, 'Diversified Telecommunication Services'],
  ['UBER', 'Uber Technologies Inc', IND, 'Ground Transportation'],
  ['INTU', 'Intuit Inc', IT, SOFTWARE],
  ['NOW', 'ServiceNow Inc', IT, SOFTWARE],
  ['TMUS', 'T-Mobile US Inc', COMM, 'Wireless Telecommunication Services'],
  ['SHOP', 'Shopify Inc', IT, SOFTWARE],
  ['ISRG', 'Intuitive Surgical Inc', HC, HC_EQUIP],
  ['TXN', 'Texas Instruments Inc', IT, SEMIS],
  ['BKNG', 'Booking Holdings Inc', CD, HOTELS],
  ['QCOM', 'Qualcomm Inc', IT, SEMIS],
  ['AMGN', 'Amgen Inc', HC, BIOTECH],
  ['AMAT', 'Applied Materials Inc', IT, SEMI_EQUIP],
  ['MU', 'Micron Technology Inc', IT, SEMIS],
  ['LRCX', 'Lam Research Corp', IT, SEMI_EQUIP],
  ['ADBE', 'Adobe Inc', IT, SOFTWARE],
  ['GILD', 'Gilead Sciences Inc', HC, BIOTECH],
  ['PANW', 'Palo Alto Networks Inc', IT, SOFTWARE],
  ['HON', 'Honeywell International Inc', IND, 'Industrial Conglomerates'],
  ['KLAC', 'KLA Corp', IT, SEMI_EQUIP],
  ['APP', 'AppLovin Corp', IT, SOFTWARE],
  ['ADP', 'Automatic Data Processing Inc', IND, 'Professional Services'],
  ['INTC', 'Intel Corp', IT, SEMIS],
  ['CMCSA', 'Comcast Corp', COMM, 'Media'],
  ['ADI', 'Analog Devices Inc', IT, SEMIS],
  ['VRTX', 'Vertex Pharmaceuticals Inc', HC, BIOTECH],
  ['SBUX', 'Starbucks Corp', CD, HOTELS],
  ['CRWD', 'CrowdStrike Holdings Inc', IT, SOFTWARE],
  ['MELI', 'MercadoLibre Inc', CD, 'Broadline Retail'],
  ['CEG', 'Constellation Energy Corp', UT, ELEC_UTIL],
  ['ASML', 'ASML Holding NV', IT, SEMI_EQUIP],
  ['CDNS', 'Cadence Design Systems Inc', IT, SOFTWARE],
  ['SNPS', 'Synopsys Inc', IT, SOFTWARE],
  ['ORLY', "O'Reilly Automotive Inc", CD, SPEC_RETAIL],
  ['MDLZ', 'Mondelez International Inc', CS, 'Food Products'],
  ['MAR', 'Marriott International Inc', CD, HOTELS],
  ['CTAS', 'Cintas Corp', IND, 'Commercial Services & Supplies'],
  ['PYPL', 'PayPal Holdings Inc', FIN, FIN_SVCS],
  ['FAST', 'Fastenal Co', IND, 'Trading Companies & Distributors'],
  ['ANET', 'Arista Networks Inc', IT, 'Communications Equipment'],
  ['ACN', 'Accenture plc', IT, 'IT Services'],
  ['APH', 'Amphenol Corp', IT, 'Electronic Equipment, Instruments & Components'],
  ['MSI', 'Motorola Solutions Inc', IT, 'Communications Equipment'],
  ['DELL', 'Dell Technologies Inc', IT, 'Technology Hardware, Storage & Peripherals'],
  ['SPGI', 'S&P Global Inc', FIN, CAP_MKTS],
  ['BX', 'Blackstone Inc', FIN, CAP_MKTS],
  ['KKR', 'KKR & Co Inc', FIN, CAP_MKTS],
  ['TJX', 'TJX Companies Inc', CD, SPEC_RETAIL],
  ['ETN', 'Eaton Corp plc', IND, 'Electrical Equipment'],
  ['GEV', 'GE Vernova Inc', IND, 'Electrical Equipment'],
  ['HWM', 'Howmet Aerospace Inc', IND, AERO],
  ['VST', 'Vistra Corp', UT, 'Independent Power and Renewable Electricity Producers'],
  ['BSX', 'Boston Scientific Corp', HC, HC_EQUIP],
  ['VZ', 'Verizon Communications Inc', COMM, 'Diversified Telecommunication Services'],
  ['LMT', 'Lockheed Martin Corp', IND, AERO],
  ['BMY', 'Bristol-Myers Squibb Co', HC, PHARMA],
  ['MO', 'Altria Group Inc', CS, 'Tobacco'],
  ['COP', 'ConocoPhillips', EN, OIL_GAS],
  ['PFE', 'Pfizer Inc', HC, PHARMA],
  ['UPS', 'United Parcel Service Inc', IND, 'Air Freight & Logistics'],
  ['EOG', 'EOG Resources Inc', EN, OIL_GAS],
  ['KMB', 'Kimberly-Clark Corp', CS, 'Household Products'],
  ['OKE', 'ONEOK Inc', EN, OIL_GAS],
  ['TGT', 'Target Corp', CS, STAPLES_RETAIL],
  ['HSY', 'Hershey Co', CS, 'Food Products'],
  ['PAYX', 'Paychex Inc', IND, 'Professional Services'],
  ['C', 'Citigroup Inc', FIN, BANKS],
  ['NEE', 'NextEra Energy Inc', UT, ELEC_UTIL],
  ['SO', 'Southern Co', UT, ELEC_UTIL],
  ['DUK', 'Duke Energy Corp', UT, ELEC_UTIL],
  ['CME', 'CME Group Inc', FIN, CAP_MKTS],
  ['PLD', 'Prologis Inc', RE, 'Industrial REITs'],
  ['LOW', "Lowe's Companies Inc", CD, SPEC_RETAIL],
  ['TRV', 'Travelers Companies Inc', FIN, 'Insurance'],
  ['PGR', 'Progressive Corp', FIN, 'Insurance'],
  ['CB', 'Chubb Ltd', FIN, 'Insurance'],
  ['ICE', 'Intercontinental Exchange Inc', FIN, CAP_MKTS],
  ['SYK', 'Stryker Corp', HC, HC_EQUIP],
  ['MDT', 'Medtronic plc', HC, HC_EQUIP],
  ['REGN', 'Regeneron Pharmaceuticals Inc', HC, BIOTECH],
  ['WM', 'Waste Management Inc', IND, 'Commercial Services & Supplies'],
  ['EMR', 'Emerson Electric Co', IND, 'Electrical Equipment'],
  ['TT', 'Trane Technologies plc', IND, 'Building Products'],
  ['NOC', 'Northrop Grumman Corp', IND, AERO],
  ['CL', 'Colgate-Palmolive Co', CS, 'Household Products'],
  ['YUM', 'Yum! Brands Inc', CD, HOTELS],
];

type FundRow = [ticker: string, name: string, type: 'etf' | 'mutual_fund', expenseRatio: number];

const FUNDS: FundRow[] = [
  ['VOO', 'Vanguard S&P 500 ETF', 'etf', 0.0003],
  ['VTI', 'Vanguard Total Stock Market ETF', 'etf', 0.0003],
  ['QQQ', 'Invesco QQQ Trust', 'etf', 0.002],
  ['QQQM', 'Invesco NASDAQ 100 ETF', 'etf', 0.0015],
  ['SCHD', 'Schwab U.S. Dividend Equity ETF', 'etf', 0.0006],
  ['VGT', 'Vanguard Information Technology ETF', 'etf', 0.0009],
  ['SCHG', 'Schwab U.S. Large-Cap Growth ETF', 'etf', 0.0004],
  ['SPMO', 'Invesco S&P 500 Momentum ETF', 'etf', 0.0013],
  ['VYM', 'Vanguard High Dividend Yield ETF', 'etf', 0.0006],
  ['JEPI', 'JPMorgan Equity Premium Income ETF', 'etf', 0.0035],
  ['FXAIX', 'Fidelity 500 Index Fund', 'mutual_fund', 0.00015],
];

function buildSecurities(): Record<string, FixtureSecurity> {
  const out: Record<string, FixtureSecurity> = {};
  for (const [ticker, name, sector, industry] of COMPANIES) {
    out[ticker] = { ticker, name, type: 'stock', sector, industry, expenseRatio: null };
  }
  for (const [ticker, name, type, expenseRatio] of FUNDS) {
    out[ticker] = { ticker, name, type, sector: null, industry: null, expenseRatio };
  }
  out['SVF-1'] = {
    ticker: 'SVF-1',
    name: 'Stable Value Fund (401k collective trust)',
    type: 'other',
    sector: null,
    industry: null,
    expenseRatio: 0.0025,
  };
  out.SPAXX = {
    ticker: 'SPAXX',
    name: 'Fidelity Government Money Market Fund',
    type: 'mmf',
    sector: null,
    industry: null,
    expenseRatio: 0.0042,
  };
  return out;
}

export const securities: Record<string, FixtureSecurity> = buildSecurities();

export const FUND_TICKERS: string[] = FUNDS.map(([t]) => t);

export function security(ticker: string): FixtureSecurity {
  const s = securities[ticker];
  if (!s) throw new Error(`fixture security not found: ${ticker}`);
  return s;
}
