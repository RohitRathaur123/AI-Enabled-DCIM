// // AddCity.jsx
// import React, { useState } from 'react';
// import {
//   Typography, Row, Col, Table, Tag, Space, Button, Select,
//   Input, Badge, Tooltip, Switch, message, Divider, Avatar, InputNumber
// } from 'antd';
// import {
//   EnvironmentOutlined, SearchOutlined, PlusOutlined, ReloadOutlined,
//   CloseOutlined, ExclamationCircleOutlined, CheckCircleOutlined,
//   StopOutlined, EditOutlined, DeleteOutlined, GlobalOutlined,
//   CompassOutlined, FieldTimeOutlined
// } from '@ant-design/icons';

// const { Title, Text } = Typography;
// const { Option } = Select;

// const AddCity = () => {
//   const countriesList = [
//     { id:1, name:'United States',  code:'USA' },
//     { id:2, name:'United Kingdom', code:'GBR' },
//     { id:3, name:'India',          code:'IND' },
//     { id:4, name:'Germany',        code:'DEU' },
//     { id:5, name:'Japan',          code:'JPN' },
//     { id:6, name:'Canada',         code:'CAN' },
//     { id:7, name:'Australia',      code:'AUS' },
//   ];

//   const statesList = [
//     { id:1,  name:'California',             code:'CA',  countryId:1 },
//     { id:2,  name:'Texas',                  code:'TX',  countryId:1 },
//     { id:3,  name:'New York',               code:'NY',  countryId:1 },
//     { id:4,  name:'Ontario',                code:'ON',  countryId:6 },
//     { id:5,  name:'Quebec',                 code:'QC',  countryId:6 },
//     { id:6,  name:'British Columbia',       code:'BC',  countryId:6 },
//     { id:7,  name:'Maharashtra',            code:'MH',  countryId:3 },
//     { id:8,  name:'Karnataka',              code:'KA',  countryId:3 },
//     { id:9,  name:'Tamil Nadu',             code:'TN',  countryId:3 },
//     { id:10, name:'Bavaria',                code:'BY',  countryId:4 },
//     { id:11, name:'North Rhine-Westphalia', code:'NW',  countryId:4 },
//     { id:12, name:'Tokyo Metropolis',       code:'13',  countryId:5 },
//     { id:13, name:'Osaka',                  code:'27',  countryId:5 },
//     { id:14, name:'New South Wales',        code:'NSW', countryId:7 },
//     { id:15, name:'Victoria',               code:'VIC', countryId:7 },
//   ];

//   const [cities, setCities] = useState([
//     { id:1, name:'Los Angeles', cityCode:'LA',  countryId:1, countryName:'United States', stateId:1,  stateName:'California',      latitude:34.0522,   longitude:-118.2437, timezone:'UTC-8 / UTC-7',   status:'Active',   regDate:'2024-01-15 09:30 AM' },
//     { id:2, name:'Houston',     cityCode:'HOU', countryId:1, countryName:'United States', stateId:2,  stateName:'Texas',           latitude:29.7604,   longitude:-95.3698,  timezone:'UTC-6 / UTC-5',   status:'Active',   regDate:'2024-02-20 11:15 AM' },
//     { id:3, name:'Toronto',     cityCode:'TOR', countryId:6, countryName:'Canada',        stateId:4,  stateName:'Ontario',         latitude:43.6510,   longitude:-79.3470,  timezone:'UTC-5 / UTC-4',   status:'Active',   regDate:'2024-03-10 02:45 PM' },
//     { id:4, name:'Munich',      cityCode:'MUC', countryId:4, countryName:'Germany',       stateId:10, stateName:'Bavaria',         latitude:48.1351,   longitude:11.5820,   timezone:'UTC+1 / UTC+2',   status:'Active',   regDate:'2024-04-05 09:20 AM' },
//     { id:5, name:'Mumbai',      cityCode:'BOM', countryId:3, countryName:'India',         stateId:7,  stateName:'Maharashtra',     latitude:19.0760,   longitude:72.8777,   timezone:'UTC+5:30',         status:'Inactive', regDate:'2024-05-12 04:30 PM' },
//     { id:6, name:'Sydney',      cityCode:'SYD', countryId:7, countryName:'Australia',     stateId:14, stateName:'New South Wales', latitude:-33.8688,  longitude:151.2093,  timezone:'UTC+10 / UTC+11', status:'Active',   regDate:'2024-06-18 10:00 AM' },
//     { id:7, name:'Tokyo',       cityCode:'TYO', countryId:5, countryName:'Japan',         stateId:12, stateName:'Tokyo Metropolis',latitude:35.6762,   longitude:139.6503,  timezone:'UTC+9',            status:'Active',   regDate:'2024-07-22 01:30 PM' },
//   ]);

//   const emptyForm   = { name:'', cityCode:'', countryId:'', stateId:'', latitude:null, longitude:null, timezone:'', status:true };
//   const emptyErrors = { name:'', cityCode:'', countryId:'', stateId:'', latitude:'', longitude:'', timezone:'' };

//   const [formData, setFormData]               = useState(emptyForm);
//   const [formErrors, setFormErrors]           = useState(emptyErrors);
//   const [availableStates, setAvailableStates] = useState([]);
//   const [searchTerm, setSearchTerm]           = useState('');
//   const [countryFilter, setCountryFilter]     = useState('all');
//   const [statusFilter, setStatusFilter]       = useState('all');
//   const [showFormModal, setShowFormModal]     = useState(false);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [editingCity, setEditingCity]         = useState(null);
//   const [cityToDelete, setCityToDelete]       = useState(null);
//   const [loading, setLoading]                 = useState(false);
//   const [sortedInfo, setSortedInfo]           = useState({ columnKey:'id', order:'ascend' });

//   // ── Computed ──────────────────────────────────────────────────────────────
//   const uniqueCountries = [...new Map(cities.map(c => [c.countryId, { id:c.countryId, name:c.countryName }])).values()];
//   const totalCount      = cities.length;
//   const activeCount     = cities.filter(c => c.status === 'Active').length;
//   const inactiveCount   = cities.filter(c => c.status !== 'Active').length;
//   const countryCount    = new Set(cities.map(c => c.countryId)).size;

//   const filteredCities = cities.filter(c => {
//     const q = searchTerm.toLowerCase();
//     const matchSearch  = !searchTerm || c.name.toLowerCase().includes(q) || c.cityCode.toLowerCase().includes(q) || c.countryName.toLowerCase().includes(q) || c.stateName.toLowerCase().includes(q);
//     const matchCountry = countryFilter === 'all' || c.countryId === countryFilter;
//     const matchStatus  = statusFilter  === 'all' || c.status === statusFilter;
//     return matchSearch && matchCountry && matchStatus;
//   });

