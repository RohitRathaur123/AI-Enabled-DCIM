// Static master data — Area: Currency, Time zone, Country, State, City.

export const CURRENCIES = [
  { id: 1, code: "INR", name: "Indian Rupee", symbol: "₹", isActive: true, createdAt: "2025-01-06T09:15:00Z", updatedAt: "2025-01-06T09:15:00Z" },
  { id: 2, code: "USD", name: "US Dollar", symbol: "$", isActive: true, createdAt: "2025-01-06T09:16:00Z", updatedAt: "2025-01-06T09:16:00Z" },
  { id: 3, code: "EUR", name: "Euro", symbol: "€", isActive: true, createdAt: "2025-01-06T09:17:00Z", updatedAt: "2025-02-11T10:05:00Z" },
  { id: 4, code: "GBP", name: "Pound Sterling", symbol: "£", isActive: true, createdAt: "2025-01-06T09:18:00Z", updatedAt: "2025-01-06T09:18:00Z" },
  { id: 5, code: "SGD", name: "Singapore Dollar", symbol: "S$", isActive: true, createdAt: "2025-01-07T11:02:00Z", updatedAt: "2025-01-07T11:02:00Z" },
  { id: 6, code: "AED", name: "UAE Dirham", symbol: "د.إ", isActive: true, createdAt: "2025-01-07T11:04:00Z", updatedAt: "2025-01-07T11:04:00Z" },
  { id: 7, code: "JPY", name: "Japanese Yen", symbol: "¥", isActive: true, createdAt: "2025-01-07T11:06:00Z", updatedAt: "2025-01-07T11:06:00Z" },
  { id: 8, code: "AUD", name: "Australian Dollar", symbol: "A$", isActive: true, createdAt: "2025-01-08T08:40:00Z", updatedAt: "2025-01-08T08:40:00Z" },
  { id: 9, code: "CAD", name: "Canadian Dollar", symbol: "C$", isActive: true, createdAt: "2025-01-08T08:42:00Z", updatedAt: "2025-01-08T08:42:00Z" },
  { id: 10, code: "CHF", name: "Swiss Franc", symbol: "Fr", isActive: false, createdAt: "2025-01-08T08:44:00Z", updatedAt: "2025-06-19T12:30:00Z" },
  { id: 11, code: "SAR", name: "Saudi Riyal", symbol: "﷼", isActive: false, createdAt: "2025-03-14T07:20:00Z", updatedAt: "2025-03-14T07:20:00Z" },
];

export const TIME_ZONES = [
  { id: 1, timeZoneName: "India Standard Time (IST)", utcOffset: "+05:30", countryId: 1 },
  { id: 2, timeZoneName: "Eastern Time (ET)", utcOffset: "-05:00", countryId: 2 },
  { id: 3, timeZoneName: "Pacific Time (PT)", utcOffset: "-08:00", countryId: 2 },
  { id: 4, timeZoneName: "Central Time (CT)", utcOffset: "-06:00", countryId: 2 },
  { id: 5, timeZoneName: "Greenwich Mean Time (GMT)", utcOffset: "+00:00", countryId: 3 },
  { id: 6, timeZoneName: "Singapore Standard Time (SGT)", utcOffset: "+08:00", countryId: 4 },
  { id: 7, timeZoneName: "Gulf Standard Time (GST)", utcOffset: "+04:00", countryId: 5 },
  { id: 8, timeZoneName: "Central European Time (CET)", utcOffset: "+01:00", countryId: 6 },
  { id: 9, timeZoneName: "Japan Standard Time (JST)", utcOffset: "+09:00", countryId: 7 },
  { id: 10, timeZoneName: "Australian Eastern Time (AET)", utcOffset: "+10:00", countryId: 8 },
  { id: 11, timeZoneName: "Eastern Time - Toronto (ET)", utcOffset: "-05:00", countryId: 9 },
].map((t, i) => ({ ...t, isActive: true, createdAt: `2025-01-${String(5 + (i % 3)).padStart(2, "0")}T10:${String(10 + i).padStart(2, "0")}:00Z`, updatedAt: `2025-01-${String(5 + (i % 3)).padStart(2, "0")}T10:${String(10 + i).padStart(2, "0")}:00Z` }));

const cur = (id) => CURRENCIES.find((c) => c.id === id);

