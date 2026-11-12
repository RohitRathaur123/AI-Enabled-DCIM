
// ─── EMPTY BUILDERS ─────────────────────────────────────────────────────────
export const emptyDoc = () => ({
    documentName: "", documentTypeId: null, documentNumber: "",
    issuedById: null, issuedByDate: "", documentValidTill: "",
    _file: null, _uid: `d_${Date.now()}_${Math.random()}`,
});
export const emptyImg = () => ({
    fileType: "", fileName: "", _file: null,
    _uid: `i_${Date.now()}_${Math.random()}`, _previewUrl: "",
});
export const emptyContact = () => ({
    userName: "", userPrimaryEmail: "", userSecondaryEmail: "",
    userPrimaryPhoneNumber: "", userSecondaryPhoneNumber: "",
    images: [], documents: [], _uid: `c_${Date.now()}_${Math.random()}`,
});
export const emptyAddress = () => ({
    addressLine1: "", addressLine2: "", countryId: null, stateId: null,
    cityId: null, pinCode: "", landmark: "", latitude: "", longitude: "",
    timeZoneId: null, locationContactNumber: "",
    images: [], documents: [], _uid: `a_${Date.now()}_${Math.random()}`,
});
export const emptyBank = () => ({
    bankName: "", accountHolderName: "", accountNumber: "", ifscCode: "",
    branchName: "", swiftCode: "", iban: "", accountType: "", isPrimary: false,
    images: [], documents: [], _uid: `b_${Date.now()}_${Math.random()}`,
});
export const emptyLocation = () => ({
    id: null, locationType: "", addressLine1: "", addressLine2: "",
    countryId: null, stateId: null, cityId: null, pinCode: "",
    landmark: "", latitude: "", longitude: "", timeZoneId: null,
    locationContactNumber: "", images: [], documents: [],
});

// ─── RESPONSE HELPERS ────────────────────────────────────────────────────────
export const toArray = (res) => {
    if (Array.isArray(res))       return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
};

// export const normalizeCompanyListItem = (item = {}) => ({
//     id: item.company?.id || item.id,

//     companyName:
//         item.company?.companyName ||
//         item.companyName ||
//         "",

//     companyType:
//         item.company?.companyType ||
//         item.companyType ||
//         "",
        
//         // isDeleted: item.isDeleted,
//         isDeleted: item.company?.isDeleted,

//     companyDescription:
//         item.company?.companyDescription ||
//         item.companyDescription ||
//         "",

//     companyDomains:
//         item.companyDomain ||
//         item.companyDomains ||
//         [],

//     contactPersons:
//         item.contactPersons || [],

//     companyAddresses:
//         item.companyAddresses || [],

//     bankDetails:
//         item.bankDetails || [],

//     images:
//         item.images || [],

//     documents:
//         item.documents || [],
    
//     isDeleted:
//         item.company?.isDeleted
// });

export const normalizeCompanyListItem = (item = {}) => ({
    id: item.id,
    companyName:        item.companyName        || "",
    companyType:        item.companyType        || "",
    companyDescription: item.companyDescription || "",
    isDeleted:          item.isDeleted,          // ← backend ki raw value, koi default nahi
    companyDomains:     item.companyDomains      || [],
    contactPersons:     item.contactPersons      || [],
    companyAddresses:   item.companyAddresses    || [],
    bankDetails:        item.bankDetails         || [],
    images:             item.images              || [],
    documents:          item.documents           || [],
});

export const normalizeCompanyDetail = (res) => {
    const base = res?.company || res || {};
    return {
        id:                 base.id,
        companyName:        base.companyName        || "",
        companyType:        base.companyType        || "",
        companyDescription: base.companyDescription || "",
        isDeleted:          base.isDeleted          || false,
        createdAt:          base.createdAt          || null,
        updatedAt:          base.updatedAt          || null,
        contactPersons:     res?.contactPersons    || base.contactPersons   || [],
        companyAddresses:   res?.companyAddresses  || base.companyAddresses  || [],
        bankDetails:        res?.bankDetails       || base.bankDetails       || [],
        images:             res?.images            || base.images            || [],
        documents:          res?.documents         || base.documents         || [],
        companyDomains:     base.companyDomains    || [],
        companyDomain:      res?.companyDomain     || null,
    };
};