//   const formatCoord = (lat, lng) => {
//     if (lat == null || lng == null) return '-';
//     return `${Math.abs(lat).toFixed(4)}°${lat>=0?'N':'S'}, ${Math.abs(lng).toFixed(4)}°${lng>=0?'E':'W'}`;
//   };

//   // ── Validation ────────────────────────────────────────────────────────────
//   const validators = {
//     name:      v => !v ? 'City name is required' : !/^[a-zA-Z\s-]+$/.test(v) ? 'Letters, spaces and hyphens only' : '',
//     cityCode:  v => !v ? 'City code is required' : v.length < 2 ? 'Min 2 characters' : v.length > 5 ? 'Max 5 characters' : '',
//     countryId: v => !v ? 'Country is required' : '',
//     stateId:   v => !v ? 'State is required' : '',
//     latitude:  v => { if (v==null||v==='') return ''; const n=Number(v); return isNaN(n)||n<-90||n>90 ? 'Must be between -90 and 90' : ''; },
//     longitude: v => { if (v==null||v==='') return ''; const n=Number(v); return isNaN(n)||n<-180||n>180 ? 'Must be between -180 and 180' : ''; },
//     timezone:  v => { if (!v) return ''; return !/^UTC[+-]\d{1,2}(?::\d{2})?(?:\s*\/\s*UTC[+-]\d{1,2}(?::\d{2})?)?$/.test(v) ? 'Format: UTC+5:30 or UTC-8 / UTC-7' : ''; },
//   };
//   const validate = (field, value) => { const err = validators[field]?.(value) ?? ''; setFormErrors(prev => ({ ...prev, [field]: err })); return err; };
//   const validateAll = () => {
//     const errs = Object.fromEntries(Object.keys(validators).map(k => [k, validators[k](formData[k])]));
//     setFormErrors(errs);
//     return Object.values(errs).every(e => !e);
//   };

//   // ── Handlers ──────────────────────────────────────────────────────────────
//   const handleInputChange  = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); validate(name, value); };
//   const handleNumberChange = (name, value) => { setFormData(prev => ({ ...prev, [name]: value })); validate(name, value); };
//   const handleStatusToggle = (checked) => setFormData(prev => ({ ...prev, status: checked }));

//   const handleCountryChange = (value) => {
//     setAvailableStates(statesList.filter(s => s.countryId === value));
//     setFormData(prev => ({ ...prev, countryId: value, stateId: '' }));
//     validate('countryId', value);
//     setFormErrors(prev => ({ ...prev, stateId: '' }));
//   };
//   const handleStateChange = (value) => { setFormData(prev => ({ ...prev, stateId: value })); validate('stateId', value); };

//   const openAddModal    = () => { setEditingCity(null); setFormData(emptyForm); setFormErrors(emptyErrors); setAvailableStates([]); setShowFormModal(true); };
//   const openEditModal   = (c) => {
//     setAvailableStates(statesList.filter(s => s.countryId === c.countryId));
//     setEditingCity(c);
//     setFormData({ name:c.name, cityCode:c.cityCode, countryId:c.countryId, stateId:c.stateId, latitude:c.latitude, longitude:c.longitude, timezone:c.timezone||'', status:c.status==='Active' });
//     setFormErrors(emptyErrors);
//     setShowFormModal(true);
//   };
//   const closeModal       = () => { setShowFormModal(false); setEditingCity(null); setAvailableStates([]); };
//   const openDeleteModal  = (c) => { setCityToDelete(c); setShowDeleteModal(true); };
//   const closeDeleteModal = () => { setShowDeleteModal(false); setCityToDelete(null); };

//   const handleDelete = () => {
//     if (cityToDelete) { setCities(cities.filter(c => c.id !== cityToDelete.id)); message.success('City deleted!'); closeDeleteModal(); }
//   };

//   const handleSubmit = () => {
//     if (!validateAll()) { message.error('Please fix the errors in the form'); return; }
//     setLoading(true);
//     const selCountry = countriesList.find(c => c.id === formData.countryId);
//     const selState   = statesList.find(s => s.id === formData.stateId);
//     setTimeout(() => {
//       const payload = { ...formData, cityCode: formData.cityCode.toUpperCase(), countryName: selCountry?.name||'', stateName: selState?.name||'', status: formData.status ? 'Active' : 'Inactive' };
//       if (editingCity) {
//         setCities(cities.map(c => c.id === editingCity.id ? { ...c, ...payload } : c));
//         message.success('City updated successfully!');
//       } else {
//         setCities([...cities, { id: Date.now(), ...payload, regDate: new Date().toLocaleString() }]);
//         message.success('City added successfully!');
//       }
//       setLoading(false); closeModal();
//     }, 500);
//   };

//   const handleTableChange = (_, __, sorter) => setSortedInfo(sorter);

//   // ── Stat Card ─────────────────────────────────────────────────────────────
//   const StatCard = ({ label, value, color, icon }) => (
//     <div style={{ backgroundColor:'white', borderRadius:6, padding:'8px 14px', borderTop:`3px solid ${color}`, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', display:'flex', alignItems:'center', gap:10 }}>
//       <span style={{ fontSize:22, color }}>{icon}</span>
//       <div>
//         <div style={{ fontSize:11, color:'#888', lineHeight:1.3 }}>{label}</div>
//         <div style={{ fontSize:22, fontWeight:700, color, lineHeight:1.2 }}>{value}</div>
//       </div>
//     </div>
//   );

//   // ── Shared style tokens ───────────────────────────────────────────────────
//   const backdropStyle = { position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.5)', zIndex:1000 };
//   const modalBoxStyle = (width) => ({ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', backgroundColor:'white', padding:'20px', borderRadius:'8px', width, maxWidth:'95%', maxHeight:'92vh', overflowY:'auto', zIndex:1001, boxShadow:'0 4px 20px rgba(0,0,0,0.2)' });
//   const lbl       = { display:'block', marginBottom:4, fontWeight:500, fontSize:13 };
//   const inputStyle= { width:'100%', padding:'6px 10px', border:'1px solid #d9d9d9', borderRadius:6, fontSize:13, boxSizing:'border-box', outline:'none', fontFamily:'inherit' };
//   const errText   = (msg) => msg ? <Text type="danger" style={{ fontSize:11, marginTop:2, display:'block' }}>{msg}</Text> : null;

