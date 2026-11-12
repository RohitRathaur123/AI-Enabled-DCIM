// // AddCountry.jsx
// import React, { useState } from 'react';
// import {
//   Typography, Row, Col, Table, Tag, Space, Button, Select,
//   Input, Badge, Tooltip, Switch, message, Divider, Avatar
// } from 'antd';
// import {
//   GlobalOutlined, SearchOutlined, PlusOutlined, ReloadOutlined,
//   CloseOutlined, ExclamationCircleOutlined, CheckCircleOutlined,
//   StopOutlined, EditOutlined, DeleteOutlined
// } from '@ant-design/icons';

// const { Title, Text } = Typography;
// const { Option } = Select;

// const AddCountry = () => {
//   const [countries, setCountries] = useState([
//     { id: 1, name: 'United States', code: 'USA', capital: 'Washington, D.C.', region: 'Americas', subregion: 'Northern America', currency: 'USD', currencySymbol: '$', currencyName: 'US Dollar', phoneCode: '+1', timezone: 'UTC-5 to UTC-10', language: 'English', status: 'Active', regDate: '2024-01-15 09:30 AM' },
//     { id: 2, name: 'United Kingdom', code: 'GBR', capital: 'London', region: 'Europe', subregion: 'Northern Europe', currency: 'GBP', currencySymbol: '£', currencyName: 'British Pound', phoneCode: '+44', timezone: 'UTC+0', language: 'English', status: 'Active', regDate: '2024-02-20 11:15 AM' },
//     { id: 3, name: 'India', code: 'IND', capital: 'New Delhi', region: 'Asia', subregion: 'Southern Asia', currency: 'INR', currencySymbol: '₹', currencyName: 'Indian Rupee', phoneCode: '+91', timezone: 'UTC+5:30', language: 'Hindi, English', status: 'Active', regDate: '2024-03-10 02:45 PM' },
//     { id: 4, name: 'Germany', code: 'DEU', capital: 'Berlin', region: 'Europe', subregion: 'Western Europe', currency: 'EUR', currencySymbol: '€', currencyName: 'Euro', phoneCode: '+49', timezone: 'UTC+1', language: 'German', status: 'Active', regDate: '2024-04-05 09:20 AM' },
//     { id: 5, name: 'Japan', code: 'JPN', capital: 'Tokyo', region: 'Asia', subregion: 'Eastern Asia', currency: 'JPY', currencySymbol: '¥', currencyName: 'Japanese Yen', phoneCode: '+81', timezone: 'UTC+9', language: 'Japanese', status: 'Inactive', regDate: '2024-05-12 04:30 PM' },
//     { id: 6, name: 'Canada', code: 'CAN', capital: 'Ottawa', region: 'Americas', subregion: 'Northern America', currency: 'CAD', currencySymbol: 'C$', currencyName: 'Canadian Dollar', phoneCode: '+1', timezone: 'UTC-3.5 to UTC-8', language: 'English, French', status: 'Active', regDate: '2024-06-18 10:00 AM' },
//   ]);

//   const emptyForm = { name: '', code: '', capital: '', region: 'Asia', subregion: '', currency: '', currencySymbol: '', currencyName: '', phoneCode: '', timezone: '', language: '', status: true };

//   const [formData, setFormData] = useState(emptyForm);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [regionFilter, setRegionFilter] = useState('all');
//   const [statusFilter, setStatusFilter] = useState('all');
//   const [showFormModal, setShowFormModal] = useState(false);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [editingCountry, setEditingCountry] = useState(null);
//   const [countryToDelete, setCountryToDelete] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [sortedInfo, setSortedInfo] = useState({ columnKey: 'id', order: 'ascend' });

//   const regionOptions = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania'];
//   const subregionOptions = {
//     Africa: ['Northern Africa', 'Sub-Saharan Africa', 'Eastern Africa', 'Western Africa', 'Middle Africa', 'Southern Africa'],
//     Americas: ['Northern America', 'Central America', 'Caribbean', 'South America'],
//     Asia: ['Central Asia', 'Eastern Asia', 'Southern Asia', 'Southeastern Asia', 'Western Asia'],
//     Europe: ['Northern Europe', 'Western Europe', 'Southern Europe', 'Eastern Europe'],
//     Oceania: ['Australia and New Zealand', 'Melanesia', 'Micronesia', 'Polynesia'],
//   };

//   const regions = [...new Set(countries.map(c => c.region))];
//   const totalCount = countries.length;
//   const activeCount = countries.filter(c => c.status === 'Active').length;
//   const inactiveCount = countries.filter(c => c.status !== 'Active').length;
//   const regionCount = new Set(countries.map(c => c.region)).size;

//   const filteredCountries = countries.filter(c => {
//     const s = searchTerm.toLowerCase();
//     const matchSearch = !searchTerm ||
//       c.name.toLowerCase().includes(s) ||
//       c.code.toLowerCase().includes(s) ||
//       c.capital.toLowerCase().includes(s) ||
//       (c.language && c.language.toLowerCase().includes(s));
//     const matchRegion = regionFilter === 'all' || c.region === regionFilter;
//     const matchStatus = statusFilter === 'all' || c.status === statusFilter;
//     return matchSearch && matchRegion && matchStatus;
//   });

//   // ── Handlers ────────────────────────────────────────────────────────────
//   const handleInputChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
//   const handleRegionChange = (value) => setFormData(prev => ({ ...prev, region: value, subregion: '' }));
//   const handleStatusToggle = (checked) => setFormData(prev => ({ ...prev, status: checked }));