export const COUNTRIES = [
  { id: 1, name: "India", code: "IN", currencyId: 1, timeZoneId: 1 },
  { id: 2, name: "United States", code: "US", currencyId: 2, timeZoneId: 2 },
  { id: 3, name: "United Kingdom", code: "GB", currencyId: 4, timeZoneId: 5 },
  { id: 4, name: "Singapore", code: "SG", currencyId: 5, timeZoneId: 6 },
  { id: 5, name: "United Arab Emirates", code: "AE", currencyId: 6, timeZoneId: 7 },
  { id: 6, name: "Germany", code: "DE", currencyId: 3, timeZoneId: 8 },
  { id: 7, name: "Japan", code: "JP", currencyId: 7, timeZoneId: 9 },
  { id: 8, name: "Australia", code: "AU", currencyId: 8, timeZoneId: 10 },
  { id: 9, name: "Canada", code: "CA", currencyId: 9, timeZoneId: 11 },
].map((c, i) => ({
  ...c,
  currencyName: cur(c.currencyId)?.name || "",
  currencySymbol: cur(c.currencyId)?.symbol || "",
  currencyCode: cur(c.currencyId)?.code || "",
  isDeleted: false,
  createdAt: `2025-01-${String(9 + i).padStart(2, "0")}T09:30:00Z`,
  updatedAt: `2025-01-${String(9 + i).padStart(2, "0")}T09:30:00Z`,
}));

const STATE_LIST = [
  // India
  [1, "Uttar Pradesh", "UP"], [1, "Maharashtra", "MH"], [1, "Karnataka", "KA"], [1, "Tamil Nadu", "TN"],
  [1, "Telangana", "TG"], [1, "Delhi", "DL"], [1, "Haryana", "HR"], [1, "Gujarat", "GJ"],
  // United States
  [2, "California", "CA"], [2, "Virginia", "VA"], [2, "Texas", "TX"], [2, "New York", "NY"], [2, "Washington", "WA"],
  // United Kingdom
  [3, "England", "ENG"], [3, "Scotland", "SCT"],
  // Singapore
  [4, "Central Region", "CR"],
  // UAE
  [5, "Dubai", "DU"], [5, "Abu Dhabi", "AZ"],
  // Germany
  [6, "Hesse", "HE"], [6, "Bavaria", "BY"],
  // Japan
  [7, "Tokyo", "TKY"], [7, "Osaka", "OSK"],
  // Australia
  [8, "New South Wales", "NSW"], [8, "Victoria", "VIC"],
  // Canada
  [9, "Ontario", "ON"], [9, "Quebec", "QC"],
];

export const STATES = STATE_LIST.map(([countryId, name, code], i) => ({
  id: i + 1,
  name,
  countryId,
  statusCode: code,
  stateCode: code,
  isDeleted: false,
  createdAt: `2025-01-${String(12 + (i % 15)).padStart(2, "0")}T11:${String(i % 60).padStart(2, "0")}:00Z`,
  updatedAt: `2025-01-${String(12 + (i % 15)).padStart(2, "0")}T11:${String(i % 60).padStart(2, "0")}:00Z`,
}));

const stateId = (name) => STATES.find((s) => s.name === name)?.id;

const CITY_LIST = [
  ["Uttar Pradesh", "Noida"], ["Uttar Pradesh", "Lucknow"],
  ["Maharashtra", "Mumbai"], ["Maharashtra", "Navi Mumbai"], ["Maharashtra", "Pune"],
  ["Karnataka", "Bengaluru"], ["Karnataka", "Mysuru"],
  ["Tamil Nadu", "Chennai"], ["Tamil Nadu", "Coimbatore"],
  ["Telangana", "Hyderabad"], ["Delhi", "New Delhi"], ["Haryana", "Gurugram"], ["Gujarat", "Ahmedabad"],
  ["California", "Los Angeles"], ["California", "San Francisco"], ["California", "Santa Clara"],
  ["Virginia", "Ashburn"], ["Texas", "Dallas"], ["Texas", "Austin"], ["New York", "New York City"], ["Washington", "Seattle"],
  ["England", "London"], ["England", "Manchester"], ["Scotland", "Edinburgh"],
  ["Central Region", "Singapore"], ["Dubai", "Dubai"], ["Abu Dhabi", "Abu Dhabi"],
  ["Hesse", "Frankfurt"], ["Bavaria", "Munich"], ["Tokyo", "Tokyo"], ["Osaka", "Osaka"],
  ["New South Wales", "Sydney"], ["Victoria", "Melbourne"], ["Ontario", "Toronto"], ["Quebec", "Montreal"],
];

export const CITIES = CITY_LIST.map(([state, name], i) => ({
  id: i + 1,
  name,
  stateId: stateId(state),
  isDeleted: i === 33, // Montreal is shown as a deleted (restorable) city
  createdAt: `2025-02-${String(1 + (i % 27)).padStart(2, "0")}T08:${String((i * 7) % 60).padStart(2, "0")}:00Z`,
  updatedAt: `2025-02-${String(1 + (i % 27)).padStart(2, "0")}T08:${String((i * 7) % 60).padStart(2, "0")}:00Z`,
}));

export const cityId = (name) => CITIES.find((c) => c.name === name)?.id;
export { stateId };
