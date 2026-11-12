// Static master data — Company management: company roles, business domains,
// companies (with contact persons, addresses, bank details) and locations.
// All companies, people, e-mails, phone and account numbers are fictional
// demo values.
import { cityId, stateId, CITIES, STATES } from "./area";

export const COMPANY_ROLES = [
  { id: "6c1f3a52-8d2e-4b7a-9f10-2a5d7c9e1b01", name: "Manufacturer", description: "Original equipment manufacturer of IT, power and cooling assets.", isActive: true },
  { id: "b2e4d6f8-1a3c-4e5f-8a7b-3c4d5e6f7a02", name: "Customer", description: "Tenant or customer hosting equipment in the data centre.", isActive: true },
  { id: "9d8c7b6a-5f4e-4d3c-b2a1-0f9e8d7c6b03", name: "Service Provider", description: "Operations, maintenance or managed-services partner.", isActive: true },
  { id: "1e2d3c4b-5a69-4788-9a0b-1c2d3e4f5a04", name: "Vendor", description: "Supplier of spares, consumables and accessories.", isActive: true },
  { id: "7a6b5c4d-3e2f-4a1b-8c9d-0e1f2a3b4c05", name: "Colocation Tenant", description: "Customer renting racks or cages on a colocation contract.", isActive: true },
  { id: "4f5e6d7c-8b9a-4c0d-9e1f-2a3b4c5d6e06", name: "Facility Management", description: "Facility, security and housekeeping contractor.", isActive: false },
].map((r, i) => ({ ...r, createdAt: `2025-02-0${(i % 9) + 1}T10:00:00Z`, updatedAt: `2025-02-0${(i % 9) + 1}T10:00:00Z` }));

export const COMPANY_DOMAINS = [
  "Data Center Operations", "Cloud & Hosting", "Power & Electrical", "Cooling & HVAC", "Networking",
  "IT Hardware", "Storage", "Security & Surveillance", "Facility Services", "Telecom", "Managed Services", "Banking & Finance",
].map((domainName, i) => ({ id: i + 1, domainName, description: `${domainName} domain`, isActive: true, createdAt: `2025-02-${String(10 + i).padStart(2, "0")}T09:00:00Z`, updatedAt: `2025-02-${String(10 + i).padStart(2, "0")}T09:00:00Z` }));

const dom = (...ids) => ids.map((id) => COMPANY_DOMAINS.find((d) => d.id === id)).filter(Boolean).map((d) => ({ id: d.id, domainName: d.domainName }));

const addr = (cityName, line1, line2, pin, lat, lng, tz, phone, landmark = "") => {
  const city = CITIES.find((c) => c.name === cityName);
  const state = STATES.find((s) => s.id === city?.stateId);
  return {
    addressLine1: line1, addressLine2: line2, cityId: city?.id ?? null, stateId: state?.id ?? null,
    countryId: state?.countryId ?? null, pinCode: pin, landmark, latitude: lat, longitude: lng,
    timeZoneId: tz, locationContactNumber: phone,
    city: city?.name || "", state: state?.name || "",
  };
};