//   const openAddModal = () => { setEditingCountry(null); setFormData(emptyForm); setShowFormModal(true); };
//   const openEditModal = (c) => { setEditingCountry(c); setFormData({ name: c.name, code: c.code, capital: c.capital, region: c.region, subregion: c.subregion, currency: c.currency, currencySymbol: c.currencySymbol, currencyName: c.currencyName, phoneCode: c.phoneCode, timezone: c.timezone, language: c.language, status: c.status === 'Active' }); setShowFormModal(true); };
//   const closeModal = () => { setShowFormModal(false); setEditingCountry(null); };
//   const openDeleteModal = (c) => { setCountryToDelete(c); setShowDeleteModal(true); };
//   const closeDeleteModal = () => { setShowDeleteModal(false); setCountryToDelete(null); };

//   const handleDelete = () => {
//     if (countryToDelete) { setCountries(countries.filter(c => c.id !== countryToDelete.id)); message.success('Country deleted!'); closeDeleteModal(); }
//   };

//   const handleSubmit = () => {
//     if (!formData.name || !formData.code || !formData.capital || !formData.currency) { message.error('Please fill all required fields'); return; }
//     setLoading(true);
//     setTimeout(() => {
//       const payload = { ...formData, code: formData.code.toUpperCase(), currency: formData.currency.toUpperCase(), status: formData.status ? 'Active' : 'Inactive' };
//       if (editingCountry) {
//         setCountries(countries.map(c => c.id === editingCountry.id ? { ...c, ...payload } : c));
//         message.success('Country updated successfully!');
//       } else {
//         setCountries([...countries, { id: Date.now(), ...payload, regDate: new Date().toLocaleString() }]);
//         message.success('Country added successfully!');
//       }
//       setLoading(false); closeModal();
//     }, 500);
//   };

//   const handleTableChange = (_, __, sorter) => setSortedInfo(sorter);

//   // ── Stat Card ────────────────────────────────────────────────────────────
//   const StatCard = ({ label, value, color, icon }) => (
//     <div style={{ backgroundColor: 'white', borderRadius: 6, padding: '8px 14px', borderTop: `3px solid ${color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
//       <span style={{ fontSize: 22, color }}>{icon}</span>
//       <div>
//         <div style={{ fontSize: 11, color: '#888', lineHeight: 1.3 }}>{label}</div>
//         <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
//       </div>
//     </div>
//   );

//   // ── Shared style tokens ─────────────────────────────────────────────────
//   const backdropStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 };
//   const modalBoxStyle = (width) => ({ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', backgroundColor: 'white', padding: '20px', borderRadius: '8px', width, maxWidth: '95%', maxHeight: '92vh', overflowY: 'auto', zIndex: 1001, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' });
//   const lbl = { display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 };
//   const inputStyle = { width: '100%', padding: '6px 10px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };

//   // ── Columns ──────────────────────────────────────────────────────────────
//   const columns = [
//     {
//       title: 'ID', dataIndex: 'id', key: 'id', width: 52,
//       sorter: (a, b) => a.id - b.id, sortOrder: sortedInfo.columnKey === 'id' && sortedInfo.order,
//       render: t => <Text style={{ fontSize: 11 }}>{t}</Text>
//     },
//     {
//       title: 'Country', dataIndex: 'name', key: 'name', width: 150, ellipsis: true,
//       sorter: (a, b) => a.name.localeCompare(b.name), sortOrder: sortedInfo.columnKey === 'name' && sortedInfo.order,
//       render: (t, r) => (
//         <Space size={4}>
//           <Avatar icon={<GlobalOutlined />} style={{ backgroundColor: '#1890ff', flexShrink: 0 }} size={20} />
//           <div>
//             <Text strong style={{ fontSize: 11 }}>{t}</Text>
//             <div><Text type="secondary" style={{ fontSize: 10 }}>{r.code}</Text></div>
//           </div>
//         </Space>
//       )
//     },
//     {
//       title: 'Capital', dataIndex: 'capital', key: 'capital', width: 120, ellipsis: true,
//       sorter: (a, b) => a.capital.localeCompare(b.capital), sortOrder: sortedInfo.columnKey === 'capital' && sortedInfo.order,
//       render: t => <Text style={{ fontSize: 11 }}>{t}</Text>
//     },
//     {
//       title: 'Region', dataIndex: 'region', key: 'region', width: 90,
//       sorter: (a, b) => a.region.localeCompare(b.region), sortOrder: sortedInfo.columnKey === 'region' && sortedInfo.order,
//       render: t => <Tag color="geekblue" style={{ fontSize: 10, margin: 0, padding: '0 4px' }}>{t}</Tag>,
//       filters: [...new Set(countries.map(c => c.region))].map(r => ({ text: r, value: r })),
//       onFilter: (v, r) => r.region === v
//     },
//     {
//       title: 'Subregion', dataIndex: 'subregion', key: 'subregion', width: 130, ellipsis: true,
//       sorter: (a, b) => (a.subregion || '').localeCompare(b.subregion || ''),
//       render: t => <Text style={{ fontSize: 11 }}>{t || '-'}</Text>
//     },
//     {
//       title: 'Currency', key: 'currency', width: 90,
//       sorter: (a, b) => a.currency.localeCompare(b.currency),
//       render: (_, r) => (
//         <Tooltip title={r.currencyName}>
//           <Space size={3}>
//             <Text style={{ fontSize: 11, fontWeight: 600 }}>{r.currencySymbol}</Text>
//             <Tag color="cyan" style={{ fontSize: 10, margin: 0, padding: '0 4px' }}>{r.currency}</Tag>
//           </Space>
//         </Tooltip>
//       )
//     },
//     {
//       title: 'Phone', dataIndex: 'phoneCode', key: 'phoneCode', width: 72,
//       sorter: (a, b) => (a.phoneCode || '').localeCompare(b.phoneCode || ''),
//       render: t => <Text style={{ fontSize: 11 }}>{t || '-'}</Text>
//     },
//     {
//       title: 'Timezone', dataIndex: 'timezone', key: 'timezone', width: 120, ellipsis: true,
//       sorter: (a, b) => (a.timezone || '').localeCompare(b.timezone || ''),
//       render: t => <Text style={{ fontSize: 10 }}>{t || '-'}</Text>
//     },
//     {
//       title: 'Language', dataIndex: 'language', key: 'language', width: 110, ellipsis: true,
//       sorter: (a, b) => (a.language || '').localeCompare(b.language || ''),
//       render: t => <Tooltip title={t}><Text style={{ fontSize: 11 }}>{t || '-'}</Text></Tooltip>
//     },
//     {
//       title: 'Reg. Date', dataIndex: 'regDate', key: 'regDate', width: 130,
//       sorter: (a, b) => new Date(a.regDate) - new Date(b.regDate),
//       render: t => <Text style={{ fontSize: 10 }}>{t}</Text>
//     },
//     {
//       title: 'Status', dataIndex: 'status', key: 'status', width: 90,
//       sorter: (a, b) => a.status.localeCompare(b.status), sortOrder: sortedInfo.columnKey === 'status' && sortedInfo.order,
//       render: t => <Badge status={t === 'Active' ? 'success' : 'default'} text={<span style={{ fontSize: 11 }}>{t}</span>} />,
//       filters: [{ text: 'Active', value: 'Active' }, { text: 'Inactive', value: 'Inactive' }],
//       onFilter: (v, r) => r.status === v
//     },
//     {
//       title: '', key: 'actions', width: 72, fixed: 'right',
//       render: (_, r) => (
//         <Space size={0}>
//           <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditModal(r)} style={{ color: '#1890ff', padding: '0 3px' }} /></Tooltip>
//           <Tooltip title="Delete"><Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => openDeleteModal(r)} style={{ color: '#ff4d4f', padding: '0 3px' }} /></Tooltip>
//         </Space>
//       )
//     },
//   ];

//   // ══════════════════════════════════════════════════════════════════════
//   return (
//     <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f0f2f5', padding: '10px 16px', boxSizing: 'border-box', overflow: 'hidden' }}>

//       {/* ── HEADER ── */}
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexShrink: 0 }}>
//         <div>
//           <Title level={4} style={{ margin: 0, lineHeight: 1.3 }}>
//             <GlobalOutlined style={{ marginRight: 8, color: '#1890ff' }} />
//             Countries Management
//           </Title>
//           <Text type="secondary" style={{ fontSize: 12 }}>Manage countries for data center locations and facilities</Text>
//         </div>
//         <Space>
//           <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal} size="small"
//             style={{ background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', border: 'none' }}>
//             Add Country
//           </Button>
//           <Button icon={<ReloadOutlined />} size="small" onClick={() => window.location.reload()}>Refresh</Button>
//         </Space>
//       </div>

//       {/* ── STAT CARDS ── */}
//       <Row gutter={10} style={{ marginBottom: 8, flexShrink: 0 }}>
//         <Col span={6}><StatCard label="Total Countries" value={totalCount} color="#1890ff" icon={<GlobalOutlined style={{ color: '#1890ff' }} />} /></Col>
//         <Col span={6}><StatCard label="Active" value={activeCount} color="#52c41a" icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />} /></Col>
//         <Col span={6}><StatCard label="Inactive" value={inactiveCount} color="#8c8c8c" icon={<StopOutlined style={{ color: '#8c8c8c' }} />} /></Col>
//         <Col span={6}><StatCard label="Regions" value={regionCount} color="#fa8c16" icon={<GlobalOutlined style={{ color: '#fa8c16' }} />} /></Col>
//       </Row>

//       {/* ── FILTERS ── */}
//       <div style={{ backgroundColor: 'white', borderRadius: 6, padding: '8px 12px', marginBottom: 8, flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
//         <Row gutter={16} align="middle">
//           <Col xs={24} sm={24} md={10} lg={10}>
//             <Input placeholder="Search by name, code, capital or language..." prefix={<SearchOutlined style={{ color: '#bbb' }} />}
//               value={searchTerm} onChange={e => setSearchTerm(e.target.value)} allowClear size="small" />
//           </Col>
//           <Col xs={8} sm={6} md={5} lg={5}>
//             <Select value={regionFilter} onChange={setRegionFilter} size="small" style={{ width: '100%' }}>
//               <Option value="all">All Regions</Option>
//               {regions.map(r => <Option key={r} value={r}>{r}</Option>)}
//             </Select>
//           </Col>
//           <Col xs={8} sm={6} md={5} lg={5}>
//             <Select value={statusFilter} onChange={setStatusFilter} size="small" style={{ width: '100%' }}>
//               <Option value="all">All Status</Option>
//               <Option value="Active">Active</Option>
//               <Option value="Inactive">Inactive</Option>
//             </Select>
//           </Col>
//           <Col xs={0} sm={0} md={4} lg={4} style={{ textAlign: 'right' }}>
//             <Text style={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>{filteredCountries.length} / {totalCount} shown</Text>
//           </Col>
//         </Row>
//       </div>