export const normalizeContact = (ct) => ({
    ...emptyContact(), ...ct,
    _uid: ct._uid || `c_${ct.id || Date.now()}_${Math.random()}`,
    images:    (ct.images    || []).map((img, ii) => ({ ...emptyImg(), ...img, _uid: img._uid || `i_${ii}_${Math.random()}` })),
    documents: (ct.documents || []).map((doc, di) => ({ ...emptyDoc(), ...doc, _uid: doc._uid || `d_${di}_${Math.random()}` })),
});
export const normalizeAddress = (a) => ({
    ...emptyAddress(), ...a,
    _uid: a._uid || `a_${a.id || Date.now()}_${Math.random()}`,
    images:    (a.images    || []).map((img, ii) => ({ ...emptyImg(), ...img, _uid: img._uid || `i_${ii}_${Math.random()}` })),
    documents: (a.documents || []).map((doc, di) => ({ ...emptyDoc(), ...doc, _uid: doc._uid || `d_${di}_${Math.random()}` })),
});
export const normalizeBank = (b) => ({
    ...emptyBank(), ...b,
    _uid: b._uid || `b_${b.id || Date.now()}_${Math.random()}`,
    images:    (b.images    || []).map((img, ii) => ({ ...emptyImg(), ...img, _uid: img._uid || `i_${ii}_${Math.random()}` })),
    documents: (b.documents || []).map((doc, di) => ({ ...emptyDoc(), ...doc, _uid: doc._uid || `d_${di}_${Math.random()}` })),
});
export const normalizeImg = (img, idx) => ({ ...emptyImg(), ...img, _uid: img._uid || `i_${idx}_${Math.random()}` });
export const normalizeDoc = (doc, idx) => ({ ...emptyDoc(), ...doc, _uid: doc._uid || `d_${idx}_${Math.random()}` });

// ─── FILE HELPERS ────────────────────────────────────────────────────────────
const fileToBase64 = (file) =>
    new Promise((resolve) => {
        if (!file) { resolve(null); return; }
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result?.split(",")[1] ?? null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });




// ─── SERIALIZE IMAGES ────────────────────────────────────────────────────────
// Sirf naye files (_file wale) bhejo — existing (id wale) already server pe hain
// Backend ka DTO sirf { file, fileName, fileType } accept karta hai
export const serializeImages = async (images = []) => {
    const result = [];
 
    for (const img of images) {
        // Skip already-saved images — they are managed via PUT /Image/update/:id
        if (img.id && !img._file) continue;
 
        // Must have a file to upload
        if (!img._file) continue;
 
        const base64 = await fileToBase64(img._file);
        if (!base64) continue;
 
        // Resolve fileType: "Other" → use _customType
        const resolvedType =
            img.fileType === "Other"
                ? (img._customType?.trim() || "Other")
                : (img.fileType?.trim() || "");
 
        const entry = {
            file:     base64,
            fileName: img.fileName || img._file?.name || "",
            fileType: resolvedType,
 
            // Optional metadata — only include if set
            ...(img.fileUse        ? { fileUse:        img.fileUse }                         : {}),
            ...(img.fileExpiryDate ? { fileExpiryDate: img.fileExpiryDate }                  : {}),
            ...(img.entityType     ? { entityType:     img.entityType }                      : {}),
            ...(img.companyId      ? { companyId:      Number(img.companyId) }               : {}),
            ...(img.userId         ? { userId:         Number(img.userId) }                  : {}),
            ...(img.addressId      ? { addressId:      Number(img.addressId) }               : {}),
            ...(img.bankDetailId   ? { bankDetailId:   Number(img.bankDetailId) }            : {}),
            ...(img.locationId     ? { locationId:     Number(img.locationId) }              : {}),
            ...(img.deviceId       ? { deviceId:       Number(img.deviceId) }                : {}),
        };
 
        result.push(entry);
    }
 
    return result;
};
// ─── SERIALIZE DOCUMENTS ─────────────────────────────────────────────────────
// Same logic — sirf naye files bhejo
export const serializeDocuments = async (docs = []) => {
    const result = [];
    for (const doc of docs) {
        if (doc._file) {
            const base64 = await fileToBase64(doc._file);
            if (!base64) continue;
            result.push({
                file:              base64,
                fileName:          doc.fileName || doc._file?.name || "",
                fileType:          doc.fileType || "",
                documentName:      doc.documentName      || "",
                documentTypeId:    doc.documentTypeId    ?? null,
                issuedById:        doc.issuedById        ?? null,
                documentNumber:    doc.documentNumber    || "",
                issuedByDate:      doc.issuedByDate      || null,
                documentValidTill: doc.documentValidTill || null,
            });
        }
        // Existing docs (doc.id wale) — skip, already saved hain
    }
    return result;
};

