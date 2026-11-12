import { useEffect, useState, useCallback, useRef } from "react";
import {
    Table, Row, Col, Space, Button, Select, Input,
    Tooltip, Badge, Form, message, Card, Popconfirm, Spin, Pagination,
} from "antd";
import React from "react";
import {
    EditOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined,
    SearchOutlined, BankOutlined, UserOutlined,
    EnvironmentOutlined, AppstoreOutlined,
    EyeOutlined, ClockCircleOutlined, ImportOutlined, ApiOutlined
} from "@ant-design/icons";
import { HistoryOutlined, CrownOutlined } from "@ant-design/icons";

import dayjs from "dayjs";

import { T, LOCKED_SECTIONS, BASE_URL } from "./constant";
import {
    toArray, normalizeCompanyListItem, normalizeCompanyDetail,
    normalizeContact, normalizeAddress, normalizeBank,
    normalizeImg, normalizeDoc, emptyLocation, emptyContact,
    emptyAddress, emptyBank,
    appendImages, appendDocuments, buildCompanyFormData,
} from "./helpers";


import StatCard from "./statscard";
import EmptyState from "./Emptystate";
import CompanyModal from "./companymodel";
import LocationModal from "./location";
import TimezoneModal from "./timezone";
import DomainModal from "./Domainmodel";
import CompanyDetailModal from "./companydetails";
import ImportCompanyModal from "./dxf";
import AuditWidget from "../entity/livetoaster";
// import AuditWidget2       from "../pages/notify";
import SuccessModal from "../entity/popUp";
// import CompanyImagesSection, { uploadAllPendingImages } from "./companyimage";
// import { uploadAllPendingDocs } from "./companydocument";
// import ImportWithFieldMapper from "../filehandle/fieldselection";
import ExcelExport from "../entity/excelexport";
import InlineHistoryPanel from "./historyinline";
import CompanyDevicesModal from "./companydeviceModel";
import { uploadEntityFiles } from "./filestore";
import axiosInstance, { axiosdevice } from "../../config";
import CompanyRole from "./CompanyRole";

const { Option } = Select;
const PAGE_SIZE = 10;

// ─── PaginationBar ────────────────────────────────────────────────────────────
function PaginationBar({ page, pageSize, total, onChange }) {
    return (
        <div style={{
            display: "flex", justifyContent: "flex-end", alignItems: "center",
            padding: "10px 16px",
            borderTop: "1px solid #F3F4F6",
            background: "#FAFAFA",
        }}>
            <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                size="small"
                showTotal={(t) => `Total ${t} items`}
                onChange={onChange}
                showSizeChanger={false}
            />
        </div>
    );
}






// ─── Column builders ──────────────────────────────────────────────────────────
function buildTimezoneColumns({ countries, setEditingTimeZone, timeZoneForm, setShowTimeZoneModal, handleTimeZoneDelete }) {
    const getCountryName = (id) => countries.find((c) => c.id === id)?.name || "—";
    return [
        {
            title: "ID",
            key: "id",
            width: 60,
            render: (_, __, index) => (
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                    {index + 1}
                </span>
            )
        },
        { title: "Timezone Name", dataIndex: "timeZoneName", key: "name", render: (n) => <Space><ClockCircleOutlined style={{ color: T.blue.text }} /><span style={{ fontSize: 12 }}>{n || "—"}</span></Space> },
        { title: "UTC Offset", dataIndex: "utcOffset", key: "offset", width: 130, render: (o) => o ? <span style={{ background: T.purple.bg, color: T.purple.text, fontSize: 11, padding: "2px 8px", borderRadius: 99, border: `1px solid ${T.purple.border}`, fontWeight: 600 }}>{o}</span> : "—" },
        { title: "Country", dataIndex: "countryId", key: "country", width: 150, render: (id) => <span style={{ fontSize: 12 }}>{getCountryName(id)}</span> },
        {
            title: "Actions", key: "actions", width: 110, fixed: "right",
            render: (_, r) => (
                <Space>
                    <Button icon={<EditOutlined />} size="small" onClick={() => { setEditingTimeZone(r); timeZoneForm.setFieldsValue(r); setShowTimeZoneModal(true); }} />
                    <Popconfirm title="Delete this timezone?" onConfirm={() => handleTimeZoneDelete(r.id)} okText="Delete" okButtonProps={{ danger: true }}>
                        <Button danger icon={<DeleteOutlined />} size="small" />
                    </Popconfirm>
                </Space>
            ),
        },
    ];
}