//       {/* ── TABLE ── */}
//       <div style={{ flex: 1, backgroundColor: 'white', borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
//         <div style={{ padding: '7px 14px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
//           <Text strong style={{ fontSize: 13 }}>Countries List</Text>
//           <Badge count={filteredCountries.length} style={{ backgroundColor: '#1890ff' }} />
//         </div>
//         <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
//           <Table
//             columns={columns} dataSource={filteredCountries} loading={loading}
//             bordered={false} rowKey="id" size="small" scroll={{ x: 'max-content' }}
//             pagination={{ pageSize: 8, showSizeChanger: false, showTotal: total => `${total} countries`, size: 'small', style: { padding: '5px 14px', margin: 0 } }}
//             onChange={handleTableChange} style={{ fontSize: 12 }}
//             locale={{ emptyText: <div style={{ padding: '12px 0', textAlign: 'center', color: '#999', fontSize: 13 }}>No data found</div> }}
//           />
//         </div>
//       </div>

//       {/* ── FOOTER ── */}
//       <div style={{ textAlign: 'center', paddingTop: 4, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
//       </div>


//       {/* ══ ADD / EDIT MODAL ══ */}
//       {showFormModal && (
//         <>
//           <div style={backdropStyle} onClick={closeModal} />
//           <div style={modalBoxStyle('760px')}>
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
//               <h3 style={{ margin: 0, color: '#1890ff', fontSize: 15 }}>{editingCountry ? 'Edit Country' : 'Add New Country'}</h3>
//               <Button type="text" icon={<CloseOutlined />} onClick={closeModal} style={{ color: '#666' }} />
//             </div>

//             {/* Row 1 — Basic */}
//             <Row gutter={12} style={{ marginBottom: 14 }}>
//               <Col span={8}>
//                 <label style={lbl}>Country Name <span style={{ color: '#ff4d4f' }}>*</span></label>
//                 <input type="text" name="name" value={formData.name} onChange={handleInputChange} style={inputStyle}
//                   placeholder="e.g., United States"
//                   onFocus={e => e.target.style.borderColor = '#1890ff'} onBlur={e => e.target.style.borderColor = '#d9d9d9'} />
//               </Col>
//               <Col span={8}>
//                 <label style={lbl}>Country Code (3 letters) <span style={{ color: '#ff4d4f' }}>*</span></label>
//                 <input type="text" name="code" value={formData.code} onChange={handleInputChange} maxLength={3} style={{ ...inputStyle, textTransform: 'uppercase' }}
//                   placeholder="e.g., USA"
//                   onFocus={e => e.target.style.borderColor = '#1890ff'} onBlur={e => e.target.style.borderColor = '#d9d9d9'} />
//               </Col>
//               <Col span={8}>
//                 <label style={lbl}>Capital City <span style={{ color: '#ff4d4f' }}>*</span></label>
//                 <input type="text" name="capital" value={formData.capital} onChange={handleInputChange} style={inputStyle}
//                   placeholder="e.g., Washington, D.C."
//                   onFocus={e => e.target.style.borderColor = '#1890ff'} onBlur={e => e.target.style.borderColor = '#d9d9d9'} />
//               </Col>
//             </Row>

//             {/* Row 2 — Geography */}
//             <Row gutter={12} style={{ marginBottom: 14 }}>
//               <Col span={8}>
//                 <label style={lbl}>Region <span style={{ color: '#ff4d4f' }}>*</span></label>
//                 <Select placeholder="Select region" style={{ width: '100%' }} size="small" value={formData.region || undefined} onChange={handleRegionChange}>
//                   {regionOptions.map(r => <Option key={r} value={r}>{r}</Option>)}
//                 </Select>
//               </Col>
//               <Col span={8}>
//                 <label style={lbl}>Subregion</label>
//                 <Select placeholder="Select subregion" style={{ width: '100%' }} size="small" value={formData.subregion || undefined}
//                   onChange={v => setFormData(prev => ({ ...prev, subregion: v }))} disabled={!formData.region} allowClear>
//                   {(subregionOptions[formData.region] || []).map(s => <Option key={s} value={s}>{s}</Option>)}
//                 </Select>
//               </Col>
//               <Col span={8}>
//                 <label style={lbl}>Language(s)</label>
//                 <input type="text" name="language" value={formData.language} onChange={handleInputChange} style={inputStyle}
//                   placeholder="e.g., English, Spanish"
//                   onFocus={e => e.target.style.borderColor = '#1890ff'} onBlur={e => e.target.style.borderColor = '#d9d9d9'} />
//               </Col>
//             </Row>