// [id, name, type, description, domains, contact persons, address, bank]
const RAW = [
  [1, "Dell Technologies", "Manufacturer", "Servers, storage and data-centre infrastructure.", dom(6, 7, 1),
    [["Rakesh Menon", "rakesh.menon@example.com", "+91 98100 21001"]], addr("Bengaluru", "Tech Park One, Block C", "Outer Ring Road", "560103", 12.9349, 77.6904, 1, "+91 80 4000 2001"), null],
  [2, "Cisco Systems", "Manufacturer", "Switching, routing and data-centre networking.", dom(5, 10),
    [["Priya Raghavan", "priya.raghavan@example.com", "+91 98100 21002"]], addr("Bengaluru", "Lakeview Business Park", "Tower 2", "560087", 12.9352, 77.6974, 1, "+91 80 4000 2002"), null],
  [3, "Hewlett Packard Enterprise", "Manufacturer", "Compute, storage and hybrid-cloud platforms.", dom(6, 7, 2),
    [["Vikram Shah", "vikram.shah@example.com", "+91 98100 21003"]], addr("Bengaluru", "Riverside Tech Park", "Block A", "560093", 12.9846, 77.6640, 1, "+91 80 4000 2003"), null],
  [4, "Lenovo", "Manufacturer", "ThinkSystem servers and edge computing.", dom(6),
    [["Anita Kulkarni", "anita.kulkarni@example.com", "+91 98100 21004"]], addr("Gurugram", "Cyber Park, Tower 9", "Phase II", "122002", 28.4950, 77.0890, 1, "+91 124 400 2004"), null],
  [5, "Juniper Networks", "Manufacturer", "Data-centre switching and security gateways.", dom(5),
    [["Sameer Joshi", "sameer.joshi@example.com", "+91 98100 21005"]], addr("Bengaluru", "Silver Oak Tech Park", "Marathahalli", "560103", 12.9411, 77.6950, 1, "+91 80 4000 2005"), null],
  [6, "Schneider Electric", "Manufacturer", "UPS, switchgear, PDUs and power management.", dom(3, 1),
    [["Anil Mehta", "anil.mehta@example.com", "+91 98100 21006"]], addr("Gurugram", "Industrial Area Phase IV", "Plot 9", "122015", 28.5035, 77.0838, 1, "+91 124 400 2006"), null],
  [7, "Vertiv", "Manufacturer", "Precision cooling, UPS and rack power.", dom(4, 3),
    [["Kavita Rao", "kavita.rao@example.com", "+91 98100 21007"]], addr("Mumbai", "Harbour Business Park", "Andheri East", "400093", 19.1136, 72.8697, 1, "+91 22 4000 2007"), null],
  [8, "Eaton", "Manufacturer", "Power distribution and power quality equipment.", dom(3),
    [["Nikhil Bansal", "nikhil.bansal@example.com", "+91 98100 21008"]], addr("Pune", "Eastgate IT Park, Cluster D", "Kharadi", "411014", 18.5515, 73.9476, 1, "+91 20 4000 2008"), null],
  [9, "Cummins", "Manufacturer", "Diesel generator sets for standby power.", dom(3),
    [["Sanjay Kulkarni", "sanjay.kulkarni@example.com", "+91 98100 21009"]], addr("Pune", "Highline Business Centre", "Baner", "411045", 18.5700, 73.7800, 1, "+91 20 4000 2009"), null],
  [10, "Carrier", "Manufacturer", "Chillers and HVAC plant equipment.", dom(4),
    [["Meera Iyer", "meera.iyer@example.com", "+91 98100 21010"]], addr("Gurugram", "Golf View Towers", "Sector 54", "122011", 28.4421, 77.1005, 1, "+91 124 400 2010"), null],
  [11, "Raritan", "Manufacturer", "Intelligent rack PDUs and environment sensors.", dom(3, 1),
    [["Deepak Nair", "deepak.nair@example.com", "+91 98100 21011"]], addr("Chennai", "Southern Tech Park", "Guindy", "600032", 13.0104, 80.2120, 1, "+91 44 4000 2011"), null],
  [12, "Fortinet", "Manufacturer", "Next-generation firewalls and network security.", dom(8, 5),
    [["Ritu Sharma", "ritu.sharma@example.com", "+91 98100 21012"]], addr("Mumbai", "Commerce Centre, G Block", "Bandra East", "400051", 19.0650, 72.8656, 1, "+91 22 4000 2012"), null],
  [13, "NetApp", "Manufacturer", "All-flash and hybrid storage arrays.", dom(7),
    [["Arjun Pillai", "arjun.pillai@example.com", "+91 98100 21013"]], addr("Bengaluru", "Greenfield Tech Campus", "Bellandur", "560103", 12.9279, 77.6830, 1, "+91 80 4000 2013"), null],
  [14, "Stulz", "Manufacturer", "Precision air-conditioning (PAC/CRAC) units.", dom(4),
    [["Farhan Qureshi", "farhan.qureshi@example.com", "+91 98100 21014"]], addr("Mumbai", "Mill Compound, Unit 14", "Lower Parel", "400013", 18.9984, 72.8301, 1, "+91 22 4000 2014"), null],
  [15, "Axis Communications", "Manufacturer", "Network cameras for CCTV surveillance.", dom(8),
    [["Neha Kapoor", "neha.kapoor@example.com", "+91 98100 21015"]], addr("New Delhi", "Commercial Complex, Block 4", "Kalkaji", "110019", 28.5494, 77.2530, 1, "+91 11 4000 2015"), null],
  [16, "Acme Technologies", "Customer", "Primary tenant — hosts the core production workloads.", dom(1, 2, 11),
    [["Rahul Verma", "rahul.verma@acmetech.example.com", "+91 98110 30001"], ["Sneha Gupta", "sneha.gupta@acmetech.example.com", "+91 98110 30002"]],
    addr("Noida", "Plot 12, Sector 62", "Institutional Area", "201309", 28.6270, 77.3727, 1, "+91 120 400 3001", "Near Metro Station"),
    ["Union Commercial Bank", "Acme Technologies", "50200012345678", "UCBK0001234", "Sector 62, Noida", "UCBKINBB", "", "Current"]],
  [17, "Tech Solutions Inc", "Customer", "Enterprise IT customer on dedicated racks.", dom(2, 6),
    [["Michael Brown", "michael.brown@techsolutions.example.com", "+1 408 555 0141"]],
    addr("San Francisco", "500 Market View Street", "Suite 400", "94105", 37.7880, -122.3960, 3, "+1 415 555 0100"),
    ["Bayview Trust Bank", "Tech Solutions Inc", "3300456789", "", "Market View Street", "BVTBUS6S", "", "Current"]],
  [18, "Data Center Inc", "Colocation Tenant", "Colocation customer with two private cages.", dom(1, 7),
    [["Jane Doe", "jane.doe@datacenterinc.example.com", "+1 214 555 0182"]],
    addr("Dallas", "2300 Commerce Street", "Floor 8", "75201", 32.7890, -96.7970, 4, "+1 214 555 0100"),
    ["Lone Star Commerce Bank", "Data Center Inc", "7700123456", "", "Commerce Street", "LSCBUS44", "", "Current"]],
  [19, "Cloud Solutions Ltd", "Colocation Tenant", "Public-cloud provider hosting edge zones.", dom(2, 10),
    [["Sarah Tan", "sarah.tan@cloudsolutions.example.com", "+65 6555 0193"]],
    addr("Singapore", "1 Innovation Way", "#12-01", "138632", 1.2990, 103.7870, 6, "+65 6555 0100"),
    ["Harbourfront Bank", "Cloud Solutions Ltd", "0721234567", "", "One-north", "HFBKSGSG", "", "Current"]],
  [20, "Northstar FinServ Ltd", "Customer", "Banking customer — DR racks and HSM cage.", dom(12, 8),
    [["Karan Malhotra", "karan.malhotra@northstar.example.com", "+91 98110 30004"]],
    addr("Mumbai", "Northstar House, Tower 2", "Lower Parel", "400013", 19.0020, 72.8280, 1, "+91 22 4000 3004"),
    ["Coastal Finance Bank", "Northstar FinServ Ltd", "000405012345", "CFBK0000004", "Lower Parel", "CFBKINBB", "", "Current"]],
  [21, "Prime Facility Services", "Service Provider", "24x7 facility operations and preventive maintenance.", dom(9, 1),
    [["Suresh Yadav", "suresh.yadav@primefacility.example.com", "+91 98110 30005"]],
    addr("Gurugram", "Sohna Road", "Sector 49", "122018", 28.4120, 77.0420, 1, "+91 124 400 3005"),
    ["Metro Cooperative Bank", "Prime Facility Services", "917020012345678", "MCBK0000123", "Sohna Road", "MCBKINBB", "", "Current"]],
  [22, "SecureGuard Systems", "Vendor", "Access control, CCTV installation and AMC.", dom(8, 9),
    [["Imran Khan", "imran.khan@secureguard.example.com", "+91 98110 30006"]],
    addr("Hyderabad", "Cyber Gateway, Block B", "Madhapur", "500081", 17.4504, 78.3808, 1, "+91 40 4000 3006"),
    ["Deccan Commercial Bank", "SecureGuard Systems", "38912345678", "DCBK0012345", "Madhapur", "DCBKINBB", "", "Current"]],
  [23, "Metro Civic Data Authority", "Customer", "Municipal e-governance workloads hosted in Hall B.", dom(2, 11),
    [["Alok Srivastava", "alok.srivastava@metrocivic.example.com", "+91 98110 30007"]],
    addr("New Delhi", "Civic Centre, Block E", "Minto Road", "110002", 28.6365, 77.2290, 1, "+91 11 4000 3007"),
    ["State Treasury Bank", "Metro Civic Data Authority", "10012345678901", "STBK0000107", "Minto Road", "STBKINBB", "", "Current"]],
  [24, "OpenGrid Research Foundation", "Customer", "Non-profit research archive on shared racks.", dom(7, 2),
    [["Lakshmi Narayanan", "lakshmi.n@opengrid.example.org", "+91 98110 30008"]],
    addr("Chennai", "Knowledge Park, Wing 2", "Taramani", "600113", 12.9863, 80.2432, 1, "+91 44 4000 3008"),
    ["Community Savings Bank", "OpenGrid Research Foundation", "60012345678", "CSBK0000608", "Taramani", "CSBKINBB", "", "Savings"]],
];