//   // ── Columns ───────────────────────────────────────────────────────────────
//   const columns = [
//     { title:'ID', dataIndex:'id', key:'id', width:52,
//       sorter:(a,b)=>a.id-b.id, sortOrder:sortedInfo.columnKey==='id'&&sortedInfo.order,
//       render: t => <Text style={{ fontSize:11 }}>{t}</Text> },
//     { title:'City', dataIndex:'name', key:'name', width:140, ellipsis:true,
//       sorter:(a,b)=>a.name.localeCompare(b.name), sortOrder:sortedInfo.columnKey==='name'&&sortedInfo.order,
//       render:(t,r)=>(
//         <Space size={4}>
//           <Avatar icon={<EnvironmentOutlined/>} style={{ backgroundColor:'#1890ff', flexShrink:0 }} size={20}/>
//           <div>
//             <Text strong style={{ fontSize:11 }}>{t}</Text>
//             <div><Text type="secondary" style={{ fontSize:10 }}>Code: {r.cityCode}</Text></div>
//           </div>
//         </Space>
//       )},
//     { title:'Country', key:'country', width:120, ellipsis:true,
//       sorter:(a,b)=>a.countryName.localeCompare(b.countryName), sortOrder:sortedInfo.columnKey==='country'&&sortedInfo.order,
//       render:(_,r)=><Space size={4}><GlobalOutlined style={{ color:'#52c41a', fontSize:11 }}/><Text style={{ fontSize:11 }}>{r.countryName}</Text></Space>,
//       filters:[...new Set(cities.map(c=>c.countryName))].map(c=>({ text:c, value:c })),
//       onFilter:(v,r)=>r.countryName===v },
//     { title:'State', key:'state', width:130, ellipsis:true,
//       sorter:(a,b)=>a.stateName.localeCompare(b.stateName),
//       render:(_,r)=><Text style={{ fontSize:11 }}>{r.stateName}</Text>,
//       filters:[...new Set(cities.map(c=>c.stateName))].map(s=>({ text:s, value:s })),
//       onFilter:(v,r)=>r.stateName===v },
//     { title:'Coordinates', key:'coordinates', width:160,
//       render:(_,r)=><Text style={{ fontSize:10 }}>{formatCoord(r.latitude, r.longitude)}</Text>,
//       sorter:(a,b)=>(a.latitude||0)-(b.latitude||0) },
//     { title:'Timezone', dataIndex:'timezone', key:'timezone', width:120, ellipsis:true,
//       sorter:(a,b)=>(a.timezone||'').localeCompare(b.timezone||''),
//       render: t => <Text style={{ fontSize:10 }}>{t||'-'}</Text> },
//     { title:'Reg. Date', dataIndex:'regDate', key:'regDate', width:130,
//       sorter:(a,b)=>new Date(a.regDate)-new Date(b.regDate),
//       render: t => <Text style={{ fontSize:10 }}>{t}</Text> },
//     { title:'Status', dataIndex:'status', key:'status', width:90,
//       sorter:(a,b)=>a.status.localeCompare(b.status), sortOrder:sortedInfo.columnKey==='status'&&sortedInfo.order,
//       render: t => <Badge status={t==='Active'?'success':'default'} text={<span style={{ fontSize:11 }}>{t}</span>}/>,
//       filters:[{ text:'Active', value:'Active' },{ text:'Inactive', value:'Inactive' }],
//       onFilter:(v,r)=>r.status===v },
//     { title:'', key:'actions', width:72, fixed:'right',
//       render:(_,r)=>(
//         <Space size={0}>
//           <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined/>} onClick={()=>openEditModal(r)} style={{ color:'#1890ff', padding:'0 3px' }}/></Tooltip>
//           <Tooltip title="Delete"><Button type="text" size="small" icon={<DeleteOutlined/>} onClick={()=>openDeleteModal(r)} style={{ color:'#ff4d4f', padding:'0 3px' }}/></Tooltip>
//         </Space>
//       )},
//   ];

//   // ══════════════════════════════════════════════════════════════════════════
//   return (
//     <div style={{ height:'100vh', display:'flex', flexDirection:'column', backgroundColor:'#f0f2f5', padding:'10px 16px', boxSizing:'border-box', overflow:'hidden' }}>

//       {/* ── HEADER ── */}
//       <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, flexShrink:0 }}>
//         <div>
//           <Title level={4} style={{ margin:0, lineHeight:1.3 }}>
//             <EnvironmentOutlined style={{ marginRight:8, color:'#1890ff' }}/>
//             Cities Management
//           </Title>
//           <Text type="secondary" style={{ fontSize:12 }}>Manage cities for data center locations</Text>
//         </div>
//         <Space>
//           <Button type="primary" icon={<PlusOutlined/>} onClick={openAddModal} size="small"
//             style={{ background:'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', border:'none' }}>
//             Add City
//           </Button>
//           <Button icon={<ReloadOutlined/>} size="small" onClick={()=>window.location.reload()}>Refresh</Button>
//         </Space>
//       </div>

//       {/* ── STAT CARDS ── */}
//       <Row gutter={10} style={{ marginBottom:8, flexShrink:0 }}>
//         <Col span={6}><StatCard label="Total Cities" value={totalCount}    color="#1890ff" icon={<EnvironmentOutlined style={{ color:'#1890ff' }}/>}/></Col>
//         <Col span={6}><StatCard label="Active"       value={activeCount}   color="#52c41a" icon={<CheckCircleOutlined style={{ color:'#52c41a' }}/>}/></Col>
//         <Col span={6}><StatCard label="Inactive"     value={inactiveCount} color="#8c8c8c" icon={<StopOutlined       style={{ color:'#8c8c8c' }}/>}/></Col>
//         <Col span={6}><StatCard label="Countries"    value={countryCount}  color="#fa8c16" icon={<GlobalOutlined     style={{ color:'#fa8c16' }}/>}/></Col>
//       </Row>

//       {/* ── FILTERS ── */}
//       <div style={{ backgroundColor:'white', borderRadius:6, padding:'8px 12px', marginBottom:8, flexShrink:0, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
//         <Row gutter={16} align="middle">
//           <Col xs={24} sm={24} md={10} lg={10}>
//             <Input placeholder="Search by city name, code, country or state..." prefix={<SearchOutlined style={{ color:'#bbb' }}/>}
//               value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} allowClear size="small"/>
//           </Col>
//           <Col xs={8} sm={6} md={6} lg={6}>
//             <Select value={countryFilter} onChange={setCountryFilter} size="small" style={{ width:'100%' }} showSearch optionFilterProp="children">
//               <Option value="all">All Countries</Option>
//               {uniqueCountries.map(c=><Option key={c.id} value={c.id}>{c.name}</Option>)}
//             </Select>
//           </Col>
//           <Col xs={8} sm={6} md={4} lg={4}>
//             <Select value={statusFilter} onChange={setStatusFilter} size="small" style={{ width:'100%' }}>
//               <Option value="all">All Status</Option>
//               <Option value="Active">Active</Option>
//               <Option value="Inactive">Inactive</Option>
//             </Select>
//           </Col>
//           <Col xs={0} sm={0} md={4} lg={4} style={{ textAlign:'right' }}>
//             <Text style={{ fontSize:12, color:'#888', whiteSpace:'nowrap' }}>{filteredCities.length} / {totalCount} shown</Text>
//           </Col>
//         </Row>
//       </div>