//             {/* Row 3 — Currency */}
//             <Row gutter={12} style={{ marginBottom: 14 }}>
//               <Col span={8}>
//                 <label style={lbl}>Currency Code <span style={{ color: '#ff4d4f' }}>*</span></label>
//                 <input type="text" name="currency" value={formData.currency} onChange={handleInputChange} maxLength={3} style={{ ...inputStyle, textTransform: 'uppercase' }}
//                   placeholder="e.g., USD"
//                   onFocus={e => e.target.style.borderColor = '#1890ff'} onBlur={e => e.target.style.borderColor = '#d9d9d9'} />
//               </Col>
//               <Col span={8}>
//                 <label style={lbl}>Currency Symbol</label>
//                 <input type="text" name="currencySymbol" value={formData.currencySymbol} onChange={handleInputChange} style={inputStyle}
//                   placeholder="e.g., $"
//                   onFocus={e => e.target.style.borderColor = '#1890ff'} onBlur={e => e.target.style.borderColor = '#d9d9d9'} />
//               </Col>
//               <Col span={8}>
//                 <label style={lbl}>Currency Name</label>
//                 <input type="text" name="currencyName" value={formData.currencyName} onChange={handleInputChange} style={inputStyle}
//                   placeholder="e.g., US Dollar"
//                   onFocus={e => e.target.style.borderColor = '#1890ff'} onBlur={e => e.target.style.borderColor = '#d9d9d9'} />
//               </Col>
//             </Row>

//             {/* Row 4 — Contact / Time */}
//             <Row gutter={12} style={{ marginBottom: 14 }}>
//               <Col span={8}>
//                 <label style={lbl}>Phone Code</label>
//                 <input type="text" name="phoneCode" value={formData.phoneCode} onChange={handleInputChange} style={inputStyle}
//                   placeholder="e.g., +1"
//                   onFocus={e => e.target.style.borderColor = '#1890ff'} onBlur={e => e.target.style.borderColor = '#d9d9d9'} />
//               </Col>
//               <Col span={8}>
//                 <label style={lbl}>Timezone</label>
//                 <input type="text" name="timezone" value={formData.timezone} onChange={handleInputChange} style={inputStyle}
//                   placeholder="e.g., UTC-5 to UTC-10"
//                   onFocus={e => e.target.style.borderColor = '#1890ff'} onBlur={e => e.target.style.borderColor = '#d9d9d9'} />
//               </Col>
//               <Col span={8}>
//                 <label style={lbl}>Status</label>
//                 <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
//                   <Switch checked={formData.status} onChange={handleStatusToggle}
//                     checkedChildren="Active" unCheckedChildren="Inactive"
//                     style={{ backgroundColor: formData.status ? '#52c41a' : '#ff4d4f' }} />
//                   <Text style={{ fontSize: 12, color: formData.status ? '#52c41a' : '#ff4d4f', fontWeight: 500 }}>
//                     {formData.status ? 'Active' : 'Inactive'}
//                   </Text>
//                 </div>
//               </Col>
//             </Row>

//             <Divider style={{ margin: '12px 0' }} />
//             <div style={{ textAlign: 'right' }}>
//               <Button onClick={closeModal} style={{ marginRight: 8 }}>Cancel</Button>
//               <Button type="primary" loading={loading} onClick={handleSubmit} icon={editingCountry ? <EditOutlined /> : <PlusOutlined />}>
//                 {loading ? 'Saving...' : editingCountry ? 'Update Country' : 'Create Country'}
//               </Button>
//             </div>
//           </div>
//         </>
//       )}


//       {/* ══ DELETE MODAL ══ */}
//       {showDeleteModal && countryToDelete && (
//         <>
//           <div style={backdropStyle} onClick={closeDeleteModal} />
//           <div style={{ ...modalBoxStyle('440px'), textAlign: 'center' }}>
//             <ExclamationCircleOutlined style={{ fontSize: 40, color: '#ff4d4f', marginBottom: 10 }} />
//             <h3 style={{ color: '#ff4d4f', marginBottom: 6 }}>Delete Country</h3>
//             <p style={{ fontSize: 14, marginBottom: 10 }}>Are you sure you want to delete this country?</p>
//             <div style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 4, marginBottom: 12, textAlign: 'left', fontSize: 13 }}>
//               {[
//                 ['Country', countryToDelete.name],
//                 ['Code', countryToDelete.code],
//                 ['Capital', countryToDelete.capital],
//                 ['Region', countryToDelete.region],
//                 ['Currency', `${countryToDelete.currencySymbol} ${countryToDelete.currency}`],
//                 ['Status', countryToDelete.status],
//               ].map(([k, v]) => <p key={k} style={{ margin: '3px 0' }}><strong>{k}:</strong> {v}</p>)}
//             </div>
//             <p style={{ color: '#ff7875', fontSize: 12, marginBottom: 16 }}>This action cannot be undone.</p>
//             <Space>
//               <Button onClick={closeDeleteModal}>Cancel</Button>
//               <Button danger type="primary" onClick={handleDelete} icon={<DeleteOutlined />}>Delete Country</Button>
//             </Space>
//           </div>
//         </>
//       )}

//     </div>
//   );
// };

// export default AddCountry;