export const buildCompanyFormData = async ({ 
    values, contacts, addresses, banks, 
    companyImages, companyDocs, domainIds 
}) => {
    const fd = new FormData();
 
    // ── Basic company fields ──
    fd.append("CompanyName",        values.companyName        || "");
    fd.append("CompanyType",        values.companyType        || "");
    fd.append("CompanyDescription", values.companyDescription || "");
 
    // ── Domain IDs ──
    (domainIds || []).forEach(id => fd.append("CompanyDomainIds", id));
 
    // ──────────────────────────────────────────────────────────────
    // ✅ CONTACT PERSONS — BINA IMAGES/DOCUMENTS
    // ──────────────────────────────────────────────────────────────
    contacts.forEach((ct, i) => {
        // If editing existing contact, include its ID
        if (ct.id) fd.append(`ContactPersons[${i}].Id`, ct.id);
        
        fd.append(`ContactPersons[${i}].UserName`,                 ct.userName                 || "");
        fd.append(`ContactPersons[${i}].UserPrimaryEmail`,         ct.userPrimaryEmail         || "");
        fd.append(`ContactPersons[${i}].UserSecondaryEmail`,       ct.userSecondaryEmail       || "");
        fd.append(`ContactPersons[${i}].UserPrimaryPhoneNumber`,   ct.userPrimaryPhoneNumber   || "");
        fd.append(`ContactPersons[${i}].UserSecondaryPhoneNumber`, ct.userSecondaryPhoneNumber || "");
        
        // ❌ NO images/documents here — they upload separately via uploadEntityFiles()
    });
 
    // ──────────────────────────────────────────────────────────────
    // ✅ COMPANY ADDRESSES — BINA IMAGES/DOCUMENTS
    // ──────────────────────────────────────────────────────────────
    addresses.forEach((addr, i) => {
        // If editing existing address, include its ID
        if (addr.id) fd.append(`CompanyAddresses[${i}].Id`, addr.id);
        
        fd.append(`CompanyAddresses[${i}].AddressLine1`,          addr.addressLine1          || "");
        fd.append(`CompanyAddresses[${i}].AddressLine2`,          addr.addressLine2          || "");
        fd.append(`CompanyAddresses[${i}].PinCode`,               addr.pinCode               || "");
        fd.append(`CompanyAddresses[${i}].Landmark`,              addr.landmark              || "");
        fd.append(`CompanyAddresses[${i}].LocationContactNumber`, addr.locationContactNumber || "");
        
        // Add IDs if they exist
        if (addr.countryId)  fd.append(`CompanyAddresses[${i}].CountryId`,  addr.countryId);
        if (addr.stateId)    fd.append(`CompanyAddresses[${i}].StateId`,    addr.stateId);
        if (addr.cityId)     fd.append(`CompanyAddresses[${i}].CityId`,     addr.cityId);
        if (addr.timeZoneId) fd.append(`CompanyAddresses[${i}].TimeZoneId`, addr.timeZoneId);
        if (addr.latitude)   fd.append(`CompanyAddresses[${i}].Latitude`,   addr.latitude);
        if (addr.longitude)  fd.append(`CompanyAddresses[${i}].Longitude`,  addr.longitude);
        
        // ❌ NO images/documents here — they upload separately
    });
 
    // ──────────────────────────────────────────────────────────────
    // ✅ BANK DETAILS — BINA IMAGES/DOCUMENTS
    // ──────────────────────────────────────────────────────────────
    banks.forEach((b, i) => {
        // If editing existing bank, include its ID
        if (b.id) fd.append(`BankDetails[${i}].Id`, b.id);
        
        fd.append(`BankDetails[${i}].BankName`,          b.bankName          || "");
        fd.append(`BankDetails[${i}].AccountHolderName`, b.accountHolderName || "");
        fd.append(`BankDetails[${i}].AccountNumber`,     b.accountNumber     || "");
        fd.append(`BankDetails[${i}].IfscCode`,          b.ifscCode          || "");
        fd.append(`BankDetails[${i}].BranchName`,        b.branchName        || "");
        fd.append(`BankDetails[${i}].SwiftCode`,         b.swiftCode         || "");
        fd.append(`BankDetails[${i}].Iban`,              b.iban              || "");
        fd.append(`BankDetails[${i}].AccountType`,       b.accountType       || "");
        fd.append(`BankDetails[${i}].IsPrimary`,         !!b.isPrimary);
        
        // ❌ NO images/documents here — they upload separately
    });
 
    return fd;
};