//       {/* ── TABLE ── */}
//       <div style={{ flex:1, backgroundColor:'white', borderRadius:6, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', overflow:'hidden', display:'flex', flexDirection:'column', minHeight:0 }}>
//         <div style={{ padding:'7px 14px', borderBottom:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
//           <Text strong style={{ fontSize:13 }}>Cities List</Text>
//           <Badge count={filteredCities.length} style={{ backgroundColor:'#1890ff' }}/>
//         </div>
//         <div style={{ flex:1, overflow:'auto', minHeight:0 }}>
//           <Table
//             columns={columns} dataSource={filteredCities} loading={loading}
//             bordered={false} rowKey="id" size="small" scroll={{ x:'max-content' }}
//             pagination={{ pageSize:8, showSizeChanger:false, showTotal:total=>`${total} cities`, size:'small', style:{ padding:'5px 14px', margin:0 } }}
//             onChange={handleTableChange} style={{ fontSize:12 }}
//             locale={{ emptyText:<div style={{ padding:'12px 0', textAlign:'center', color:'#999', fontSize:13 }}>No data found</div> }}
//           />
//         </div>
//       </div>

//       {/* ── FOOTER ── */}
//       <div style={{ textAlign:'center', paddingTop:4, fontSize:11, fontWeight:700, flexShrink:0 }}>
//       </div>


//       {/* ══ ADD / EDIT MODAL ══ */}
//       {showFormModal && (
//         <>
//           <div style={backdropStyle} onClick={closeModal}/>
//           <div style={modalBoxStyle('700px')}>
//             <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
//               <h3 style={{ margin:0, color:'#1890ff', fontSize:15 }}>{editingCity ? 'Edit City' : 'Add New City'}</h3>
//               <Button type="text" icon={<CloseOutlined/>} onClick={closeModal} style={{ color:'#666' }}/>
//             </div>

//             {/* Row 1 — Country + State */}
//             <Row gutter={12} style={{ marginBottom:14 }}>
//               <Col span={12}>
//                 <label style={lbl}>Country <span style={{ color:'#ff4d4f' }}>*</span></label>
//                 <Select placeholder="Select country" style={{ width:'100%' }} size="small"
//                   value={formData.countryId||undefined} onChange={handleCountryChange}
//                   showSearch optionFilterProp="children" status={formErrors.countryId?'error':''}>
//                   {countriesList.map(c=>(
//                     <Option key={c.id} value={c.id}>
//                       <Space size={4}><GlobalOutlined style={{ color:'#52c41a' }}/>{c.name} ({c.code})</Space>
//                     </Option>
//                   ))}
//                 </Select>
//                 {errText(formErrors.countryId)}
//               </Col>
//               <Col span={12}>
//                 <label style={lbl}>State <span style={{ color:'#ff4d4f' }}>*</span></label>
//                 <Select placeholder={formData.countryId ? 'Select state' : 'Select country first'} style={{ width:'100%' }} size="small"
//                   value={formData.stateId||undefined} onChange={handleStateChange}
//                   disabled={!formData.countryId} showSearch optionFilterProp="children" status={formErrors.stateId?'error':''}>
//                   {availableStates.map(s=><Option key={s.id} value={s.id}>{s.name} ({s.code})</Option>)}
//                 </Select>
//                 {errText(formErrors.stateId)}
//               </Col>
//             </Row>

//             {/* Row 2 — City Name + City Code */}
//             <Row gutter={12} style={{ marginBottom:14 }}>
//               <Col span={12}>
//                 <label style={lbl}>City Name <span style={{ color:'#ff4d4f' }}>*</span></label>
//                 <input type="text" name="name" value={formData.name} onChange={handleInputChange} maxLength={100}
//                   style={{ ...inputStyle, borderColor: formErrors.name ? '#ff4d4f' : '#d9d9d9' }}
//                   placeholder="e.g., Los Angeles"
//                   onFocus={e=>e.target.style.borderColor='#1890ff'} onBlur={e=>{ e.target.style.borderColor=formErrors.name?'#ff4d4f':'#d9d9d9'; validate('name',formData.name); }}/>
//                 {errText(formErrors.name)}
//               </Col>
//               <Col span={12}>
//                 <label style={lbl}>City Code <span style={{ color:'#ff4d4f' }}>*</span></label>
//                 <input type="text" name="cityCode" value={formData.cityCode} onChange={handleInputChange} maxLength={5}
//                   style={{ ...inputStyle, textTransform:'uppercase', borderColor: formErrors.cityCode ? '#ff4d4f' : '#d9d9d9' }}
//                   placeholder="e.g., LA"
//                   onFocus={e=>e.target.style.borderColor='#1890ff'} onBlur={e=>{ e.target.style.borderColor=formErrors.cityCode?'#ff4d4f':'#d9d9d9'; validate('cityCode',formData.cityCode); }}/>
//                 {errText(formErrors.cityCode)}
//               </Col>
//             </Row>

//             {/* Row 3 — Latitude + Longitude */}
//             <Row gutter={12} style={{ marginBottom:14 }}>
//               <Col span={12}>
//                 <label style={lbl}>Latitude</label>
//                 <InputNumber value={formData.latitude} onChange={v=>handleNumberChange('latitude',v)}
//                   onBlur={()=>validate('latitude',formData.latitude)}
//                   style={{ width:'100%' }} size="small" placeholder="e.g., 34.0522"
//                   step={0.0001} min={-90} max={90} precision={4}
//                   status={formErrors.latitude?'error':''}/>
//                 {formErrors.latitude
//                   ? errText(formErrors.latitude)
//                   : <Text type="secondary" style={{ fontSize:11 }}>Range: -90 to 90 (negative = South)</Text>
//                 }
//               </Col>
//               <Col span={12}>
//                 <label style={lbl}>Longitude</label>
//                 <InputNumber value={formData.longitude} onChange={v=>handleNumberChange('longitude',v)}
//                   onBlur={()=>validate('longitude',formData.longitude)}
//                   style={{ width:'100%' }} size="small" placeholder="e.g., -118.2437"
//                   step={0.0001} min={-180} max={180} precision={4}
//                   status={formErrors.longitude?'error':''}/>
//                 {formErrors.longitude
//                   ? errText(formErrors.longitude)
//                   : <Text type="secondary" style={{ fontSize:11 }}>Range: -180 to 180 (negative = West)</Text>
//                 }
//               </Col>
//             </Row>