// components/Country.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Typography, Row, Col, Table, Space, Button, Input,
  Badge, Tooltip, message, Divider, Avatar, Modal,
  Select, Form, Pagination,
} from 'antd';
import {
  GlobalOutlined, PlusOutlined, ReloadOutlined, EditOutlined,
  DeleteOutlined, SearchOutlined, ExclamationCircleOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import axiosInstance from '../../config';


const { Title, Text } = Typography;
const { Option } = Select;

const PAGE_SIZE = 10;

// ── Extract paginated response ─────────────────────────────────────────────
const extractPaginatedResponse = (res) => {
  console.log("Raw API Response:", res);

  // Case 1: Response has data property with pagination
  if (res?.data && typeof res.data === "object" && "totalRecords" in res.data) {
    return {
      rows: Array.isArray(res.data.data) ? res.data.data : [],
      total: Number(res.data.totalRecords) || 0,
      page: Number(res.data.page) || 1,
      pageSize: Number(res.data.pageSize) || PAGE_SIZE,
    };
  }

  // Case 2: Response itself has pagination
  if (res && typeof res === "object" && "totalRecords" in res) {
    return {
      rows: Array.isArray(res.data) ? res.data : [],
      total: Number(res.totalRecords) || 0,
      page: Number(res.page) || 1,
      pageSize: Number(res.pageSize) || PAGE_SIZE,
    };
  }

  // Case 3: Direct array response
  if (Array.isArray(res)) {
    return { rows: res, total: res.length, page: 1, pageSize: res.length };
  }

  // Case 4: Response.data is array
  if (Array.isArray(res?.data)) {
    return { rows: res.data, total: res.data.length, page: 1, pageSize: res.data.length };
  }

  console.warn("[extractPaginatedResponse] unrecognised shape:", res);
  return { rows: [], total: 0, page: 1, pageSize: PAGE_SIZE };
};

// ── Currency cache — avoid duplicate fetches ──────────────────────────────────
const currencyCache = {};

const fetchCurrencyById = async (id) => {
  if (!id) return null;
  if (currencyCache[id]) return currencyCache[id];
  try {
    const res = await axiosInstance.get(`/Currency/get-currency/${id}`);
    const data = res?.data ?? res;
    currencyCache[id] = data;
    return data;
  } catch { return null; }
};

// ── Inline PaginationBar ───────────────────────────────────────────────────
function PaginationBar({ page, pageSize, total, onChange, loading }) {
  if (total === 0) return null;

  return (
    <div style={{
      display: "flex",
      justifyContent: "flex-end",
      alignItems: "center",
      padding: "12px 16px",
      borderTop: "1px solid #f0f0f0",
      background: "#FAFAFA",
      flexShrink: 0,
    }}>
      <Pagination
        current={page}
        pageSize={pageSize}
        total={total}
        size="small"
        showTotal={(t) => `Total ${t} countries`}
        onChange={onChange}
        showSizeChanger={false}
        disabled={loading}
      />
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon }) => (
  <div style={{
    background: 'white', borderRadius: 8, padding: '12px 16px',
    borderTop: `3px solid ${color}`,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    display: 'flex', alignItems: 'center', gap: 12,
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: 40,
      background: `${color}15`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 20, color,
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const Country = () => {
  const [countries, setCountries] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Pagination ──
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const currentPageRef = useRef(1);

  // ── Search ──
  const [searchText, setSearchText] = useState('');
  const searchRef = useRef('');
  const searchDebounceRef = useRef(null);

  // ── Modal / form ──
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState(null);
  const [sortedInfo, setSortedInfo] = useState({ columnKey: 'id', order: 'ascend' });
  const [form] = Form.useForm();

  // ── Fetch countries (server-side pagination + search) ────────────────────
  const fetchCountries = useCallback(async (targetPage) => {
    const pg = targetPage ?? currentPageRef.current;
    const search = searchRef.current;

    console.log("Fetching countries - Page:", pg, "Search:", search);

    setTableLoading(true);
    try {
      const params = {
        Page: pg,
        PageSize: PAGE_SIZE,
        IsPaginated: true
      };
      if (search?.trim()) params.Search = search.trim();

      const response = await axiosInstance.get('/Country/get-country', { params });
      console.log("API Response:", response);

      const { rows, total, page } = extractPaginatedResponse(response);
      console.log("Extracted - Rows:", rows.length, "Total:", total, "Page:", page);

      // Enrich each country with currency details via GET /Currency/{id}
      // Directly map response fields — no extra API call needed
      const enriched = rows.map((item) => ({
        id: item.id,
        name: item.name || '',
        code: item.code || '',
        currencyId: item.currencyId || null,
        timeZoneId: item.timeZoneId || null,
        currencyName: item.currencyName || '',
        currencySymbol: item.currencySymbol || '',
        createdAt: item.createdAt || null,
        updatedAt: item.updatedAt || null,
        createdAtFormatted: item.createdAt
          ? new Date(item.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
          : '-',
      }));

      setCountries(enriched);
      setTotalRecords(total);
      setCurrentPage(page);
      currentPageRef.current = page;

      console.log("State updated - TotalRecords:", total, "CurrentPage:", page);
    } catch (err) {
      console.error('fetchCountries:', err);
      message.error('Failed to fetch countries');
      setCountries([]);
      setTotalRecords(0);
    } finally {
      setTableLoading(false);
    }
  }, []);

  // ── Reset to page 1 and fetch ─────────────────────────────────────────
  const resetAndFetch = useCallback(() => {
    currentPageRef.current = 1;
    setCurrentPage(1);
    fetchCountries(1);
  }, [fetchCountries]);

  // ── Fetch currencies for dropdown ────────────────────────────────────────
  const fetchCurrencies = async () => {
    try {
      const res = await axiosInstance.get('/Currency/get-all-currency');
      const data = res?.data ?? res;
      setCurrencies(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      console.error('fetchCurrencies:', err);
    }
  };

  // ── Search handler — debounced 400ms ─────────────────────────────────────
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchText(val);
    searchRef.current = val;

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      resetAndFetch();
    }, 400);
  };

  const handleSearchClear = () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setSearchText('');
    searchRef.current = '';
    resetAndFetch();
  };

  // ── Page change ──────────────────────────────────────────────────────────
  const handlePageChange = (newPage) => {
    console.log("Page changed to:", newPage);
    currentPageRef.current = newPage;
    setCurrentPage(newPage);
    fetchCountries(newPage);
  };

  // ── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchCountries(1);
    fetchCurrencies();
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [fetchCountries]);

  // ── Create / Update ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        name: values.name.trim(),
        code: values.code?.toUpperCase().trim() || null,
        currencyId: values.currencyId || null,
      };

      if (editingCountry) {
        await axiosInstance.put(`/Country/update-country/${editingCountry.id}`, payload);
        message.success('Country updated successfully!');
      } else {
        await axiosInstance.post('/Country/add-country', payload);
        message.success('Country created successfully!');
      }

      // Clear currency cache for affected id so fresh data loads
      if (payload.currencyId) delete currencyCache[payload.currencyId];

      handleCloseModal();
      fetchCountries(currentPageRef.current);
    } catch (err) {
      console.error('Submit error:', err);
      message.error(err?.response?.data?.message || err?.message || 'Failed to save country');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = (record) => {
    Modal.confirm({
      title: 'Delete Country',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: (
        <div>
          <p>Are you sure you want to delete this country?</p>
          <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: 6, marginTop: 12 }}>
            <p style={{ margin: 0 }}><strong>Name:</strong> {record.name}</p>
            <p style={{ margin: '8px 0 0' }}><strong>Code:</strong> {record.code || '—'}</p>
            <p style={{ margin: '8px 0 0' }}><strong>Currency:</strong> {record.currencyCode || '—'}</p>
          </div>
          <p style={{ color: '#ff7875', marginTop: 12, fontSize: 12 }}>
            This action cannot be undone.
          </p>
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setSubmitting(true);
          await axiosInstance.delete(`/remove-country/${record.id}`);
          message.success('Country deleted successfully!');

          // Handle pagination after delete
          const remainingItems = totalRecords - 1;
          const newPage = remainingItems <= (currentPage - 1) * PAGE_SIZE && currentPage > 1
            ? currentPage - 1
            : currentPage;

          currentPageRef.current = newPage;
          setCurrentPage(newPage);
          await fetchCountries(newPage);
        } catch (err) {
          console.error('Delete error:', err);
          message.error(err?.response?.data?.message || 'Failed to delete country');
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  // ── Modal helpers ────────────────────────────────────────────────────────
  const handleOpenCreateModal = () => {
    setEditingCountry(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record) => {
    setEditingCountry(record);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      currencyId: record.currencyId,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCountry(null);
    form.resetFields();
  };

  // ── Client-side sorting ─────────────────────────────────────────────────
  const getSortedData = () => {
    if (!sortedInfo.columnKey || !sortedInfo.order) return countries;

    return [...countries].sort((a, b) => {
      let valA, valB;
      switch (sortedInfo.columnKey) {
        case 'id':
          return sortedInfo.order === 'ascend' ? a.id - b.id : b.id - a.id;
        case 'name':
          valA = a.name || '';
          valB = b.name || '';
          break;
        case 'currency':
          valA = a.currencyCode || '';
          valB = b.currencyCode || '';
          break;
        case 'createdAt':
          valA = new Date(a.createdAt || 0);
          valB = new Date(b.createdAt || 0);
          return sortedInfo.order === 'ascend' ? valA - valB : valB - valA;
        default:
          return 0;
      }

      const cmp = String(valA).localeCompare(String(valB));
      return sortedInfo.order === 'ascend' ? cmp : -cmp;
    });
  };

  const sortedCountries = getSortedData();

  // ── Columns ──────────────────────────────────────────────────────────────
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      sorter: true,
      sortOrder: sortedInfo.columnKey === 'id' && sortedInfo.order,
      render: (id, record, index) => (
        <Text style={{ fontSize: 12 }}>{index + 1}</Text>
      ),
    },
    {
      title: 'Country',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      sorter: true,
      sortOrder: sortedInfo.columnKey === 'name' ? sortedInfo.order : null,
      render: (name, record) => (
        <Space>
          <Avatar
            icon={<GlobalOutlined />}
            style={{ backgroundColor: '#1890ff', flexShrink: 0 }}
            size={32}
          />
          <div>
            <Text strong style={{ fontSize: 13 }}>{name || '—'}</Text>
            {record.code && (
              <div>
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  background: '#EFF6FF', color: '#1D4ED8',
                  border: '1px solid #BFDBFE',
                  borderRadius: 99, padding: '0 7px',
                }}>
                  {record.code}
                </span>
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Currency',
      dataIndex: "currencyName",
      key: 'currencyName',
      width: 200,
      sorter: true,
      sortOrder: sortedInfo.columnKey === 'currencyName' ? sortedInfo.order : null,
      render: (_, record) => (
        record.currencyName ? (
          <Space>
            <Avatar
              icon={<DollarOutlined />}
              style={{ backgroundColor: '#52c41a', flexShrink: 0 }}
              size={28}
            />
            <div>
              <Text strong style={{ fontSize: 13 }}>{record.currencyName}</Text>
              {record.currencySymbol && (
                <div>
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    background: '#EFF6FF', color: '#1D4ED8',
                    border: '1px solid #BFDBFE',
                    borderRadius: 99, padding: '0 7px',
                  }}>
                    {record.currencySymbol}
                  </span>
                </div>
              )}
            </div>
          </Space>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
        )
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAtFormatted',
      key: 'createdAt',
      width: 160,
      sorter: true,
      sortOrder: sortedInfo.columnKey === 'createdAt' ? sortedInfo.order : null,
      render: (date) => (
        <Text style={{ fontSize: 12, color: '#6B7280' }}>
          {date || '—'}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 90,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />}
              onClick={() => handleOpenEditModal(record)}
              style={{ color: '#1890ff' }} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button type="text" size="small" icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
              style={{ color: '#ff4d4f' }} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleTableChange = (_, __, sorter) => {
    if (sorter && sorter.columnKey) {
      setSortedInfo({ columnKey: sorter.columnKey, order: sorter.order });
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      backgroundColor: '#f0f2f5', padding: '16px 24px',
      boxSizing: 'border-box', overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16, flexShrink: 0,
      }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <GlobalOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            Country Management
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Manage countries and their currencies
          </Text>
        </div>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateModal}>
            Add Country
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchCountries(currentPageRef.current)}
            loading={tableLoading}
          >
            Refresh
          </Button>
        </Space>
      </div>

      {/* Stat Card */}
      {/*  <Row gutter={16} style={{ marginBottom: 16, flexShrink: 0 }}>
        <Col span={24}>
          <StatCard
            label="Total Countries"
            value={totalRecords}
            color="#1890ff"
            icon={<GlobalOutlined />}
          />
        </Col>
      </Row> */}

      {/* Search bar */}
      <div style={{
        backgroundColor: 'white', borderRadius: 8,
        padding: '12px 16px', marginBottom: 16, flexShrink: 0,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={20} md={20}>
            <Input
              placeholder="Search by country name, code, or currency..."
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              value={searchText}
              onChange={handleSearchChange}
              allowClear
              onClear={handleSearchClear}
            />
          </Col>
          <Col xs={24} sm={4} md={4} style={{ textAlign: 'right' }}>
            <Text style={{ fontSize: 12, color: '#888' }}>
              {countries.length} / {totalRecords}
            </Text>
          </Col>
        </Row>
      </div>

      {/* Table with Pagination */}
      <div style={{
        flex: 1, backgroundColor: 'white', borderRadius: 8,
        border: '1px solid #E5E7EB',
        overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0,
      }}>
        {/* Table header bar */}
        <div style={{
          padding: '10px 16px', borderBottom: '1px solid #f0f0f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <Text strong style={{ fontSize: 14, color: '#1e293b' }}>Countries List</Text>
          <Badge count={totalRecords} overflowCount={9999} style={{ backgroundColor: '#1890ff' }} />
        </div>

        {/* Scrollable table body */}
        <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <Table
            columns={columns}
            dataSource={sortedCountries}
            loading={tableLoading}
            rowKey="id"
            size="middle"
            scroll={{ x: 800 }}
            pagination={false}
            onChange={handleTableChange}
            locale={{
              emptyText: (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <GlobalOutlined style={{ fontSize: 48, color: '#ccc' }} />
                  <p style={{ color: '#999', marginTop: 16 }}>
                    {searchText.trim()
                      ? `No results found for "${searchText.trim()}"`
                      : 'No countries found. Click "Add Country" to create one.'}
                  </p>
                </div>
              ),
            }}
          />
        </div>

        {/* Pagination bar */}
        {totalRecords > 0 && (
          <PaginationBar
            page={currentPage}
            pageSize={PAGE_SIZE}
            total={totalRecords}
            onChange={handlePageChange}
            loading={tableLoading}
          />
        )}
      </div>


      {/* Add / Edit Modal */}
      <Modal
        title={
          <Space>
            {editingCountry ? <EditOutlined /> : <PlusOutlined />}
            <span>{editingCountry ? 'Edit Country' : 'Add New Country'}</span>
          </Space>
        }
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={[
          <Button key="cancel" onClick={handleCloseModal}>Cancel</Button>,
          <Button key="submit" type="primary" loading={submitting} onClick={handleSubmit}>
            {submitting ? 'Saving…' : editingCountry ? 'Update Country' : 'Create Country'}
          </Button>,
        ]}
        width={500}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Country Name"
            rules={[{ required: true, message: 'Please enter country name' }]}
          >
            <Input placeholder="e.g., United States, India, Japan" />
          </Form.Item>

          <Form.Item
            name="code"
            label="Country Code"
            rules={[
              { required: true, message: 'Please enter country code' },
              { max: 3, message: 'Code cannot exceed 3 characters' },
              { pattern: /^[A-Za-z]+$/, message: 'Code must contain only letters' },
            ]}
          >
            <Input
              placeholder="e.g., USA, IND, JPN"
              style={{ textTransform: 'uppercase' }}
              maxLength={3}
            />
          </Form.Item>

          <Form.Item
            name="currencyId"
            label="Currency"
            rules={[{ required: true, message: 'Please select currency' }]}
          >
            <Select
              placeholder="Select currency"
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {currencies.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.code} — {c.name}{c.symbol ? ` (${c.symbol})` : ''}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider style={{ margin: '16px 0 0' }} />
          <div style={{
            background: '#fafafa', padding: 12,
            borderRadius: 6, marginTop: 16,
          }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <GlobalOutlined style={{ marginRight: 4 }} />
              Country information is used across the system for localization settings.
            </Text>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Country;