function buildDomainColumns({ companies, setEditingDomain, domainForm, setShowDomainModal, handleDomainDelete }) {
    return [
        // { title: "ID", dataIndex: "id", key: "id", width: 60, render: (id) => <span style={{ fontSize: 12, color: "#9CA3AF" }}>{id}</span> },
        {
            title: "ID",
            key: "id",
            width: 60,
            render: (_, __, index) => (
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                    {index + 1}
                </span>
            )
        },
        {
            title: "Domain Name", dataIndex: "domainName", key: "name",
            render: (n) => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: T.radius.md, background: T.purple.bg, border: `1px solid ${T.purple.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <AppstoreOutlined style={{ color: T.purple.text, fontSize: 14 }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{n || "—"}</span>
                </div>
            ),
        },
        {
            title: "Companies Using", key: "usage", width: 160,
            render: (_, r) => {
                const count = companies.filter((c) => (c.companyDomains || []).some((d) => d.id === r.id || d === r.id)).length;
                return count > 0
                    ? <span style={{ background: T.blue.bg, color: T.blue.text, fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 99, border: `1px solid ${T.blue.border}` }}>{count} {count === 1 ? "company" : "companies"}</span>
                    : <span style={{ color: "#D1D5DB", fontSize: 12 }}>None</span>;
            },
        },
        {
            title: "Actions", key: "actions", width: 110, fixed: "right",
            render: (_, r) => (
                <Space>
                    <Button icon={<EditOutlined />} size="small" onClick={() => { setEditingDomain(r); domainForm.setFieldsValue(r); setShowDomainModal(true); }} />
                    <Popconfirm title="Delete this domain?" onConfirm={() => handleDomainDelete(r.id)} okText="Delete" okButtonProps={{ danger: true }}>
                        <Button danger icon={<DeleteOutlined />} size="small" />
                    </Popconfirm>
                </Space>
            ),
        },
    ];
}

// ─── Main Company Component ───────────────────────────────────────────────────
function Company() {

    const [expandedHistoryId, setExpandedHistoryId] = useState(null);

    const [showCompanyRoleGrid, setShowCompanyRoleGrid] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [modalFetching, setModalFetching] = useState(false);

    const [countries, setCountries] = useState([]);
    const [docTypes, setDocTypes] = useState([]);
    const [issuers, setIssuers] = useState([]);

    // ── Timezones ──
    const [timezones, setTimezones] = useState([]);
    const [tzPage, setTzPage] = useState(1);
    const [tzTotal, setTzTotal] = useState(0);
    const tzPageRef = useRef(1);   // ref so fetch callbacks always see latest page

    // ── Domains ──
    const [domains, setDomains] = useState([]);
    const [domainPage, setDomainPage] = useState(1);
    const [domainTotal, setDomainTotal] = useState(0);
    const domainPageRef = useRef(1);

    // ── Companies ──
    const [companies, setCompanies] = useState([]);
    const [filteredCompanies, setFilteredCompanies] = useState([]);
    const [companyPage, setCompanyPage] = useState(1);
    const [companyTotal, setCompanyTotal] = useState(0);
    const companyPageRef = useRef(1);

    // Search/filter kept in refs too, so fetch callbacks always read latest
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const searchRef = useRef("");
    const typeRef = useRef("all");

    const [showDomainGrid, setShowDomainGrid] = useState(false);
    const [showTimeZoneGrid, setShowTimeZoneGrid] = useState(false);

    const [showDomainModal, setShowDomainModal] = useState(false);
    const [editingDomain, setEditingDomain] = useState(null);
    const [domainSearch, setDomainSearch] = useState("");
    const [domainForm] = Form.useForm();

    const [showTimeZoneModal, setShowTimeZoneModal] = useState(false);
    const [editingTimeZone, setEditingTimeZone] = useState(null);
    const [tzSearch, setTzSearch] = useState("");
    const [timeZoneForm] = Form.useForm();

    const [showCompanyModal, setShowCompanyModal] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const [companyForm] = Form.useForm();
    const [activeSection, setActiveSection] = useState("basic");

    const [liveCompanyName, setLiveCompanyName] = useState("");
    const [liveCompanyType, setLiveCompanyType] = useState("");
    const [liveCompanyDescription, setLiveCompanyDescription] = useState("");
    const basicInfoFilled = !!(liveCompanyName?.trim() && liveCompanyType?.trim());

    const [contacts, setContacts] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [banks, setBanks] = useState([]);
    const [companyImages, setCompanyImages] = useState([]);
    const [companyDocs, setCompanyDocs] = useState([]);
    const [selectedDomainIds, setSelectedDomainIds] = useState([]);

    const [showLocationModal, setShowLocationModal] = useState(false);
    const [assigningCompany, setAssigningCompany] = useState(null);
    const [assignLocations, setAssignLocations] = useState([]);
    const [locationLoading, setLocationLoading] = useState(false);
    const [savingLocIdx, setSavingLocIdx] = useState(null);
    const [deletingLocId, setDeletingLocId] = useState(null);

    const [selectedCompany, setSelectedCompany] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailTab, setDetailTab] = useState("overview");
    const [companyLocations, setCompanyLocations] = useState([]);
    const [companyBanks, setCompanyBanks] = useState([]);
    const [detailDomains, setDetailDomains] = useState([]);

    const [showImportModal, setShowImportModal] = useState(false);
    const [successVisible, setSuccessVisible] = useState(false);
    const [successType, setSuccessType] = useState("add");

    ///////////////////////////////////////////////files export
    const [companiesfile, setCompaniesfile] = useState([])

    ///////
    const [showDevicesModal, setShowDevicesModal] = useState(false);
    const [devicesCompany, setDevicesCompany] = useState(null);

    // state ke saath yeh ref add karo
    const assignLocationsRef = useRef([]);
    useEffect(() => {
        assignLocationsRef.current = assignLocations;
    }, [assignLocations]);
    /**
  * Company.jsx mein ExcelExport ka CORRECT usage
  *
  * Raw API /Company response shape:
  * [
  *   {
  *     company: { id, companyName, companyType, companyDescription, createdAt, ... },
  *     contactPersons:   [ { userName, userEmail, userPrimaryEmail, userPrimaryPhoneNumber, ... } ],
  *     companyAddresses: [ { addressLine1, addressLine2, city, state, country, pinCode, ... } ],
  *     bankDetails:      [ { bankName, accountNumber, ifscCode, branchName, ... } ],
  *     companyDomain:    [ { domainName, ... } ],
  *     images:           [],
  *     documents:        [],
  *   }
  * ]
  *
  * STEP 1 — fetchcompany mein response debug karo (ek baar):
  */

    // ── debug helper — remove after confirming field names ──────────────────────
    const debugCompanyFields = (arr) => {
        if (!arr?.length) return;
        const first = arr[0];
        console.group("📋 Company raw API field names");
        console.log("company keys:", Object.keys(first.company || {}));
        console.log("contactPersons[0]:", first.contactPersons?.[0] || "empty");
        console.log("companyAddresses[0]:", first.companyAddresses?.[0] || "empty");
        console.log("bankDetails[0]:", first.bankDetails?.[0] || "empty");
        console.groupEnd();
    };

    // ── fetchcompany — call debug once ──────────────────────────────────────────
    const fetchcompany = async () => {
        try {
            const res = await axiosInstance.get('/Company/get-all-company');
            // Handle both raw axios and interceptor-unwrapped response
            const raw = res?.data ?? res;
            // API returns { totalRecords, data: [...] } or plain array
            const arr = Array.isArray(raw)
                ? raw
                : Array.isArray(raw?.data) ? raw.data
                    : Array.isArray(raw?.items) ? raw.items
                        : [];

            debugCompanyFields(arr); // ← remove after confirming
            setCompaniesfile(arr);
        } catch (error) {
            console.error("fetchcompany error:", error);
        }
    };

    // ── ExcelExport usage — all possible field name variants covered ─────────────
    // After running once, check console → use exact field names → remove fallbacks

    const getExportData = (companiesfile) =>
        companiesfile.map((item, index) => {
            const co = item?.company || item || {};
            const cp = item?.contactPersons?.[0] || {};
            const addr = item?.companyAddresses?.[0] || {};
            const bank = item?.bankDetails?.[0] || {};

            return {
                "S.No": index + 1,

                // ── Company ──────────────────────────────────────────────────────
                "Company Name": co.companyName || "",
                "Company Type": co.companyType || "",
                "Description": co.companyDescription || "",
                "Created At": co.createdAt
                    ? new Date(co.createdAt).toLocaleDateString("en-IN")
                    : "",

                // ── Contact Person (first) ────────────────────────────────────
                // Try multiple possible field names (check console to confirm which one works)
                "Contact Name": (
                    cp.userName ||
                    cp.contactName ||
                    cp.name ||
                    cp.fullName ||
                    `${cp.firstName || ""} ${cp.lastName || ""}`.trim() ||
                    ""
                ),
                "Designation": cp.designation || cp.userDesignation || "",
                "Primary Email": (
                    cp.userPrimaryEmail ||
                    cp.primaryEmail ||
                    cp.email ||
                    cp.contactEmail ||
                    ""
                ),
                "Primary Phone": (
                    cp.userPrimaryPhoneNumber ||
                    cp.primaryPhone ||
                    cp.phone ||
                    cp.contactPhone ||
                    cp.mobileNumber ||
                    ""
                ),

                // ── Address (first) ───────────────────────────────────────────
                "Address Line 1": addr.addressLine1 || addr.address1 || "",
                "Address Line 2": addr.addressLine2 || addr.address2 || "",
                "City": addr.city || addr.cityName || "",
                "State": addr.state || addr.stateName || "",
                "Country": addr.country || addr.countryName || "",
                "Pin Code": addr.pinCode || addr.zipCode || addr.postalCode || "",

                // ── Bank (first) ──────────────────────────────────────────────
                "Bank Name": bank.bankName || bank.bank || "",
                "Account Number": bank.accountNumber || bank.accNumber || "",
                "IFSC Code": bank.ifscCode || bank.ifsc || "",
                "Branch Name": bank.branchName || bank.branch || "",
            };
        });

    // ── JSX usage in Company.jsx header ─────────────────────────────────────────
    /*
    
    */

    // ── WHAT TO DO ───────────────────────────────────────────────────────────────
    // 1. Replace your fetchcompany with the one above (has debugCompanyFields call)
    // 2. Replace ExcelExport usage with getExportData(companiesfile)
    // 3. Open browser console → expand "📋 Company raw API field names"
    // 4. Check contactPersons[0], companyAddresses[0], bankDetails[0] actual keys
    // 5. Update getExportData to use only the correct keys (remove fallbacks)
    // 6. Remove debugCompanyFields call

    // ── Fetch functions (read from refs — no stale-closure problems) ──────────

    const fetchCountries = async () => {
        try { setCountries(toArray(await axiosInstance.get("/Country/get-country"))); } catch { }
    };
    const fetchDocTypes = async () => {
        try { setDocTypes(toArray(await axiosdevice.get("/DocumentMaster/document-types"))); } catch { }
    };
    const fetchIssuers = async () => {
        try { setIssuers(toArray(await axiosdevice.get("/DocumentMaster/issued-by"))); } catch { }
    };

    // ── Shared envelope parser — handles all API response shapes ────────────
    // Shape A (your API): { totalRecords, totalPages, data: [...] }
    // Shape B:            { items: [...], totalCount: N }
    // Shape C:            plain array
    const parsePagedResponse = (raw) => {
        const envelope =
            raw?.totalRecords !== undefined ? raw
                : raw?.data?.totalRecords !== undefined ? raw.data
                    : raw?.data !== undefined ? raw.data
                        : raw;

        if (Array.isArray(envelope)) {
            return { rows: envelope, total: envelope.length };
        }
        if (Array.isArray(envelope?.data)) {
            return { rows: envelope.data, total: envelope.totalRecords ?? envelope.totalCount ?? envelope.total ?? envelope.data.length };
        }
        if (Array.isArray(envelope?.items)) {
            return { rows: envelope.items, total: envelope.totalCount ?? envelope.total ?? envelope.items.length };
        }
        const rows = toArray(envelope);
        return { rows, total: rows.length };
    };

    const fetchTimezones = async (p) => {
        const page = p ?? tzPageRef.current;
        try {
            const raw = await axiosInstance.get(`/TimeZone/get-all-timezone?Page=${page}&PageSize=${10}`);
            const { rows, total } = parsePagedResponse(raw);
            console.log("[fetchTimezones] page=", page, "rows=", rows.length, "total=", total);
            setTimezones(rows);
            setTzTotal(total);
        } catch (err) { console.error("[fetchTimezones]", err); }
    };

    const fetchDomains = async (p) => {
        const page = p ?? domainPageRef.current;
        try {
            const raw = await axiosInstance.get(`/CompanyDomain/get-all-domain?Page=${page}&PageSize=${PAGE_SIZE}`);
            const { rows, total } = parsePagedResponse(raw);
            console.log("[fetchDomains] page=", page, "rows=", rows.length, "total=", total);
            setDomains(rows);
            setDomainTotal(total);
        } catch (err) { console.error("[fetchDomains]", err); }
    };

    const fetchCompanies = async (p, search, type) => {
        const page = p ?? companyPageRef.current;
        const term = search ?? searchRef.current;
        const filter = type ?? typeRef.current;

        setLoading(true);
        try {
            let url = `/company/get-all-company?Page=${page}&PageSize=${PAGE_SIZE}`;
            if (term) url += `&search=${encodeURIComponent(term)}`;
            if (filter && filter !== "all") url += `&companyType=${encodeURIComponent(filter)}`;

            const raw = await axiosInstance.get(url);
            let { rows, total } = parsePagedResponse(raw);

            // Company API wraps each row: { company:{...}, contactPersons:[...], ... }
            // Flatten so normalizeCompanyListItem gets a clean object
            rows = rows.map((item) =>
                item?.company
                    ? {
                        ...item.company,
                        isDeleted: item.company.isDeleted,
                        contactPersons: item.contactPersons ?? [],
                        companyAddresses: item.companyAddresses ?? [],
                        bankDetails: item.bankDetails ?? [],
                        images: item.images ?? [],
                        documents: item.documents ?? [],
                        companyDomains: item.companyDomain ?? item.companyDomains ?? [],
                    }
                    : item
            );
            console.log("were", raw)

            console.log("[fetchCompanies] page=", page, "rows=", rows.length, "total=", rows);
            console.log("kkk", rows)
            const arr = rows.map(normalizeCompanyListItem);
            console.log(arr, "xyzz")
            setCompanies(arr);
            setFilteredCompanies(arr);
            setCompanyTotal(total);

        } catch (err) {
            console.error("[fetchCompanies] error", err);
            message.error("Failed to load companies.");
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanyById = async (id) => {
        const raw = await axiosInstance.get(`/Company/get-company/${id}`);
        // Step 1: unwrap axios interceptor
        const envelope = raw?.data !== undefined ? raw.data : raw;
        // Step 2: unwrap the nested { company:{...}, contactPersons:[] } wrapper
        const flat = envelope?.company
            ? {
                ...envelope.company,          // id, companyName, companyType, etc.
                contactPersons: envelope.contactPersons ?? [],
                companyAddresses: envelope.companyAddresses ?? [],
                bankDetails: envelope.bankDetails ?? [],
                images: envelope.images ?? [],
                documents: envelope.documents ?? [],
                companyDomains: envelope.companyDomains ?? [],
            }
            : envelope;
        return normalizeCompanyDetail(flat);
    };

    // const fetchCompanyDomains = async (companyId) => {
    //     try {
    //         const raw = await axiosInstance.get(`/CompanyDomain/get-domain-by-company${companyId}/companies`);
    //         console.log("cwujef ",raw)
    //         return toArray(raw?.data !== undefined ? raw.data : raw);
    //     } catch { return []; }
    // };
    const fetchCompanyDomains = async (companyId) => {
        try {
            const url = `/CompanyDomain/get-domain-by-company/${companyId}/companies`;
            console.log("📡 Fetching domains for company:", companyId);
            console.log("📡 URL:", url);

            const raw = await axiosInstance.get(url);
            console.log("📡 Raw response:", raw);

            // Check different response shapes
            const data = raw?.data !== undefined ? raw.data : raw;
            console.log("📡 Data:", data);

            // Try to extract array
            let result = [];
            if (Array.isArray(data)) {
                result = data;
            } else if (Array.isArray(data?.data)) {
                result = data.data;
            } else if (Array.isArray(data?.items)) {
                result = data.items;
            } else if (data?.companyDomain) {
                result = data.companyDomain;
            } else if (data?.companyDomains) {
                result = data.companyDomains;
            }

            console.log("📡 Extracted domains:", result);
            return result;
        } catch (error) {
            console.error("❌ fetchCompanyDomains error:", error);
            console.error("❌ Status:", error.response?.status);
            console.error("❌ Data:", error.response?.data);
            return [];
        }
    };

    // ── On mount ──
    useEffect(() => {
        // Sync refs with initial state values
        searchRef.current = searchTerm;
        typeRef.current = typeFilter;
        companyPageRef.current = 1;
        fetchCountries(); fetchDocTypes(); fetchIssuers();
        fetchTimezones(1);
        fetchDomains(1);
        fetchCompanies(1);
        fetchcompany();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Search / filter change → reset to page 1 (skip on first mount) ──
    // const isFirstRender = useRef(true);
    // useEffect(() => {
    //     if (isFirstRender.current) { isFirstRender.current = false; return; }
    //     searchRef.current      = searchTerm;
    //     typeRef.current        = typeFilter;
    //     companyPageRef.current = 1;
    //     setCompanyPage(1);
    //     fetchCompanies(1, searchTerm, typeFilter);
    // }, [searchTerm, typeFilter]); // eslint-disable-line react-hooks/exhaustive-deps
    // YEH POORA BLOCK HATAO — ab directly handle ho raha hai
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        searchRef.current = searchTerm;
        typeRef.current = typeFilter;
        companyPageRef.current = 1;
        setCompanyPage(1);
        fetchCompanies(1, searchTerm, typeFilter);
    }, [searchTerm, typeFilter]);

    // ── Pagination handlers (update both ref and state) ───────────────────────
    const handleCompanyPageChange = (p) => {
        console.log("[pagination] company page clicked →", p);
        companyPageRef.current = p;
        setCompanyPage(p);
        fetchCompanies(p);
    };

    const handleTzPageChange = (p) => {
        tzPageRef.current = p;
        setTzPage(p);
        fetchTimezones(p);
    };

    const handleDomainPageChange = (p) => {
        domainPageRef.current = p;
        setDomainPage(p);
        fetchDomains(p);
    };

    // ── Modal helpers ─────────────────────────────────────────────────────────
    const resetModal = () => {
        companyForm.resetFields();
        setContacts([]); setAddresses([]); setBanks([]);
        setCompanyImages([]); setCompanyDocs([]); setSelectedDomainIds([]);
        setActiveSection("basic");
        setLiveCompanyName(""); setLiveCompanyType(""); setLiveCompanyDescription("");
    };

    const openAddCompany = () => {

        setEditingCompany(null); resetModal(); setShowCompanyModal(true);
    };

    const openEditCompany = async (record) => {
        if (record.isDeleted) {
            message.error("This company has been deleted and cannot be edited.");
            return;  // ← early return, koi API call nahi
        }
        setEditingCompany({ id: record.id, companyName: record.companyName });
        resetModal(); setShowCompanyModal(true); setModalFetching(true);
        try {
            const [detail, assignedDomains] = await Promise.all([
                fetchCompanyById(record.id),
                fetchCompanyDomains(record.id),
            ]);
            const cName = detail.companyName || "", cType = detail.companyType || "", cDesc = detail.companyDescription || "";
            companyForm.setFieldsValue({ companyName: cName, companyType: cType, companyDescription: cDesc });
            setLiveCompanyName(cName); setLiveCompanyType(cType); setLiveCompanyDescription(cDesc);
            setContacts((detail.contactPersons || []).map(normalizeContact));
            setAddresses((detail.companyAddresses || []).map(normalizeAddress));
            setBanks((detail.bankDetails || []).map(normalizeBank));
            setCompanyImages((detail.images || []).map(normalizeImg));
            setCompanyDocs((detail.documents || []).map(normalizeDoc));
            setSelectedDomainIds(assignedDomains.map((d) => d.id).filter(Boolean));
            setEditingCompany(detail);
        } catch { message.error("Failed to load company details."); }
        finally { setModalFetching(false); }
    };

    const closeCompanyModal = () => { setShowCompanyModal(false); setEditingCompany(null); resetModal(); };

    const companyDocsRef = useRef(companyDocs);
    useEffect(() => { companyDocsRef.current = companyDocs; }, [companyDocs]);
    const companyImagesRef = useRef(companyImages);
    useEffect(() => { companyImagesRef.current = companyImages; }, [companyImages]);



    // ✅ FIXED handleCompanySubmit — Proper ID extraction + Upload logic
    const handleCompanySubmit = async () => {
        try {
            companyForm.setFieldsValue({
                companyName: liveCompanyName,
                companyType: liveCompanyType,
                companyDescription: liveCompanyDescription
            });
            const values = await companyForm.validateFields();
            values.companyName = liveCompanyName;
            values.companyType = liveCompanyType;
            values.companyDescription = liveCompanyDescription;

            setSubmitting(true);

            const formData = await buildCompanyFormData({
                values, contacts, addresses, banks,
                companyImages: [], companyDocs: [],
                domainIds: selectedDomainIds
            });

            let savedCompanyId = editingCompany?.id;
            let savedResponse = null;

            if (editingCompany?.id) {
                const res = await axiosInstance.post(`/Company/update-company/${editingCompany.id}`, formData);
                savedResponse = res?.data !== undefined ? res.data : res;
                setSuccessType("edit");
            } else {
                const res = await axiosInstance.post("/Company/add-company", formData);
                savedResponse = res?.data !== undefined ? res.data : res;
                savedCompanyId = savedResponse?.company?.id ?? savedResponse?.id ?? null;
                setSuccessType("add");
            }

            // ── Safe ID extraction ──────────────────────────────────────────────
            // Bug fix: empty array [] is truthy, so "|| contacts.map(...)" always ran.
            // Now we check .length > 0 before deciding which source to use.

            const finalCompanyId = savedCompanyId
                ?? savedResponse?.company?.id
                ?? editingCompany?.id;

            const responseContacts = savedResponse?.contactPersons || [];
            const responseAddresses = savedResponse?.companyAddresses || [];
            const responseBanks = savedResponse?.bankDetails || [];

            // For each sub-entity: prefer the ID returned in the response for that
            // index; fall back to the existing state ID (edit case where backend
            // doesn't re-echo the full sub-entity list).
            const resolveId = (responseArr, stateArr, index) =>
                responseArr[index]?.id ?? stateArr[index]?.id ?? null;

            // ── Upload company-level files ──────────────────────────────────────
            if (finalCompanyId) {
                try {
                    await uploadEntityFiles({
                        entityName: "Company",   // ← verify this matches your FileStore API
                        entityId: finalCompanyId,
                        images: companyImagesRef.current,
                        docs: companyDocsRef.current,
                        onSuccess: (imgs, docs) => {
                            if (imgs + docs > 0)
                                message.success(`Company: ${imgs} image(s), ${docs} doc(s) uploaded`);
                        },
                        onFileError: (fileName) => message.error(`Company file "${fileName}" failed`),
                    });
                } catch (err) {
                    console.error("Company file upload error:", err);
                }
            }

            // ── Upload ContactPerson files ──────────────────────────────────────
            for (let i = 0; i < contacts.length; i++) {
                const ct = contacts[i];
                const ctId = resolveId(responseContacts, contacts, i);

                const hasNewFiles = (ct.images || []).some(img => !!img._file)
                    || (ct.documents || []).some(doc => !!doc._file);

                if (!ctId) {
                    console.warn(`ContactPerson[${i}] — no ID, skipping file upload`);
                    continue;
                }
                if (!hasNewFiles) continue;

                try {
                    await uploadEntityFiles({
                        entityName: "UserProfile",  // ← change to match your FileStore entity name
                        entityId: ctId,
                        images: ct.images || [],
                        docs: ct.documents || [],
                        onSuccess: (imgs, docs) => {
                            if (imgs + docs > 0)
                                message.success(`Contact ${i + 1}: ${imgs} img, ${docs} doc`);
                        },
                        onFileError: (f) => message.error(`Contact ${i + 1}: "${f}" failed`),
                    });
                } catch (err) {
                    console.error(`ContactPerson[${i}] upload failed:`, err);
                }
            }

            // ── Upload CompanyAddress files ─────────────────────────────────────
            for (let i = 0; i < addresses.length; i++) {
                const addr = addresses[i];
                const addrId = resolveId(responseAddresses, addresses, i);

                const hasNewFiles = (addr.images || []).some(img => !!img._file)
                    || (addr.documents || []).some(doc => !!doc._file);

                if (!addrId) {
                    console.warn(`CompanyAddress[${i}] — no ID, skipping`);
                    continue;
                }
                if (!hasNewFiles) continue;

                try {
                    await uploadEntityFiles({
                        entityName: "CompanyAddress",  // ← change to match your FileStore entity name
                        entityId: addrId,
                        images: addr.images || [],
                        docs: addr.documents || [],
                        onSuccess: (imgs, docs) => {
                            if (imgs + docs > 0)
                                message.success(`Address ${i + 1}: ${imgs} img, ${docs} doc`);
                        },
                        onFileError: (f) => message.error(`Address ${i + 1}: "${f}" failed`),
                    });
                } catch (err) {
                    console.error(`CompanyAddress[${i}] upload failed:`, err);
                }
            }

            // ── Upload BankDetail files ─────────────────────────────────────────
            for (let i = 0; i < banks.length; i++) {
                const bank = banks[i];
                const bankId = resolveId(responseBanks, banks, i);

                const hasNewFiles = (bank.images || []).some(img => !!img._file)
                    || (bank.documents || []).some(doc => !!doc._file);

                if (!bankId) {
                    console.warn(`BankDetail[${i}] — no ID, skipping`);
                    continue;
                }
                if (!hasNewFiles) continue;

                try {
                    await uploadEntityFiles({
                        entityName: "BankDetail",  // ← change to match your FileStore entity name
                        entityId: bankId,
                        images: bank.images || [],
                        docs: bank.documents || [],
                        onSuccess: (imgs, docs) => {
                            if (imgs + docs > 0)
                                message.success(`Bank ${i + 1}: ${imgs} img, ${docs} doc`);
                        },
                        onFileError: (f) => message.error(`Bank ${i + 1}: "${f}" failed`),
                    });
                } catch (err) {
                    console.error(`BankDetail[${i}] upload failed:`, err);
                }
            }

            fetchCompanies(companyPageRef.current);
            closeCompanyModal();
            setSuccessVisible(true);

        } catch (err) {
            if (err?.errorFields) {
                message.error("Company Name and Type are required.");
                setActiveSection("basic");
            } else {
                message.error(err?.response?.data?.message || err?.message || "Failed to save company.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleCompanyDelete = async (id) => {
        const company = companies.find(c => c.id === id);
        if (company?.isDeleted) {
            message.error("Company already deleted.");
            return;
        }
        setDeleteLoading(true);
        try {
            await axiosInstance.post(`/remove-company/${id}`);
            message.success("Company deleted.");
            // If last item on page, go back one page
            const newPage = companies.length === 1 && companyPageRef.current > 1
                ? companyPageRef.current - 1 : companyPageRef.current;
            companyPageRef.current = newPage;
            setCompanyPage(newPage);
            fetchCompanies(newPage);
        } catch { message.error("Failed to delete company."); }
        finally { setDeleteLoading(false); }
    };



    const openCompanyDetail = async (record) => {
        setSelectedCompany(record);
        setDetailTab("overview");
        setShowDetailModal(true);
        setDetailLoading(true);
        setCompanyLocations([]);
        setCompanyBanks([]);
        setDetailDomains([]);

        try {
            const [detail, assignedDomains, lr] = await Promise.all([
                fetchCompanyById(record.id),
                fetchCompanyDomains(record.id),
                axiosInstance.get(`/Locations/${record.id}/get-location-by-company`).catch(() => null),
            ]);

            console.log("📡 Detail:", detail);
            console.log("📡 Assigned Domains:", assignedDomains);
            console.log("📡 Length:", assignedDomains?.length);

            setSelectedCompany(detail);
            setDetailDomains(assignedDomains);  // ← This should work
            setCompanyBanks(detail.bankDetails || []);

            if (lr) {
                const envelope = lr?.data !== undefined ? lr.data : lr;
                const locs = Array.isArray(envelope) ? envelope
                    : Array.isArray(envelope?.data) ? envelope.data
                        : Array.isArray(envelope?.items) ? envelope.items
                            : [];
                setCompanyLocations(locs);
            }
        } catch (e) {
            console.error("openCompanyDetail error:", e);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleTimeZoneSubmit = async (values) => {
        setSubmitting(true);
        try {
            if (editingTimeZone) { await axiosInstance.post(`/TimeZone/update-timezone/${editingTimeZone.id}`, values); message.success("Timezone updated."); }
            else { await axiosInstance.post("/TimeZone/add-timezone", values); message.success("Timezone added."); }
            setShowTimeZoneModal(false); setEditingTimeZone(null); timeZoneForm.resetFields();
            fetchTimezones(tzPageRef.current);
        } catch { message.error("Failed to save timezone."); }
        finally { setSubmitting(false); }
    };

    const handleTimeZoneDelete = async (id) => {
        try {
            await axiosInstance.delete(`/TimeZone/${id}`);
            message.success("Timezone deleted.");
            const newPage = timezones.length === 1 && tzPageRef.current > 1 ? tzPageRef.current - 1 : tzPageRef.current;
            tzPageRef.current = newPage; setTzPage(newPage);
            fetchTimezones(newPage);
        } catch { message.error("Failed to delete timezone."); }
    };

    const handleDomainSubmit = async (values) => {
        setSubmitting(true);
        try {
            if (editingDomain) { await axiosInstance.post(`/CompanyDomain/update-domain${editingDomain.id}`, values); message.success("Domain updated."); }
            else { await axiosInstance.post("/CompanyDomain/add-domain", values); message.success("Domain added."); }
            setShowDomainModal(false); setEditingDomain(null); domainForm.resetFields();
            fetchDomains(domainPageRef.current);
        } catch { message.error("Failed to save domain."); }
        finally { setSubmitting(false); }
    };

    const handleDomainDelete = async (id) => {
        try {
            await axiosInstance.post(`/CompanyDomain/${id}`);
            message.success("Domain deleted.");
            const newPage = domains.length === 1 && domainPageRef.current > 1 ? domainPageRef.current - 1 : domainPageRef.current;
            domainPageRef.current = newPage; setDomainPage(newPage);
            fetchDomains(newPage);
        } catch { message.error("Failed to delete domain."); }
    };

    const openLocationModal = async (record) => {
        if (record.isDeleted) {
            message.error("Cannot manage locations for a deleted company.");
            return;
        }
        setAssigningCompany(record);
        setShowLocationModal(true);
        setLocationLoading(true);
        try {
            const raw = await axiosInstance.get(
                `/Locations/${record.id}/get-location-by-company`  // ✅ correct URL
            );
            const envelope = raw?.data !== undefined ? raw.data : raw;

            // API returns { totalRecords, data: [...] }
            const locs = Array.isArray(envelope) ? envelope
                : Array.isArray(envelope?.data) ? envelope.data
                    : Array.isArray(envelope?.items) ? envelope.items
                        : [];

            setAssignLocations(
                locs.length
                    ? locs.map((l) => ({ ...emptyLocation(), ...l }))
                    : [emptyLocation()]
            );
        } catch (err) {
            console.error("openLocationModal error:", err);
            setAssignLocations([emptyLocation()]);
        } finally {
            setLocationLoading(false);
        }
    };
    const closeLocationModal = () => { setShowLocationModal(false); setAssigningCompany(null); setAssignLocations([emptyLocation()]); };
    const updateLoc = (index, field, val) => setAssignLocations((p) => { const u = [...p]; u[index] = { ...u[index], [field]: val }; return u; });



    // ── 3. handleSaveLocation — multipart/form-data + correct URLs
    const handleSaveLocation = async (index) => {
        const loc = assignLocationsRef.current[index] || assignLocations[index];
        setSavingLocIdx(index);

        console.log("🔷 SAVE START — loc:", loc);
        console.log("🔷 loc.images:", loc.images);
        console.log("🔷 loc.documents:", loc.documents);

        try {
            const fd = new FormData();

            // if (assigningCompany?.id && !loc.id) fd.append("CompanyId", assigningCompany.id);
            if (assigningCompany?.id) fd.append("CompanyId", assigningCompany.id);
            if (loc.locationType) fd.append("LocationType", loc.locationType);
            if (loc.addressLine1) fd.append("AddressLine1", loc.addressLine1);
            if (loc.addressLine2) fd.append("AddressLine2", loc.addressLine2);
            if (loc.countryId) fd.append("CountryId", loc.countryId);
            if (loc.stateId) fd.append("StateId", loc.stateId);
            if (loc.cityId) fd.append("CityId", loc.cityId);
            if (loc.pinCode != null) fd.append("PinCode", loc.pinCode);
            if (loc.landmark) fd.append("Landmark", loc.landmark);
            if (loc.latitude != null) fd.append("Latitude", loc.latitude);
            if (loc.longitude != null) fd.append("Longitude", loc.longitude);
            if (loc.timeZoneId) fd.append("TimeZoneId", loc.timeZoneId);
            if (loc.locationContactNumber) fd.append("LocationContactNumber", loc.locationContactNumber);

            let locationId = loc.id;

            if (loc.id) {
                await axiosInstance.post(`/Locations/${loc.id}/update-location`, fd);
                message.success(`Location ${index + 1} updated.`);
            } else {
                const res = await axiosInstance.post("/Locations/add-location", fd);
                const saved = res?.data !== undefined ? res.data : res;

                console.log("🔷 RAW SAVE RESPONSE:", saved);   // ← YEH DEKHO

                locationId = saved?.id
                    ?? saved?.locationId
                    ?? saved?.location?.id
                    ?? saved?.data?.id
                    ?? null;

                console.log("🔷 RESOLVED locationId:", locationId);

                if (locationId) {
                    setAssignLocations(p => {
                        const u = [...p];
                        u[index] = { ...u[index], id: locationId };
                        return u;
                    });
                }
                message.success(`Location ${index + 1} saved.`);
            }

            if (locationId) {
                const freshLoc = assignLocationsRef.current[index] || loc;

                console.log("🔷 freshLoc BEFORE UPLOAD:", freshLoc);
                console.log("🔷 freshLoc.images:", freshLoc.images);
                console.log("🔷 freshLoc.documents:", freshLoc.documents);

                const result = await uploadEntityFiles({
                    entityName: "LocationModel",
                    entityId: locationId,
                    images: freshLoc.images || [],
                    docs: freshLoc.documents || [],
                    onSuccess: (imgs, docs) => {
                        if (imgs + docs > 0)
                            message.success(`${imgs} image(s) and ${docs} doc(s) uploaded for location.`);
                    },
                    onFileError: (fileName) =>
                        message.error(`"${fileName}" upload failed.`),
                });

                console.log("🔷 uploadEntityFiles RESULT:", result);   // ← YEH BHI DEKHO
            } else {
                message.warning("Location saved but ID not received — files not uploaded.");
            }

            return locationId;

        } catch (err) {
            console.error("🔴 handleSaveLocation error:", err);
            message.error(
                err?.response?.data?.message || err?.message || "Failed to save location."
            );
            return null;
        } finally {
            setSavingLocIdx(null);
        }
    };



    // ── 5. openCompanyDetail — URL fix ───────────────────────────
    // const openCompanyDetail = async (record) => {
    //     setSelectedCompany(record);
    //     setDetailTab("overview");
    //     setShowDetailModal(true);
    //     setDetailLoading(true);
    //     setCompanyLocations([]); setCompanyBanks([]); setDetailDomains([]);
    //     try {
    //         const [detail, assignedDomains, lr] = await Promise.all([
    //             fetchCompanyById(record.id),
    //             fetchCompanyDomains(record.id),
    //             axiosInstance.get(`/Locations/${record.id}/get-location-by-company`).catch(() => null),
    //         ]);
    //         setSelectedCompany(detail);
    //         setDetailDomains(assignedDomains);
    //         setCompanyBanks(detail.bankDetails || []);
    //         if (lr) {
    //             const d = lr?.data !== undefined ? lr.data : lr;
    //             const locs = Array.isArray(d) ? d
    //                 : Array.isArray(d?.data)  ? d.data
    //                 : Array.isArray(d?.items) ? d.items
    //                 : [];
    //             setCompanyLocations(locs);
    //         }
    //     } catch (e) {
    //         console.error(e);
    //     } finally {
    //         setDetailLoading(false);
    //     }
    // };



    ///////////////////////////////

    const handleRestoreCompany = async (id) => {
        try {
            await axiosInstance.post(`/Company/${id}/MarkDeleteFalse`);
            // ya agar API alag ho:
            // await axiosInstance.put(`/Company/restore/${id}`);
            message.success("Company restored successfully.");
            fetchCompanies(companyPageRef.current);
        } catch (err) {
            message.error(err?.response?.data?.message || "Failed to restore company.");
        }
    };
    /////////////////////////////
    // ── 4. handleDeleteLocation — correct URL ────────────────────
    const handleDeleteLocation = async (index) => {
        const loc = assignLocations[index];
        setDeletingLocId(loc.id);
        try {
            if (loc.id) {
                await axiosInstance.post(`/Locations/${loc.id}remove-location`);
                // Note: API path has no slash before remove → /Locations/{id}remove-location
                message.success("Location deleted.");
            }
            setAssignLocations((p) => p.filter((_, i) => i !== index));
        } catch {
            message.error("Failed to delete location.");
        } finally {
            setDeletingLocId(null);
        }
    };

    const handleImportSuccess = (payload) => {
        message.success(`"${payload.companyName}" successfully imported.`);
        setShowImportModal(false);
        companyPageRef.current = 1; setCompanyPage(1);
        fetchCompanies(1);
    };

    const sidebarCounts = {
        basic: 0, images: companyImages.length, documents: companyDocs.length,
        contacts: contacts.length, addresses: addresses.length, banks: banks.length,
    };

    const filteredTimezones = timezones.filter(
        (tz) => !tzSearch || tz.timeZoneName?.toLowerCase().includes(tzSearch.toLowerCase()) || tz.utcOffset?.toLowerCase().includes(tzSearch.toLowerCase())
    );
    const filteredDomains = domains.filter(
        (d) => !domainSearch || d.domainName?.toLowerCase().includes(domainSearch.toLowerCase())
    );

    // ── Company columns ───────────────────────────────────────────────────────
    const companyColumns = [
        // {
        //     title: "ID", dataIndex: "id", key: "id", width: 60,
        //     sorter: (a, b) => a.id - b.id,
        //     render: (id) => <span style={{ fontSize: 11, color: "#9CA3AF" }}>#{id}</span>,
        // },
        {
            title: "Company", dataIndex: "companyName", key: "companyName", width: 220,
            sorter: (a, b) => (a.companyName || "").localeCompare(b.companyName || ""),
            render: (name, r) => {
                const isExpanded = expandedHistoryId === r.id;
                return (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Tooltip title={isExpanded ? "Close History" : "View History"} placement="right">
                            <button
                                onClick={(e) => { e.stopPropagation(); setExpandedHistoryId(isExpanded ? null : r.id); }}
                                style={{
                                    width: 20, height: 20, borderRadius: 5,
                                    border: `1.5px solid ${isExpanded ? T.teal.border : "#CBD5E1"}`,
                                    background: isExpanded ? T.teal.bg : "#F8FAFC",
                                    color: isExpanded ? T.teal.text : "#64748B",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: "pointer", padding: 0, flexShrink: 0,
                                    fontSize: 13, fontWeight: 800, lineHeight: 1,
                                    transition: "all 0.15s ease",
                                    boxShadow: isExpanded ? `0 0 0 2px ${T.teal.bg}` : "none",
                                }}
                            >{isExpanded ? "−" : "+"}</button>
                        </Tooltip>
                        <div style={{ width: 34, height: 34, borderRadius: T.radius.md, background: T.blue.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${T.blue.border}` }}>
                            <BankOutlined style={{ color: T.blue.text, fontSize: 15 }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{name || "—"}</div>
                            <span style={{ background: T.blue.bg, color: T.blue.text, fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 99, border: `1px solid ${T.blue.border}` }}>{r.companyType || "—"}</span>
                        </div>
                    </div>
                );
            },
        },
        {
            title: "Description", dataIndex: "companyDescription", key: "desc", width: 160,
            render: (t) => <span style={{ fontSize: 12, color: "#6B7280" }}>{t ? (t.length > 40 ? t.slice(0, 40) + "…" : t) : "—"}</span>,
        },
        {
            title: "Primary Contact", key: "contact", width: 160,
            render: (_, r) => {
                const p = r.contactPersons?.[0];
                return p ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 26, height: 26, borderRadius: "50%", background: T.green.bg, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${T.green.border}` }}>
                            <UserOutlined style={{ color: T.green.text, fontSize: 12 }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>{p.userName || "—"}</div>
                            {r.contactPersons.length > 1 && <div style={{ fontSize: 10, color: "#9CA3AF" }}>+{r.contactPersons.length - 1} more</div>}
                        </div>
                    </div>
                ) : <span style={{ fontSize: 12, color: "#D1D5DB" }}>—</span>;
            },
        },
        {
            title: "Email", key: "email", width: 170,
            render: (_, r) => { const e = r.contactPersons?.[0]?.userPrimaryEmail; return e ? <span style={{ fontSize: 12, color: T.blue.text }}>{e}</span> : <span style={{ color: "#D1D5DB" }}>—</span>; },
        },
        {
            title: "Phone", key: "phone", width: 140,
            render: (_, r) => { const ph = r.contactPersons?.[0]?.userPrimaryPhoneNumber; return ph ? <span style={{ fontSize: 12, color: "#374151" }}>{ph}</span> : <span style={{ color: "#D1D5DB" }}>—</span>; },
        },
        {
            title: "Domains", key: "domains", width: 170,
            render: (_, r) => {
                const doms = r?.companyDomains || [];
                return (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {doms.slice(0, 2).map((d, i) => (
                            <span key={i} style={{ background: T.purple.bg, color: T.purple.text, fontSize: 10, fontWeight: 600, padding: "1px 8px", borderRadius: 99, border: `1px solid ${T.purple.border}` }}>{d.domainName}</span>
                        ))}
                        {doms.length > 2 && <span style={{ fontSize: 10, color: "#9CA3AF" }}>+{doms.length - 2}</span>}
                        {doms.length === 0 && <span style={{ color: "#D1D5DB", fontSize: 12 }}>—</span>}
                    </div>
                );
            },
        },
        {
            title: "Actions", key: "actions", width: 180, fixed: "right",
            // Actions column
            render: (_, r) => {
                const isDeleted = !!r.isDeleted;
                return (
                    <div style={{ display: "flex", gap: 4 }}>
                        {/* View, Edit, Location — isDeleted ho toh render hi mat karo */}
                        {!isDeleted && (
                            <>
                                <Tooltip title="View Details">
                                    <Button icon={<EyeOutlined />} size="small" onClick={() => openCompanyDetail(r)} />
                                </Tooltip>
                                <Tooltip title="Edit">
                                    <Button icon={<EditOutlined />} size="small" type="primary" ghost onClick={() => openEditCompany(r)} />
                                </Tooltip>
                                <Tooltip title="Manage Locations">
                                    <Button icon={<EnvironmentOutlined />} size="small"
                                        style={{ color: T.teal.text, borderColor: T.teal.border }}
                                        onClick={() => openLocationModal(r)} />
                                </Tooltip>
                                <Popconfirm title="Delete this company?" onConfirm={() => handleCompanyDelete(r.id)} okText="Delete" okButtonProps={{ danger: true }}>
                                    <Tooltip title="Delete">
                                        <Button danger icon={<DeleteOutlined />} size="small" loading={deleteLoading} />
                                    </Tooltip>
                                </Popconfirm>
                                {/* ── NEW: Devices button ── */}
                                <Tooltip title="View Devices">
                                    <Button
                                        icon={<ApiOutlined />}
                                        size="small"
                                        style={{ color: "#7C3AED", borderColor: "#DDD6FE" }}
                                        onClick={() => { setDevicesCompany(r); setShowDevicesModal(true); }}
                                    />
                                </Tooltip>
                            </>
                        )}

                        {/* Restore — sirf deleted companies ke liye */}
                        {isDeleted && (
                            <Popconfirm title="Restore this company?" onConfirm={() => handleRestoreCompany(r.id)} okText="Restore">
                                <Tooltip title="Restore">
                                    <Button icon={<ReloadOutlined />} size="small"
                                        style={{ color: "#16A34A", borderColor: "#BBF7D0" }} />
                                </Tooltip>
                            </Popconfirm>
                        )}
                    </div>
                );
            }
        },
    ];

    const timezoneColumns = buildTimezoneColumns({ countries, setEditingTimeZone, timeZoneForm, setShowTimeZoneModal, handleTimeZoneDelete });
    const domainColumns = buildDomainColumns({ companies, setEditingDomain, domainForm, setShowDomainModal, handleDomainDelete });

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div style={{ padding: "24px", background: "#F3F4F6", minHeight: "100vh", overflowX: "hidden" }}>

            {/* ── Header ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <div style={{ width: 36, height: 36, borderRadius: T.radius.md, background: T.blue.bg, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${T.blue.border}` }}>
                        <BankOutlined style={{ color: T.blue.text, fontSize: 18 }} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>Company Management</h2>
                        <div style={{ fontSize: 12, color: "#6B7280" }}>Manage companies, timezones, and business domains</div>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Button icon={<ClockCircleOutlined />} onClick={() => {
                        setShowTimeZoneGrid(false); setShowDomainGrid(false);
                        setShowCompanyRoleGrid(true);
                    }} type={showCompanyRoleGrid ? "primary" : "default"} ghost={showCompanyRoleGrid}>
                        CompanyRole
                        {/* <Badge count={tzTotal} size="small" style={{ marginLeft: 4, backgroundColor: T.blue.text }} /> */}
                    </Button>
                    <Button icon={<AppstoreOutlined />} onClick={() => {
                        setShowDomainGrid(true); setShowTimeZoneGrid(false);
                        setShowCompanyRoleGrid(false);
                    }} type={showDomainGrid ? "primary" : "default"} ghost={showDomainGrid}>
                        Domains <Badge count={domainTotal} size="small" style={{ marginLeft: 4, backgroundColor: T.purple.text }} />
                    </Button>
                    <Button icon={<ClockCircleOutlined />} onClick={() => {
                        setShowTimeZoneGrid(true); setShowDomainGrid(false);
                        setShowCompanyRoleGrid(false);
                    }} type={showTimeZoneGrid ? "primary" : "default"} ghost={showTimeZoneGrid}>
                        Timezones <Badge count={tzTotal} size="small" style={{ marginLeft: 4, backgroundColor: T.blue.text }} />
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={() => { fetchCompanies(companyPageRef.current); fetchTimezones(tzPageRef.current); fetchDomains(domainPageRef.current); }}>Refresh</Button>
                    <Button icon={<ImportOutlined />} onClick={() => setShowImportModal(true)}>Import</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openAddCompany} style={{ background: T.blue.text, borderColor: T.blue.text }}>Add Company</Button>
                    <ExcelExport
                        data={getExportData(companiesfile)}
                        fileName={`Companies_${new Date().toISOString().slice(0, 10)}`}
                        sheetName="Companies"
                        buttonText="Export Companies"
                        disabled={!companiesfile.length}
                    />
                </div>
            </div>

            {/* ── Stat cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
                <StatCard label="Total Companies" value={companyTotal} color={T.blue.text} bg={T.blue.bg} border={T.blue.border} icon={<BankOutlined />} />
                <StatCard label="Timezones" value={tzTotal} color={T.amber.dark} bg={T.amber.bg} border={T.amber.border} icon={<ClockCircleOutlined />} />
                <StatCard label="Domains" value={domainTotal} color={T.purple.text} bg={T.purple.bg} border={T.purple.border} icon={<AppstoreOutlined />} />
                <StatCard label="Total Locations" value={companies.reduce((s, c) => s + (c.locations?.length || 0), 0)} color={T.teal.text} bg={T.teal.bg} border={T.teal.border} icon={<EnvironmentOutlined />} />
            </div>

            {/* ── Companies grid ── */}
            {!showTimeZoneGrid && !showDomainGrid && !showCompanyRoleGrid && (
                <Card
                    title={
                        <Row align="middle" justify="space-between" wrap={false} style={{ width: "100%" }}>
                            <Col>
                                <Space><BankOutlined style={{ color: T.blue.text }} /><span style={{ fontWeight: 600 }}>Companies</span></Space>
                            </Col>
                            <Col flex="auto">
                                <Row align="middle" justify="end" gutter={10} wrap={false}>
                                    <Col>
                                        <Input
                                            prefix={<SearchOutlined style={{ color: "#9CA3AF" }} />}
                                            placeholder="Search companies..."
                                            value={searchTerm}
                                            // onChange={(e) => setSearchTerm(e.target.value)}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                searchRef.current = val;
                                                setSearchTerm(val);
                                                companyPageRef.current = 1;
                                                setCompanyPage(1);
                                                fetchCompanies(1, val, typeRef.current);
                                            }}
                                            style={{ width: 220 }}
                                            allowClear
                                        />
                                    </Col>
                                    <Col>
                                        <Select value={typeFilter}
                                            // onChange={setTypeFilter}
                                            onChange={(val) => {
                                                typeRef.current = val;
                                                setTypeFilter(val);
                                                companyPageRef.current = 1;
                                                setCompanyPage(1);
                                                fetchCompanies(1, searchRef.current, val);
                                            }}
                                            style={{ width: 150 }}>
                                            <Option value="all">All Types</Option>
                                            {["Private", "Public", "Government", "NGO"].map((t) => <Option key={t} value={t}>{t}</Option>)}
                                        </Select>
                                    </Col>
                                    <Col flex="150px" style={{ textAlign: "right" }}>
                                        <AuditWidget tableName="Companies" recordId={selectedCompany?.id} />
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    }
                    bodyStyle={{ padding: 0 }}
                    style={{ borderRadius: T.radius.lg, border: "1px solid #E5E7EB" }}
                >
                    <div style={{ overflowX: "auto" }}>
                        <Table
                            dataSource={filteredCompanies}
                            columns={companyColumns}
                            rowKey="id"
                            loading={loading}
                            size="small"
                            pagination={false}
                            scroll={{ x: "max-content" }}
                            expandable={{
                                expandedRowKeys: expandedHistoryId ? [expandedHistoryId] : [],
                                onExpand: () => { },
                                expandedRowRender: (r) => {
                                    console.log("🔍 Row data:", r); // company ka poora object
                                    return (
                                        <InlineHistoryPanel
                                            companyId={r.id}
                                            onRefreshCompanies={() => fetchCompanies(companyPageRef.current)}
                                        />
                                    );
                                },
                                expandIcon: () => null, rowExpandable: () => true, showExpandColumn: false,
                            }}
                        />
                    </div>
                    <PaginationBar
                        page={companyPage}
                        pageSize={PAGE_SIZE}
                        total={companyTotal}
                        onChange={handleCompanyPageChange}
                    />
                </Card>
            )}

            {/* ── Timezones grid ── */}
            {showTimeZoneGrid && (
                <Card
                    title={<Space><ClockCircleOutlined style={{ color: T.amber.text }} /><span style={{ fontWeight: 600 }}>Timezones</span></Space>}
                    extra={
                        <Space wrap>
                            <Input prefix={<SearchOutlined style={{ color: "#9CA3AF" }} />} placeholder="Search..." value={tzSearch} onChange={(e) => setTzSearch(e.target.value)} style={{ width: 200 }} allowClear />
                            <Button type="primary" icon={<PlusOutlined />} style={{ background: T.amber.text, borderColor: T.amber.text }}
                                onClick={() => { setEditingTimeZone(null); timeZoneForm.resetFields(); setShowTimeZoneModal(true); }}>Add Timezone</Button>
                            <Button onClick={() => setShowTimeZoneGrid(false)}>← Back</Button>
                        </Space>
                    }
                    bodyStyle={{ padding: 0 }}
                    style={{ borderRadius: T.radius.lg, border: "1px solid #E5E7EB" }}
                >
                    <Table
                        dataSource={filteredTimezones}
                        columns={timezoneColumns}
                        rowKey="id"
                        size="small"
                        pagination={false}
                        scroll={{ x: "max-content" }}
                    />
                    <PaginationBar
                        page={tzPage}
                        pageSize={PAGE_SIZE}
                        total={tzTotal}
                        onChange={handleTzPageChange}
                    />
                </Card>
            )}

            {/* ── Domains grid ── */}
            {showDomainGrid && (
                <Card
                    title={<Space><AppstoreOutlined style={{ color: T.purple.text }} /><span style={{ fontWeight: 600 }}>Business Domains</span></Space>}
                    extra={
                        <Space wrap>
                            <Input prefix={<SearchOutlined style={{ color: "#9CA3AF" }} />} placeholder="Search..." value={domainSearch} onChange={(e) => setDomainSearch(e.target.value)} style={{ width: 200 }} allowClear />
                            <Button type="primary" icon={<PlusOutlined />} style={{ background: T.purple.text, borderColor: T.purple.text }}
                                onClick={() => { setEditingDomain(null); domainForm.resetFields(); setShowDomainModal(true); }}>Add Domain</Button>
                            <Button onClick={() => setShowDomainGrid(false)}>← Back</Button>
                        </Space>
                    }
                    bodyStyle={{ padding: 0 }}
                    style={{ borderRadius: T.radius.lg, border: "1px solid #E5E7EB" }}
                >
                    <Table
                        dataSource={filteredDomains}
                        columns={domainColumns}
                        rowKey="id"
                        size="small"
                        pagination={false}
                        scroll={{ x: "max-content" }}
                        locale={{ emptyText: <EmptyState icon={<AppstoreOutlined />} color={T.purple.text} bg={T.purple.bg} border={T.purple.border} message="No domains yet. Click Add Domain to create one." /> }}
                    />
                    <PaginationBar
                        page={domainPage}
                        pageSize={PAGE_SIZE}
                        total={domainTotal}
                        onChange={handleDomainPageChange}
                    />
                </Card>
            )}

            {/* ── Company Role grid ── */}
            {showCompanyRoleGrid && (
                <Card
                    // title={<Space><CrownOutlined style={{ color: T.blue.text }} /><span style={{ fontWeight: 600 }}>Company Roles</span></Space>}
                    // extra={<Button onClick={() => setShowCompanyRoleGrid(false)}>← Back</Button>}
                    bodyStyle={{ padding: 0 }}
                    style={{ borderRadius: T.radius.lg, border: "1px solid #E5E7EB" }}
                >
                    <CompanyRole onBack={() => setShowCompanyRoleGrid(false)} />
                </Card>
            )}

            {/* ── Modals ── */}
            <CompanyModal
                open={showCompanyModal} onCancel={closeCompanyModal}
                editingCompany={editingCompany} companyForm={companyForm}
                activeSection={activeSection} setActiveSection={setActiveSection}
                liveCompanyName={liveCompanyName} setLiveCompanyName={setLiveCompanyName}
                liveCompanyType={liveCompanyType} setLiveCompanyType={setLiveCompanyType}
                liveCompanyDescription={liveCompanyDescription} setLiveCompanyDescription={setLiveCompanyDescription}
                basicInfoFilled={basicInfoFilled}
                contacts={contacts} setContacts={setContacts}
                addresses={addresses} setAddresses={setAddresses}
                banks={banks} setBanks={setBanks}
                companyImages={companyImages} setCompanyImages={setCompanyImages}
                companyDocs={companyDocs} setCompanyDocs={setCompanyDocs}
                selectedDomainIds={selectedDomainIds} setSelectedDomainIds={setSelectedDomainIds}
                domains={domains} countries={countries} timezones={timezones}
                docTypes={docTypes} issuers={issuers}
                submitting={submitting} modalFetching={modalFetching}
                onSubmit={handleCompanySubmit} sidebarCounts={sidebarCounts}
            />
            <LocationModal
                open={showLocationModal} onCancel={closeLocationModal}
                assigningCompany={assigningCompany} assignLocations={assignLocations}
                setAssignLocations={setAssignLocations} locationLoading={locationLoading}
                savingLocIdx={savingLocIdx} deletingLocId={deletingLocId}
                countries={countries} timezones={timezones} docTypes={docTypes} issuers={issuers}
                emptyLocation={emptyLocation} onUpdate={updateLoc}
                onSave={handleSaveLocation} onDelete={handleDeleteLocation}
            />
            <TimezoneModal
                open={showTimeZoneModal}
                onCancel={() => { setShowTimeZoneModal(false); setEditingTimeZone(null); timeZoneForm.resetFields(); }}
                editingTimeZone={editingTimeZone} timeZoneForm={timeZoneForm}
                onFinish={handleTimeZoneSubmit} submitting={submitting} countries={countries}
            />
            <DomainModal
                open={showDomainModal}
                onCancel={() => { setShowDomainModal(false); setEditingDomain(null); domainForm.resetFields(); }}
                editingDomain={editingDomain} domainForm={domainForm}
                onFinish={handleDomainSubmit} submitting={submitting}
            />
            <CompanyDetailModal
                open={showDetailModal} onCancel={() => setShowDetailModal(false)}
                selectedCompany={selectedCompany} detailLoading={detailLoading}
                detailTab={detailTab} setDetailTab={setDetailTab}
                companyLocations={companyLocations} companyBanks={companyBanks}
                detailDomains={detailDomains}
                onEdit={() => { setShowDetailModal(false); openEditCompany(selectedCompany); }}
            />
            <ImportCompanyModal open={showImportModal} onCancel={() => setShowImportModal(false)} onImportSuccess={handleImportSuccess} />
            {/* <ImportWithFieldMapper open={showImportModal} onCancel={() => setShowImportModal(false)} onImportSuccess={handleImportSuccess} /> */}
            <SuccessModal visible={successVisible} type={successType} onClose={() => setSuccessVisible(false)} itemName="Company" />
            {/* <AuditWidget2 
    tableName="Companies" 
    recordId={expandedHistoryId}   // ← jis row ka + dabaya, usi ka recordId
/> */}

            <CompanyDevicesModal
                open={showDevicesModal}
                onCancel={() => { setShowDevicesModal(false); setDevicesCompany(null); }}
                company={devicesCompany}
            />
        </div>
    );
}

export default Company;