// Ownership type, used by the "All Types" filter on the Company list
// (Private / Public / Government / NGO).
const OWNERSHIP = {
  1: "Public", 2: "Public", 3: "Public", 4: "Public", 5: "Public", 6: "Public", 7: "Public", 8: "Public",
  9: "Public", 10: "Public", 11: "Private", 12: "Public", 13: "Public", 14: "Private", 15: "Private",
  16: "Private", 17: "Private", 18: "Private", 19: "Public", 20: "Public", 21: "Private", 22: "Private",
  23: "Government", 24: "NGO",
};

export const COMPANIES = RAW.map(([id, companyName, companyType, companyDescription, companyDomains, contacts, address, bank], i) => {
  const createdAt = `2025-03-${String(1 + (i % 28)).padStart(2, "0")}T10:${String((i * 5) % 60).padStart(2, "0")}:00Z`;
  return {
    id, companyName, companyType, companyDescription,
    ownershipType: OWNERSHIP[id] || "Private",
    isDeleted: id === 22 ? true : false,
    createdAt, updatedAt: createdAt,
    companyDomains,
    contactPersons: contacts.map(([userName, userPrimaryEmail, userPrimaryPhoneNumber], j) => ({
      id: id * 10 + j, companyId: id, userName, userPrimaryEmail, userSecondaryEmail: "",
      userPrimaryPhoneNumber, userSecondaryPhoneNumber: "", isPrimary: j === 0, images: [], documents: [],
    })),
    companyAddresses: [{ id: id * 10, companyId: id, ...address, images: [], documents: [] }],
    bankDetails: bank ? [{
      id: id * 10, companyId: id, bankName: bank[0], accountHolderName: bank[1], accountNumber: bank[2],
      ifscCode: bank[3], branchName: bank[4], swiftCode: bank[5], iban: bank[6], accountType: bank[7],
      isPrimary: true, images: [], documents: [],
    }] : [],
    images: [],
    documents: [],
  };
});