//             {/* Row 4 — Timezone + Status */}
//             <Row gutter={12} style={{ marginBottom:14 }}>
//               <Col span={12}>
//                 <label style={lbl}>Timezone</label>
//                 <input type="text" name="timezone" value={formData.timezone} onChange={handleInputChange}
//                   style={{ ...inputStyle, borderColor: formErrors.timezone ? '#ff4d4f' : '#d9d9d9' }}
//                   placeholder="e.g., UTC-8 / UTC-7"
//                   onFocus={e=>e.target.style.borderColor='#1890ff'} onBlur={e=>{ e.target.style.borderColor=formErrors.timezone?'#ff4d4f':'#d9d9d9'; validate('timezone',formData.timezone); }}/>
//                 {errText(formErrors.timezone)}
//               </Col>
//               <Col span={12}>
//                 <label style={lbl}>Status</label>
//                 <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:4 }}>
//                   <Switch checked={formData.status} onChange={handleStatusToggle}
//                     checkedChildren="Active" unCheckedChildren="Inactive"
//                     style={{ backgroundColor: formData.status ? '#52c41a' : '#ff4d4f' }}/>
//                   <Text style={{ fontSize:12, color: formData.status ? '#52c41a' : '#ff4d4f', fontWeight:500 }}>
//                     {formData.status ? 'Active' : 'Inactive'}
//                   </Text>
//                 </div>
//               </Col>
//             </Row>

//             <Divider style={{ margin:'12px 0' }}/>
//             <div style={{ textAlign:'right' }}>
//               <Button onClick={closeModal} style={{ marginRight:8 }}>Cancel</Button>
//               <Button type="primary" loading={loading} onClick={handleSubmit} icon={editingCity ? <EditOutlined/> : <PlusOutlined/>}>
//                 {loading ? 'Saving...' : editingCity ? 'Update City' : 'Create City'}
//               </Button>
//             </div>
//           </div>
//         </>
//       )}


//       {/* ══ DELETE MODAL ══ */}
//       {showDeleteModal && cityToDelete && (
//         <>
//           <div style={backdropStyle} onClick={closeDeleteModal}/>
//           <div style={{ ...modalBoxStyle('440px'), textAlign:'center' }}>
//             <ExclamationCircleOutlined style={{ fontSize:40, color:'#ff4d4f', marginBottom:10 }}/>
//             <h3 style={{ color:'#ff4d4f', marginBottom:6 }}>Delete City</h3>
//             <p style={{ fontSize:14, marginBottom:10 }}>Are you sure you want to delete this city?</p>
//             <div style={{ backgroundColor:'#f5f5f5', padding:12, borderRadius:4, marginBottom:12, textAlign:'left', fontSize:13 }}>
//               {[
//                 ['City',        `${cityToDelete.name} (${cityToDelete.cityCode})`],
//                 ['Country',     cityToDelete.countryName],
//                 ['State',       cityToDelete.stateName],
//                 ['Coordinates', formatCoord(cityToDelete.latitude, cityToDelete.longitude)],
//                 ['Timezone',    cityToDelete.timezone || '-'],
//                 ['Status',      cityToDelete.status],
//               ].map(([k,v])=><p key={k} style={{ margin:'3px 0' }}><strong>{k}:</strong> {v}</p>)}
//             </div>
//             <p style={{ color:'#ff7875', fontSize:12, marginBottom:16 }}>This action cannot be undone.</p>
//             <Space>
//               <Button onClick={closeDeleteModal}>Cancel</Button>
//               <Button danger type="primary" onClick={handleDelete} icon={<DeleteOutlined/>}>Delete City</Button>
//             </Space>
//           </div>
//         </>
//       )}

//     </div>
//   );
// };

// export default AddCity;













// components/City.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Typography,
  Row,
  Col,
  Table,
  Space,
  Button,
  Select,
  Input,
  Badge,
  Tooltip,
  message,
  Divider,
  Avatar,
  Modal,
  Form,
  Pagination,
  Tag,
} from 'antd';
import {
  EnvironmentOutlined,
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  GlobalOutlined,
  FlagOutlined,
  UndoOutlined,
  CheckCircleOutlined,
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
        showTotal={(t) => `Total ${t} cities`}
        onChange={onChange}
        showSizeChanger={false}
        disabled={loading}
      />
    </div>
  );
}