// ─── FORMDATA HELPERS (for Location API) ────────────────────────────────────
export const appendImages = (fd, prefix, images = []) => {
    images.forEach((img, ii) => {
        if (img._file) fd.append(`${prefix}[${ii}].file`, img._file);
        fd.append(`${prefix}[${ii}].fileName`, img.fileName || img._file?.name || "");
        fd.append(`${prefix}[${ii}].fileType`, img.fileType || "");
    });
};

export const appendDocuments = (fd, prefix, documents = []) => {
    documents.forEach((doc, di) => {
        if (doc._file) fd.append(`${prefix}[${di}].file`, doc._file);
        fd.append(`${prefix}[${di}].fileName`,          doc.fileName          || doc._file?.name || "");
        fd.append(`${prefix}[${di}].fileType`,           doc.fileType          || "");
        fd.append(`${prefix}[${di}].documentName`,       doc.documentName      || "");
        fd.append(`${prefix}[${di}].documentNumber`,     doc.documentNumber    || "");
        if (doc.documentTypeId != null) fd.append(`${prefix}[${di}].documentTypeId`, doc.documentTypeId);
        if (doc.issuedById      != null) fd.append(`${prefix}[${di}].issuedById`,    doc.issuedById);
        if (doc.issuedByDate)         fd.append(`${prefix}[${di}].issuedByDate`,      doc.issuedByDate);
        if (doc.documentValidTill)    fd.append(`${prefix}[${di}].documentValidTill`, doc.documentValidTill);
    });
};

export const isImageFile = (name = "") => {
    const ext = (name?.split(".").pop() || "").toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext);
};

// ─── DRAFT HELPERS ───────────────────────────────────────────────────────────
const DRAFT_KEY = "company_form_draft";

// File objects serialize nahi ho sakte, sirf metadata rakhein
const stripFileRefs = (items = []) =>
    items.map(({ _file, _previewUrl, ...rest }) => rest);

const stripSectionFiles = (section = []) =>
    section.map(({ images = [], documents = [], _file, _previewUrl, ...rest }) => ({
        ...rest,
        images:    stripFileRefs(images),
        documents: stripFileRefs(documents),
    }));

export const saveDraft = ({ formValues, contacts, addresses, banks, companyImages, companyDocs, selectedDomainIds, editingCompanyId }) => {
    try {
        const draft = {
            savedAt:           new Date().toISOString(),
            editingCompanyId:  editingCompanyId || null,
            formValues:        formValues        || {},
            selectedDomainIds: selectedDomainIds || [],
            companyImages:     stripFileRefs(companyImages || []),
            companyDocs:       stripFileRefs(companyDocs   || []),
            contacts:          stripSectionFiles(contacts  || []),
            addresses:         stripSectionFiles(addresses || []),
            banks:             stripSectionFiles(banks     || []),
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        return true;
    } catch {
        return false;
    }
};

export const loadDraft  = () => { try { const r = localStorage.getItem(DRAFT_KEY); return r ? JSON.parse(r) : null; } catch { return null; } };
export const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch {} };
export const hasDraft   = () => !!localStorage.getItem(DRAFT_KEY);