// Company locations (Locations API)
const LOCATION_ROWS = [
  [16, "Head Office", "Noida", "Plot 12, Sector 62", "Institutional Area", "201309", 28.6270, 77.3727, "+91 120 400 3001", "Near Metro Station"],
  [16, "Data Center", "Navi Mumbai", "MIDC Industrial Area", "Building 4", "400710", 19.1170, 73.0270, "+91 22 4000 3011", "Off Thane-Belapur Road"],
  [16, "Branch Office", "Bengaluru", "Golf Links Business Park", "Domlur", "560071", 12.9540, 77.6430, "+91 80 4000 3012", ""],
  [17, "Head Office", "San Francisco", "500 Market View Street", "Suite 400", "94105", 37.7880, -122.3960, "+1 415 555 0100", ""],
  [17, "Data Center", "Santa Clara", "2800 Valley Tech Drive", "", "95050", 37.3700, -121.9500, "+1 408 555 0120", ""],
  [18, "Data Center", "Dallas", "2300 Commerce Street", "Floor 8", "75201", 32.7890, -96.7970, "+1 214 555 0100", ""],
  [19, "Head Office", "Singapore", "1 Innovation Way", "#12-01", "138632", 1.2990, 103.7870, "+65 6555 0100", ""],
  [20, "Head Office", "Mumbai", "Northstar House, Tower 2", "Lower Parel", "400013", 19.0020, 72.8280, "+91 22 4000 3004", ""],
  [20, "DR Site", "Chennai", "Ambattur Industrial Estate", "Block 3", "600058", 13.0980, 80.1620, "+91 44 4000 3013", ""],
  [21, "Head Office", "Gurugram", "Sohna Road", "Sector 49", "122018", 28.4120, 77.0420, "+91 124 400 3005", ""],
  [1, "Regional Office", "Bengaluru", "Tech Park One, Block C", "Outer Ring Road", "560103", 12.9349, 77.6904, "+91 80 4000 2001", ""],
  [6, "Service Centre", "Gurugram", "Industrial Area Phase IV", "Plot 9", "122015", 28.5035, 77.0838, "+91 124 400 2006", ""],
];

export const COMPANY_LOCATIONS = LOCATION_ROWS.map(([companyId, locationType, cityName, addressLine1, addressLine2, pinCode, latitude, longitude, locationContactNumber, landmark], i) => {
  const city = CITIES.find((c) => c.name === cityName);
  const state = STATES.find((s) => s.id === city?.stateId);
  return {
    id: i + 1, companyId, locationType, addressLine1, addressLine2,
    countryId: state?.countryId ?? null, stateId: state?.id ?? null, cityId: city?.id ?? null,
    pinCode, landmark, latitude, longitude, timeZoneId: state?.countryId === 1 ? 1 : state?.countryId === 4 ? 6 : state?.countryId === 2 ? 3 : 1,
    locationContactNumber, images: [], documents: [], isDeleted: false,
    createdAt: `2025-04-${String(1 + i).padStart(2, "0")}T09:30:00Z`, updatedAt: `2025-04-${String(1 + i).padStart(2, "0")}T09:30:00Z`,
  };
});

export { cityId, stateId };