const City = () => {
  // ── State ─────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [totalRecords, setTotalRecords] = useState(0);

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [restoringId, setRestoringId] = useState(null);

  const emptyForm = {
    name: '',
    stateId: null,
  };

  const emptyErrors = {
    name: '',
    stateId: '',
  };

  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState(emptyErrors);
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');

  const [stateFilter, setStateFilter] = useState('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [cityToDelete, setCityToDelete] = useState(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [cityToRestore, setCityToRestore] = useState(null);
  const [sortedInfo, setSortedInfo] = useState({
    columnKey: 'id',
    order: 'ascend',
  });

  // refs for server-side pagination/filters
  const currentPageRef = useRef(1);
  const searchRef = useRef("");
  const countryFilterRef = useRef("all");
  const stateFilterRef = useRef("all");
  const searchDebounceRef = useRef(null);

  // ── Helper Functions ─────────────────────────────────────────────────
  const getCountryName = (countryId) => {
    const country = countries.find(c => c.id === countryId);
    return country?.name || 'Unknown';
  };

  const getStateName = (stateId) => {
    const state = states.find(s => s.id === stateId);
    return state?.name || 'Unknown';
  };

  // ── API Functions ─────────────────────────────────────────────────────
  const fetchCountries = async () => {
    try {
      const response = await axiosInstance.get('/Country/get-country');
      const countriesData = Array.isArray(response) ? response : response?.data || [];
      setCountries(countriesData);
    } catch (error) {
      console.error('Error fetching countries:', error);
      message.error('Failed to fetch countries');
    }
  };

  const fetchStates = async () => {
    try {
      const response = await axiosInstance.get('/State/getAll-state');
      const statesData = Array.isArray(response) ? response : response?.data || [];
      setStates(statesData);
    } catch (error) {
      console.error('Error fetching states:', error);
      message.error('Failed to fetch states');
    }
  };

  // ── Fetch cities — with server-side pagination ───────────────────────
  const fetchCities = useCallback(async (targetPage) => {
    const pg = targetPage ?? currentPageRef.current;
    const search = searchRef.current;

    console.log("Fetching cities - Page:", pg, "Search:", search);

    try {
      setLoading(true);
      const response = await axiosInstance.get('/City/get-all-city', {
        params: {
          Page: pg,
          PageSize: PAGE_SIZE,
          IsPaginated: true,
          Search: search || undefined,
        }
      });

      console.log("API Response:", response);

      const { rows, total, page } = extractPaginatedResponse(response);
      console.log("Extracted - Rows:", rows.length, "Total:", total, "Page:", page);

      // Enrich cities with state and country info
      const enrichedCities = rows.map((city) => {
        const state = states.find(s => s.id === city.stateId);
        const countryId = state?.countryId;
        return {
          ...city,
          stateName: getStateName(city.stateId),
          countryId: countryId,
          countryName: getCountryName(countryId),
          createdAtFormatted: city.createdAt
            ? new Date(city.createdAt).toLocaleString()
            : '-',
          updatedAtFormatted: city.updatedAt
            ? new Date(city.updatedAt).toLocaleString()
            : '-',
          isDeleted: city.isDeleted || false,
        };
      });

      // Apply country filter client-side
      let filteredCities = enrichedCities;
      const countryFilterVal = countryFilterRef.current;
      if (countryFilterVal !== 'all') {
        filteredCities = enrichedCities.filter(c => c.countryId === countryFilterVal);
      }

      const stateFilterVal = stateFilterRef.current;
      if (stateFilterVal !== 'all') {
        filteredCities = filteredCities.filter(c => c.stateId === stateFilterVal);
      }

      setCities(filteredCities);
      setTotalRecords(total);
      setCurrentPage(page);
      currentPageRef.current = page;

      console.log("State updated - TotalRecords:", total, "CurrentPage:", page);

    } catch (error) {
      console.error('Error fetching cities:', error);
      message.error('Failed to fetch cities');
      setCities([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [states, countries]);

  // ── Reset to page 1 and fetch ─────────────────────────────────────────
  const resetAndFetch = useCallback(() => {
    currentPageRef.current = 1;
    setCurrentPage(1);
    fetchCities(1);
  }, [fetchCities]);

  // ── Search input handler — debounced 400ms ────────────────────────────
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    searchRef.current = val;

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      resetAndFetch();
    }, 400);
  };

  const handleSearchClear = () => {
    setSearchTerm("");
    searchRef.current = "";
    resetAndFetch();
  };

  // ── Country filter handler ──────────────────────────────────────────
  const handleCountryFilterChange = (val) => {
    setCountryFilter(val);
    countryFilterRef.current = val;
    resetAndFetch();
  };

  const handleStateFilterChange = (val) => {  // ✅ new
    setStateFilter(val);
    stateFilterRef.current = val;
    resetAndFetch();
  };

  const handlePageChange = (newPage) => {
    console.log("Page changed to:", newPage);
    currentPageRef.current = newPage;
    setCurrentPage(newPage);
    fetchCities(newPage);
  };

  const filteredStatesForDropdown = countryFilter === 'all'
    ? states
    : states.filter(s => s.countryId === countryFilter);

  // ── Effects ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchCountries();
    fetchStates();
  }, []);

  useEffect(() => {
    if (states.length > 0) {
      fetchCities(1);
    }
  }, [states, fetchCities]);

  // ── Computed Values ───────────────────────────────────────────────────
  const uniqueCountries = [
    ...new Map(
      cities.map((c) => [c.countryId, { id: c.countryId, name: c.countryName }])
    ).values(),
  ].filter(c => c.id);

  const totalCount = totalRecords;
  const countryCount = uniqueCountries.length;

  // Client-side sorting
  const getSortedData = () => {
    if (!sortedInfo.columnKey || !sortedInfo.order) return cities;

    return [...cities].sort((a, b) => {
      let valA, valB;
      switch (sortedInfo.columnKey) {
        case 'id':
          return sortedInfo.order === 'ascend' ? a.id - b.id : b.id - a.id;
        case 'name':
          valA = a.name || '';
          valB = b.name || '';
          break;
        case 'stateName':
          valA = a.stateName || '';
          valB = b.stateName || '';
          break;
        case 'countryName':
          valA = a.countryName || '';
          valB = b.countryName || '';
          break;
        case 'createdAt':
          valA = new Date(a.createdAt || 0);
          valB = new Date(b.createdAt || 0);
          return sortedInfo.order === 'ascend' ? valA - valB : valB - valA;
        case 'updatedAt':
          valA = new Date(a.updatedAt || 0);
          valB = new Date(b.updatedAt || 0);
          return sortedInfo.order === 'ascend' ? valA - valB : valB - valA;
        default:
          return 0;
      }

      const cmp = String(valA).localeCompare(String(valB));
      return sortedInfo.order === 'ascend' ? cmp : -cmp;
    });
  };

  const sortedCities = getSortedData();

  // ── Validation ────────────────────────────────────────────────────────
  const validators = {
    name: (v) =>
      !v || !v.trim()
        ? 'City name is required'
        : !/^[a-zA-Z\s-]+$/.test(v)
          ? 'Letters, spaces and hyphens only'
          : '',
    stateId: (v) => (!v ? 'State is required' : ''),
  };

  const validate = (field, value) => {
    const err = validators[field]?.(value) ?? '';
    setFormErrors((prev) => ({ ...prev, [field]: err }));
    return err;
  };

  const validateAll = () => {
    const errs = Object.fromEntries(
      Object.keys(validators).map((k) => [k, validators[k](formData[k])])
    );
    setFormErrors(errs);
    return Object.values(errs).every((e) => !e);
  };

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validate(name, value);
  };

  const handleStateChange = (value) => {
    setFormData((prev) => ({ ...prev, stateId: value }));
    validate('stateId', value);
  };

  const openAddModal = () => {
    setEditingCity(null);
    setFormData(emptyForm);
    setFormErrors(emptyErrors);
    setShowFormModal(true);
  };

  const openEditModal = (city) => {
    setEditingCity(city);
    setFormData({
      name: city.name,
      stateId: city.stateId,
    });
    setFormErrors(emptyErrors);
    setShowFormModal(true);
  };

  const closeModal = () => {
    setShowFormModal(false);
    setEditingCity(null);
    setFormData(emptyForm);
    setFormErrors(emptyErrors);
  };

  const openDeleteModal = (city) => {
    setCityToDelete(city);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCityToDelete(null);
  };

  const openRestoreModal = (city) => {
    setCityToRestore(city);
    setShowRestoreModal(true);
  };

  const closeRestoreModal = () => {
    setShowRestoreModal(false);
    setCityToRestore(null);
  };

  const handleDelete = async () => {
    if (!cityToDelete) return;

    setSubmitting(true);
    try {
      await axiosInstance.delete(`/City/remove-city/${cityToDelete.id}`);
      message.success('City deleted successfully!');

      // Check if we need to go to previous page
      const remainingItems = totalRecords - 1;
      const newPage = remainingItems <= (currentPage - 1) * PAGE_SIZE && currentPage > 1
        ? currentPage - 1
        : currentPage;

      currentPageRef.current = newPage;
      setCurrentPage(newPage);
      await fetchCities(newPage);

      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting city:', error);
      message.error(error?.response?.data?.message || 'Failed to delete city');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestore = async () => {
    if (!cityToRestore) return;

    setRestoringId(cityToRestore.id);
    try {
      await axiosInstance.patch(`/City/${cityToRestore.id}/restore-city`);
      message.success('City restored successfully!');

      await fetchCities(currentPageRef.current);
      closeRestoreModal();
    } catch (error) {
      console.error('Error restoring city:', error);
      message.error(error?.response?.data?.message || 'Failed to restore city');
    } finally {
      setRestoringId(null);
    }
  };

  const handleSubmit = async () => {
    if (!validateAll()) {
      message.error('Please fix the errors in the form');
      return;
    }

    setSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      stateId: formData.stateId,
    };

    try {
      if (editingCity) {
        await axiosInstance.post(`/City/update-city/${editingCity.id}`, payload);
        message.success('City updated successfully!');
      } else {
        await axiosInstance.post('/City/create-city', payload);
        message.success('City added successfully!');
      }

      await fetchCities(currentPageRef.current);
      closeModal();
    } catch (error) {
      console.error('Error submitting city:', error);
      message.error(error?.response?.data?.message || 'Failed to save city');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTableChange = (_, __, sorter) => {
    if (sorter && sorter.columnKey) {
      setSortedInfo({ columnKey: sorter.columnKey, order: sorter.order });
    }
  };

  // ── Stat Card Component ───────────────────────────────────────────────
  const StatCard = ({ label, value, color, icon }) => (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: 8,
        padding: '12px 16px',
        borderTop: `3px solid ${color}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 40, background: `${color}20`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 12, color: '#888' }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
      </div>
    </div>
  );

  // ── Table Columns ─────────────────────────────────────────────────────
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
      title: 'City',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      ellipsis: true,
      sorter: true,
      sortOrder: sortedInfo.columnKey === 'name' && sortedInfo.order,
      render: (name, record) => (
        <Space size={8}>
          <Avatar
            icon={<EnvironmentOutlined />}
            style={{
              backgroundColor: record.isDeleted ? '#d9d9d9' : '#1890ff'
            }}
            size={28}
          />
          <Text
            strong
            style={{
              fontSize: 13,
              textDecoration: record.isDeleted ? 'line-through' : 'none',
              color: record.isDeleted ? '#999' : 'inherit'
            }}
          >
            {name || '-'}
          </Text>
          {record.isDeleted && (
            <Tag color="error" style={{ fontSize: 10 }}>Deleted</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'State',
      dataIndex: 'stateName',
      key: 'stateName',
      width: 150,
      sorter: true,
      sortOrder: sortedInfo.columnKey === 'stateName' && sortedInfo.order,
      render: (stateName) => (
        <Space size={4}>
          <FlagOutlined style={{ color: '#52c41a', fontSize: 12 }} />
          <Text style={{ fontSize: 12 }}>{stateName || '-'}</Text>
        </Space>
      ),
    },
    {
      title: 'Country',
      dataIndex: 'countryName',
      key: 'countryName',
      width: 150,
      sorter: true,
      sortOrder: sortedInfo.columnKey === 'countryName' && sortedInfo.order,
      render: (countryName) => (
        <Space size={4}>
          <GlobalOutlined style={{ color: '#1890ff', fontSize: 12 }} />
          <Text style={{ fontSize: 12 }}>{countryName || '-'}</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isDeleted',
      key: 'isDeleted',
      width: 100,
      filters: [
        { text: 'Active', value: false },
        { text: 'Deleted', value: true },
      ],
      onFilter: (value, record) => record.isDeleted === value,
      render: (isDeleted) => (
        <Tag color={isDeleted ? 'error' : 'success'}>
          {isDeleted ? 'Deleted' : 'Active'}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAtFormatted',
      key: 'createdAt',
      width: 170,
      sorter: true,
      sortOrder: sortedInfo.columnKey === 'createdAt' && sortedInfo.order,
      render: (date) => (
        <Text style={{ fontSize: 11, color: '#666' }}>{date || '-'}</Text>
      ),
    },
    {
      title: 'Updated At',
      dataIndex: 'updatedAtFormatted',
      key: 'updatedAt',
      width: 170,
      sorter: true,
      sortOrder: sortedInfo.columnKey === 'updatedAt' && sortedInfo.order,
      render: (date) => (
        <Text style={{ fontSize: 11, color: '#666' }}>{date || '-'}</Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          {!record.isDeleted ? (
            <>
              <Tooltip title="Edit">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => openEditModal(record)}
                  style={{ color: '#1890ff' }}
                />
              </Tooltip>
              <Tooltip title="Delete">
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => openDeleteModal(record)}
                  style={{ color: '#ff4d4f' }}
                />
              </Tooltip>
            </>
          ) : (
            <Tooltip title="Restore">
              <Button
                type="text"
                size="small"
                icon={<UndoOutlined />}
                onClick={() => openRestoreModal(record)}
                style={{ color: '#52c41a' }}
                loading={restoringId === record.id}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f0f2f5',
        padding: '16px 24px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexShrink: 0,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <EnvironmentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            Cities Management
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Manage cities and their state associations
          </Text>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openAddModal}
            size="middle"
            style={{
              background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
              border: 'none',
            }}
          >
            Add City
          </Button>
          <Button
            icon={<ReloadOutlined />}
            size="middle"
            onClick={() => fetchCities(currentPageRef.current)}
            loading={loading}
          >
            Refresh
          </Button>
        </Space>
      </div>

      {/* Stat Cards */}
      <Row gutter={16} style={{ marginBottom: 16, flexShrink: 0 }}>
        <Col span={8}>
          <StatCard
            label="Total Cities"
            value={totalCount}
            color="#1890ff"
            icon={<EnvironmentOutlined />}
          />
        </Col>
        <Col span={8}>
          <StatCard
            label="Active Cities"
            value={cities.filter(c => !c.isDeleted).length}
            color="#52c41a"
            icon={<CheckCircleOutlined />}
          />
        </Col>
        <Col span={8}>
          <StatCard
            label="Countries"
            value={countryCount}
            color="#fa8c16"
            icon={<GlobalOutlined />}
          />
        </Col>
      </Row>

      {/* Filters */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 16,
          flexShrink: 0,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        <Row gutter={12} align="middle">
          <Col xs={24} sm={24} md={10} lg={10}>
            <Input
              placeholder="Search by city name, state or country..."
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              value={searchTerm}
              onChange={handleSearchChange}
              allowClear
              size="middle"
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Select
              value={countryFilter}
              onChange={handleCountryFilterChange}
              size="middle"
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="children"
              placeholder="Filter by country"
              allowClear
            >
              <Option value="all">All Countries</Option>
              {uniqueCountries.map((c) => (
                <Option key={c.id} value={c.id}>
                  <GlobalOutlined style={{ marginRight: 6, color: '#1890ff' }} />
                  {c.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Select
              value={stateFilter}
              onChange={handleStateFilterChange}
              size="middle"
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="children"
              placeholder="Filter by state"
              allowClear
            >
              <Option value="all">All States</Option>
              {filteredStatesForDropdown.map((s) => (
                <Option key={s.id} value={s.id}>
                  <FlagOutlined style={{ marginRight: 6, color: '#52c41a' }} />
                  {s.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={0} sm={0} md={2} lg={2} style={{ textAlign: 'right' }}>
            <Text style={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>
              {cities.length} / {totalCount}
            </Text>
          </Col>
        </Row>
      </div>

      {/* Table + Pagination */}
      <div
        style={{
          flex: 1,
          backgroundColor: 'white',
          borderRadius: 8,
          border: '1px solid #E5E7EB',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <div
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <Text strong style={{ fontSize: 13 }}>
            Cities List
          </Text>
          <Badge
            count={totalCount}
            overflowCount={9999}
            style={{ backgroundColor: '#1890ff' }}
          />
        </div>

        <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <Table
            columns={columns}
            dataSource={sortedCities}
            loading={loading}
            bordered={false}
            rowKey="id"
            size="middle"
            pagination={false}
            scroll={{ x: 900 }}
            onChange={handleTableChange}
            locale={{
              emptyText: (
                <div
                  style={{
                    padding: '40px 0',
                    textAlign: 'center',
                    color: '#999',
                    fontSize: 13,
                  }}
                >
                  <EnvironmentOutlined style={{ fontSize: 48, marginBottom: 16, color: '#ccc' }} />
                  <p>No cities found. Click "Add City" to create one.</p>
                </div>
              ),
            }}
          />
        </div>

        {/* Pagination Bar - Will only show if totalRecords > 0 */}
        {totalRecords > 0 && (
          <PaginationBar
            page={currentPage}
            pageSize={PAGE_SIZE}
            total={totalRecords}
            onChange={handlePageChange}
            loading={loading}
          />
        )}
      </div>


      {/* Add/Edit Modal */}
      <Modal
        title={
          <Space>
            <EnvironmentOutlined style={{ color: '#1890ff' }} />
            {editingCity ? 'Edit City' : 'Add New City'}
          </Space>
        }
        open={showFormModal}
        onCancel={closeModal}
        footer={null}
        width={500}
        destroyOnClose
      >
        <div style={{ marginTop: 8 }}>
          {/* State Selection */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
              State <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <Select
              placeholder="Select state"
              style={{ width: '100%' }}
              size="middle"
              value={formData.stateId || undefined}
              onChange={handleStateChange}
              showSearch
              optionFilterProp="children"
              status={formErrors.stateId ? 'error' : ''}
              disabled={submitting}
            >
              {states.map((s) => (
                <Option key={s.id} value={s.id}>
                  <Space>
                    <FlagOutlined style={{ color: '#52c41a' }} />
                   {`${s.name} (${s.statusCode ?? ''}) - ${getCountryName(s.countryId)}`}
                  </Space>
                </Option>
              ))}
            </Select>
            {formErrors.stateId && (
              <Text type="danger" style={{ fontSize: 11, marginTop: 2, display: 'block' }}>
                {formErrors.stateId}
              </Text>
            )}
          </div>

          {/* City Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
              City Name <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              maxLength={100}
              placeholder="e.g., Los Angeles"
              status={formErrors.name ? 'error' : ''}
              disabled={submitting}
            />
            {formErrors.name && (
              <Text type="danger" style={{ fontSize: 11, marginTop: 2, display: 'block' }}>
                {formErrors.name}
              </Text>
            )}
          </div>

          <Divider style={{ margin: '12px 0' }} />
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={closeModal} disabled={submitting}>
                Cancel
              </Button>
              <Button
                type="primary"
                loading={submitting}
                onClick={handleSubmit}
                icon={editingCity ? <EditOutlined /> : <PlusOutlined />}
              >
                {submitting
                  ? 'Saving...'
                  : editingCity
                    ? 'Update City'
                    : 'Create City'}
              </Button>
            </Space>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        title="Confirm Delete"
        open={showDeleteModal}
        onCancel={closeDeleteModal}
        footer={null}
        width={420}
      >
        <div style={{ textAlign: 'center' }}>
          <ExclamationCircleOutlined style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 16 }} />
          <Title level={5}>Are you sure?</Title>
          <Text>
            City <Text strong>"{cityToDelete?.name}"</Text> will be permanently deleted.
          </Text>
          <Divider />
          <Space>
            <Button onClick={closeDeleteModal} disabled={submitting}>
              Cancel
            </Button>
            <Button danger type="primary" onClick={handleDelete} loading={submitting}>
              Delete City
            </Button>
          </Space>
        </div>
      </Modal>

      {/* Restore Modal */}
      <Modal
        title="Confirm Restore"
        open={showRestoreModal}
        onCancel={closeRestoreModal}
        footer={null}
        width={420}
      >
        <div style={{ textAlign: 'center' }}>
          <UndoOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
          <Title level={5}>Restore City?</Title>
          <Text>
            City <Text strong>"{cityToRestore?.name}"</Text> will be restored and become active again.
          </Text>
          <Divider />
          <Space>
            <Button onClick={closeRestoreModal} disabled={restoringId === cityToRestore?.id}>
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleRestore}
              loading={restoringId === cityToRestore?.id}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              Restore City
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default City;