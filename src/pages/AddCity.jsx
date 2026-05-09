// AddCity.jsx
import React, { useState } from 'react';
import {
  Typography, Row, Col, Table, Tag, Space, Button, Select,
  Input, Badge, Tooltip, Switch, message, Divider, Avatar, InputNumber
} from 'antd';
import {
  EnvironmentOutlined, SearchOutlined, PlusOutlined, ReloadOutlined,
  CloseOutlined, ExclamationCircleOutlined, CheckCircleOutlined,
  StopOutlined, EditOutlined, DeleteOutlined, GlobalOutlined,
  CompassOutlined, FieldTimeOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const AddCity = () => {
  const countriesList = [
    { id:1, name:'United States',  code:'USA' },
    { id:2, name:'United Kingdom', code:'GBR' },
    { id:3, name:'India',          code:'IND' },
    { id:4, name:'Germany',        code:'DEU' },
    { id:5, name:'Japan',          code:'JPN' },
    { id:6, name:'Canada',         code:'CAN' },
    { id:7, name:'Australia',      code:'AUS' },
  ];

  const statesList = [
    { id:1,  name:'California',             code:'CA',  countryId:1 },
    { id:2,  name:'Texas',                  code:'TX',  countryId:1 },
    { id:3,  name:'New York',               code:'NY',  countryId:1 },
    { id:4,  name:'Ontario',                code:'ON',  countryId:6 },
    { id:5,  name:'Quebec',                 code:'QC',  countryId:6 },
    { id:6,  name:'British Columbia',       code:'BC',  countryId:6 },
    { id:7,  name:'Maharashtra',            code:'MH',  countryId:3 },
    { id:8,  name:'Karnataka',              code:'KA',  countryId:3 },
    { id:9,  name:'Tamil Nadu',             code:'TN',  countryId:3 },
    { id:10, name:'Bavaria',                code:'BY',  countryId:4 },
    { id:11, name:'North Rhine-Westphalia', code:'NW',  countryId:4 },
    { id:12, name:'Tokyo Metropolis',       code:'13',  countryId:5 },
    { id:13, name:'Osaka',                  code:'27',  countryId:5 },
    { id:14, name:'New South Wales',        code:'NSW', countryId:7 },
    { id:15, name:'Victoria',               code:'VIC', countryId:7 },
  ];

  const [cities, setCities] = useState([
    { id:1, name:'Los Angeles', cityCode:'LA',  countryId:1, countryName:'United States', stateId:1,  stateName:'California',      latitude:34.0522,   longitude:-118.2437, timezone:'UTC-8 / UTC-7',   status:'Active',   regDate:'2024-01-15 09:30 AM' },
    { id:2, name:'Houston',     cityCode:'HOU', countryId:1, countryName:'United States', stateId:2,  stateName:'Texas',           latitude:29.7604,   longitude:-95.3698,  timezone:'UTC-6 / UTC-5',   status:'Active',   regDate:'2024-02-20 11:15 AM' },
    { id:3, name:'Toronto',     cityCode:'TOR', countryId:6, countryName:'Canada',        stateId:4,  stateName:'Ontario',         latitude:43.6510,   longitude:-79.3470,  timezone:'UTC-5 / UTC-4',   status:'Active',   regDate:'2024-03-10 02:45 PM' },
    { id:4, name:'Munich',      cityCode:'MUC', countryId:4, countryName:'Germany',       stateId:10, stateName:'Bavaria',         latitude:48.1351,   longitude:11.5820,   timezone:'UTC+1 / UTC+2',   status:'Active',   regDate:'2024-04-05 09:20 AM' },
    { id:5, name:'Mumbai',      cityCode:'BOM', countryId:3, countryName:'India',         stateId:7,  stateName:'Maharashtra',     latitude:19.0760,   longitude:72.8777,   timezone:'UTC+5:30',         status:'Inactive', regDate:'2024-05-12 04:30 PM' },
    { id:6, name:'Sydney',      cityCode:'SYD', countryId:7, countryName:'Australia',     stateId:14, stateName:'New South Wales', latitude:-33.8688,  longitude:151.2093,  timezone:'UTC+10 / UTC+11', status:'Active',   regDate:'2024-06-18 10:00 AM' },
    { id:7, name:'Tokyo',       cityCode:'TYO', countryId:5, countryName:'Japan',         stateId:12, stateName:'Tokyo Metropolis',latitude:35.6762,   longitude:139.6503,  timezone:'UTC+9',            status:'Active',   regDate:'2024-07-22 01:30 PM' },
  ]);

  const emptyForm   = { name:'', cityCode:'', countryId:'', stateId:'', latitude:null, longitude:null, timezone:'', status:true };
  const emptyErrors = { name:'', cityCode:'', countryId:'', stateId:'', latitude:'', longitude:'', timezone:'' };

  const [formData, setFormData]               = useState(emptyForm);
  const [formErrors, setFormErrors]           = useState(emptyErrors);
  const [availableStates, setAvailableStates] = useState([]);
  const [searchTerm, setSearchTerm]           = useState('');
  const [countryFilter, setCountryFilter]     = useState('all');
  const [statusFilter, setStatusFilter]       = useState('all');
  const [showFormModal, setShowFormModal]     = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCity, setEditingCity]         = useState(null);
  const [cityToDelete, setCityToDelete]       = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [sortedInfo, setSortedInfo]           = useState({ columnKey:'id', order:'ascend' });

  // ── Computed ──────────────────────────────────────────────────────────────
  const uniqueCountries = [...new Map(cities.map(c => [c.countryId, { id:c.countryId, name:c.countryName }])).values()];
  const totalCount      = cities.length;
  const activeCount     = cities.filter(c => c.status === 'Active').length;
  const inactiveCount   = cities.filter(c => c.status !== 'Active').length;
  const countryCount    = new Set(cities.map(c => c.countryId)).size;

  const filteredCities = cities.filter(c => {
    const q = searchTerm.toLowerCase();
    const matchSearch  = !searchTerm || c.name.toLowerCase().includes(q) || c.cityCode.toLowerCase().includes(q) || c.countryName.toLowerCase().includes(q) || c.stateName.toLowerCase().includes(q);
    const matchCountry = countryFilter === 'all' || c.countryId === countryFilter;
    const matchStatus  = statusFilter  === 'all' || c.status === statusFilter;
    return matchSearch && matchCountry && matchStatus;
  });

  const formatCoord = (lat, lng) => {
    if (lat == null || lng == null) return '-';
    return `${Math.abs(lat).toFixed(4)}°${lat>=0?'N':'S'}, ${Math.abs(lng).toFixed(4)}°${lng>=0?'E':'W'}`;
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validators = {
    name:      v => !v ? 'City name is required' : !/^[a-zA-Z\s-]+$/.test(v) ? 'Letters, spaces and hyphens only' : '',
    cityCode:  v => !v ? 'City code is required' : v.length < 2 ? 'Min 2 characters' : v.length > 5 ? 'Max 5 characters' : '',
    countryId: v => !v ? 'Country is required' : '',
    stateId:   v => !v ? 'State is required' : '',
    latitude:  v => { if (v==null||v==='') return ''; const n=Number(v); return isNaN(n)||n<-90||n>90 ? 'Must be between -90 and 90' : ''; },
    longitude: v => { if (v==null||v==='') return ''; const n=Number(v); return isNaN(n)||n<-180||n>180 ? 'Must be between -180 and 180' : ''; },
    timezone:  v => { if (!v) return ''; return !/^UTC[+-]\d{1,2}(?::\d{2})?(?:\s*\/\s*UTC[+-]\d{1,2}(?::\d{2})?)?$/.test(v) ? 'Format: UTC+5:30 or UTC-8 / UTC-7' : ''; },
  };
  const validate = (field, value) => { const err = validators[field]?.(value) ?? ''; setFormErrors(prev => ({ ...prev, [field]: err })); return err; };
  const validateAll = () => {
    const errs = Object.fromEntries(Object.keys(validators).map(k => [k, validators[k](formData[k])]));
    setFormErrors(errs);
    return Object.values(errs).every(e => !e);
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleInputChange  = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); validate(name, value); };
  const handleNumberChange = (name, value) => { setFormData(prev => ({ ...prev, [name]: value })); validate(name, value); };
  const handleStatusToggle = (checked) => setFormData(prev => ({ ...prev, status: checked }));

  const handleCountryChange = (value) => {
    setAvailableStates(statesList.filter(s => s.countryId === value));
    setFormData(prev => ({ ...prev, countryId: value, stateId: '' }));
    validate('countryId', value);
    setFormErrors(prev => ({ ...prev, stateId: '' }));
  };
  const handleStateChange = (value) => { setFormData(prev => ({ ...prev, stateId: value })); validate('stateId', value); };

  const openAddModal    = () => { setEditingCity(null); setFormData(emptyForm); setFormErrors(emptyErrors); setAvailableStates([]); setShowFormModal(true); };
  const openEditModal   = (c) => {
    setAvailableStates(statesList.filter(s => s.countryId === c.countryId));
    setEditingCity(c);
    setFormData({ name:c.name, cityCode:c.cityCode, countryId:c.countryId, stateId:c.stateId, latitude:c.latitude, longitude:c.longitude, timezone:c.timezone||'', status:c.status==='Active' });
    setFormErrors(emptyErrors);
    setShowFormModal(true);
  };
  const closeModal       = () => { setShowFormModal(false); setEditingCity(null); setAvailableStates([]); };
  const openDeleteModal  = (c) => { setCityToDelete(c); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setShowDeleteModal(false); setCityToDelete(null); };

  const handleDelete = () => {
    if (cityToDelete) { setCities(cities.filter(c => c.id !== cityToDelete.id)); message.success('City deleted!'); closeDeleteModal(); }
  };

  const handleSubmit = () => {
    if (!validateAll()) { message.error('Please fix the errors in the form'); return; }
    setLoading(true);
    const selCountry = countriesList.find(c => c.id === formData.countryId);
    const selState   = statesList.find(s => s.id === formData.stateId);
    setTimeout(() => {
      const payload = { ...formData, cityCode: formData.cityCode.toUpperCase(), countryName: selCountry?.name||'', stateName: selState?.name||'', status: formData.status ? 'Active' : 'Inactive' };
      if (editingCity) {
        setCities(cities.map(c => c.id === editingCity.id ? { ...c, ...payload } : c));
        message.success('City updated successfully!');
      } else {
        setCities([...cities, { id: Date.now(), ...payload, regDate: new Date().toLocaleString() }]);
        message.success('City added successfully!');
      }
      setLoading(false); closeModal();
    }, 500);
  };

  const handleTableChange = (_, __, sorter) => setSortedInfo(sorter);

  // ── Stat Card ─────────────────────────────────────────────────────────────
  const StatCard = ({ label, value, color, icon }) => (
    <div style={{ backgroundColor:'white', borderRadius:6, padding:'8px 14px', borderTop:`3px solid ${color}`, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', display:'flex', alignItems:'center', gap:10 }}>
      <span style={{ fontSize:22, color }}>{icon}</span>
      <div>
        <div style={{ fontSize:11, color:'#888', lineHeight:1.3 }}>{label}</div>
        <div style={{ fontSize:22, fontWeight:700, color, lineHeight:1.2 }}>{value}</div>
      </div>
    </div>
  );

  // ── Shared style tokens ───────────────────────────────────────────────────
  const backdropStyle = { position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.5)', zIndex:1000 };
  const modalBoxStyle = (width) => ({ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', backgroundColor:'white', padding:'20px', borderRadius:'8px', width, maxWidth:'95%', maxHeight:'92vh', overflowY:'auto', zIndex:1001, boxShadow:'0 4px 20px rgba(0,0,0,0.2)' });
  const lbl       = { display:'block', marginBottom:4, fontWeight:500, fontSize:13 };
  const inputStyle= { width:'100%', padding:'6px 10px', border:'1px solid #d9d9d9', borderRadius:6, fontSize:13, boxSizing:'border-box', outline:'none', fontFamily:'inherit' };
  const errText   = (msg) => msg ? <Text type="danger" style={{ fontSize:11, marginTop:2, display:'block' }}>{msg}</Text> : null;

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = [
    { title:'ID', dataIndex:'id', key:'id', width:52,
      sorter:(a,b)=>a.id-b.id, sortOrder:sortedInfo.columnKey==='id'&&sortedInfo.order,
      render: t => <Text style={{ fontSize:11 }}>{t}</Text> },
    { title:'City', dataIndex:'name', key:'name', width:140, ellipsis:true,
      sorter:(a,b)=>a.name.localeCompare(b.name), sortOrder:sortedInfo.columnKey==='name'&&sortedInfo.order,
      render:(t,r)=>(
        <Space size={4}>
          <Avatar icon={<EnvironmentOutlined/>} style={{ backgroundColor:'#1890ff', flexShrink:0 }} size={20}/>
          <div>
            <Text strong style={{ fontSize:11 }}>{t}</Text>
            <div><Text type="secondary" style={{ fontSize:10 }}>Code: {r.cityCode}</Text></div>
          </div>
        </Space>
      )},
    { title:'Country', key:'country', width:120, ellipsis:true,
      sorter:(a,b)=>a.countryName.localeCompare(b.countryName), sortOrder:sortedInfo.columnKey==='country'&&sortedInfo.order,
      render:(_,r)=><Space size={4}><GlobalOutlined style={{ color:'#52c41a', fontSize:11 }}/><Text style={{ fontSize:11 }}>{r.countryName}</Text></Space>,
      filters:[...new Set(cities.map(c=>c.countryName))].map(c=>({ text:c, value:c })),
      onFilter:(v,r)=>r.countryName===v },
    { title:'State', key:'state', width:130, ellipsis:true,
      sorter:(a,b)=>a.stateName.localeCompare(b.stateName),
      render:(_,r)=><Text style={{ fontSize:11 }}>{r.stateName}</Text>,
      filters:[...new Set(cities.map(c=>c.stateName))].map(s=>({ text:s, value:s })),
      onFilter:(v,r)=>r.stateName===v },
    { title:'Coordinates', key:'coordinates', width:160,
      render:(_,r)=><Text style={{ fontSize:10 }}>{formatCoord(r.latitude, r.longitude)}</Text>,
      sorter:(a,b)=>(a.latitude||0)-(b.latitude||0) },
    { title:'Timezone', dataIndex:'timezone', key:'timezone', width:120, ellipsis:true,
      sorter:(a,b)=>(a.timezone||'').localeCompare(b.timezone||''),
      render: t => <Text style={{ fontSize:10 }}>{t||'-'}</Text> },
    { title:'Reg. Date', dataIndex:'regDate', key:'regDate', width:130,
      sorter:(a,b)=>new Date(a.regDate)-new Date(b.regDate),
      render: t => <Text style={{ fontSize:10 }}>{t}</Text> },
    { title:'Status', dataIndex:'status', key:'status', width:90,
      sorter:(a,b)=>a.status.localeCompare(b.status), sortOrder:sortedInfo.columnKey==='status'&&sortedInfo.order,
      render: t => <Badge status={t==='Active'?'success':'default'} text={<span style={{ fontSize:11 }}>{t}</span>}/>,
      filters:[{ text:'Active', value:'Active' },{ text:'Inactive', value:'Inactive' }],
      onFilter:(v,r)=>r.status===v },
    { title:'', key:'actions', width:72, fixed:'right',
      render:(_,r)=>(
        <Space size={0}>
          <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined/>} onClick={()=>openEditModal(r)} style={{ color:'#1890ff', padding:'0 3px' }}/></Tooltip>
          <Tooltip title="Delete"><Button type="text" size="small" icon={<DeleteOutlined/>} onClick={()=>openDeleteModal(r)} style={{ color:'#ff4d4f', padding:'0 3px' }}/></Tooltip>
        </Space>
      )},
  ];

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', backgroundColor:'#f0f2f5', padding:'10px 16px', boxSizing:'border-box', overflow:'hidden' }}>

      {/* ── HEADER ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, flexShrink:0 }}>
        <div>
          <Title level={4} style={{ margin:0, lineHeight:1.3 }}>
            <EnvironmentOutlined style={{ marginRight:8, color:'#1890ff' }}/>
            Cities Management
          </Title>
          <Text type="secondary" style={{ fontSize:12 }}>Manage cities for data center locations</Text>
        </div>
        <Space>
          <Button type="primary" icon={<PlusOutlined/>} onClick={openAddModal} size="small"
            style={{ background:'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', border:'none' }}>
            Add City
          </Button>
          <Button icon={<ReloadOutlined/>} size="small" onClick={()=>window.location.reload()}>Refresh</Button>
        </Space>
      </div>

      {/* ── STAT CARDS ── */}
      <Row gutter={10} style={{ marginBottom:8, flexShrink:0 }}>
        <Col span={6}><StatCard label="Total Cities" value={totalCount}    color="#1890ff" icon={<EnvironmentOutlined style={{ color:'#1890ff' }}/>}/></Col>
        <Col span={6}><StatCard label="Active"       value={activeCount}   color="#52c41a" icon={<CheckCircleOutlined style={{ color:'#52c41a' }}/>}/></Col>
        <Col span={6}><StatCard label="Inactive"     value={inactiveCount} color="#8c8c8c" icon={<StopOutlined       style={{ color:'#8c8c8c' }}/>}/></Col>
        <Col span={6}><StatCard label="Countries"    value={countryCount}  color="#fa8c16" icon={<GlobalOutlined     style={{ color:'#fa8c16' }}/>}/></Col>
      </Row>

      {/* ── FILTERS ── */}
      <div style={{ backgroundColor:'white', borderRadius:6, padding:'8px 12px', marginBottom:8, flexShrink:0, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={24} md={10} lg={10}>
            <Input placeholder="Search by city name, code, country or state..." prefix={<SearchOutlined style={{ color:'#bbb' }}/>}
              value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} allowClear size="small"/>
          </Col>
          <Col xs={8} sm={6} md={6} lg={6}>
            <Select value={countryFilter} onChange={setCountryFilter} size="small" style={{ width:'100%' }} showSearch optionFilterProp="children">
              <Option value="all">All Countries</Option>
              {uniqueCountries.map(c=><Option key={c.id} value={c.id}>{c.name}</Option>)}
            </Select>
          </Col>
          <Col xs={8} sm={6} md={4} lg={4}>
            <Select value={statusFilter} onChange={setStatusFilter} size="small" style={{ width:'100%' }}>
              <Option value="all">All Status</Option>
              <Option value="Active">Active</Option>
              <Option value="Inactive">Inactive</Option>
            </Select>
          </Col>
          <Col xs={0} sm={0} md={4} lg={4} style={{ textAlign:'right' }}>
            <Text style={{ fontSize:12, color:'#888', whiteSpace:'nowrap' }}>{filteredCities.length} / {totalCount} shown</Text>
          </Col>
        </Row>
      </div>

      {/* ── TABLE ── */}
      <div style={{ flex:1, backgroundColor:'white', borderRadius:6, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', overflow:'hidden', display:'flex', flexDirection:'column', minHeight:0 }}>
        <div style={{ padding:'7px 14px', borderBottom:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <Text strong style={{ fontSize:13 }}>Cities List</Text>
          <Badge count={filteredCities.length} style={{ backgroundColor:'#1890ff' }}/>
        </div>
        <div style={{ flex:1, overflow:'auto', minHeight:0 }}>
          <Table
            columns={columns} dataSource={filteredCities} loading={loading}
            bordered={false} rowKey="id" size="small" scroll={{ x:'max-content' }}
            pagination={{ pageSize:8, showSizeChanger:false, showTotal:total=>`${total} cities`, size:'small', style:{ padding:'5px 14px', margin:0 } }}
            onChange={handleTableChange} style={{ fontSize:12 }}
            locale={{ emptyText:<div style={{ padding:'12px 0', textAlign:'center', color:'#999', fontSize:13 }}>No data found</div> }}
          />
        </div>
      </div>

     


      {/* ══ ADD / EDIT MODAL ══ */}
      {showFormModal && (
        <>
          <div style={backdropStyle} onClick={closeModal}/>
          <div style={modalBoxStyle('700px')}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ margin:0, color:'#1890ff', fontSize:15 }}>{editingCity ? 'Edit City' : 'Add New City'}</h3>
              <Button type="text" icon={<CloseOutlined/>} onClick={closeModal} style={{ color:'#666' }}/>
            </div>

            {/* Row 1 — Country + State */}
            <Row gutter={12} style={{ marginBottom:14 }}>
              <Col span={12}>
                <label style={lbl}>Country <span style={{ color:'#ff4d4f' }}>*</span></label>
                <Select placeholder="Select country" style={{ width:'100%' }} size="small"
                  value={formData.countryId||undefined} onChange={handleCountryChange}
                  showSearch optionFilterProp="children" status={formErrors.countryId?'error':''}>
                  {countriesList.map(c=>(
                    <Option key={c.id} value={c.id}>
                      <Space size={4}><GlobalOutlined style={{ color:'#52c41a' }}/>{c.name} ({c.code})</Space>
                    </Option>
                  ))}
                </Select>
                {errText(formErrors.countryId)}
              </Col>
              <Col span={12}>
                <label style={lbl}>State <span style={{ color:'#ff4d4f' }}>*</span></label>
                <Select placeholder={formData.countryId ? 'Select state' : 'Select country first'} style={{ width:'100%' }} size="small"
                  value={formData.stateId||undefined} onChange={handleStateChange}
                  disabled={!formData.countryId} showSearch optionFilterProp="children" status={formErrors.stateId?'error':''}>
                  {availableStates.map(s=><Option key={s.id} value={s.id}>{s.name} ({s.code})</Option>)}
                </Select>
                {errText(formErrors.stateId)}
              </Col>
            </Row>

            {/* Row 2 — City Name + City Code */}
            <Row gutter={12} style={{ marginBottom:14 }}>
              <Col span={12}>
                <label style={lbl}>City Name <span style={{ color:'#ff4d4f' }}>*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} maxLength={100}
                  style={{ ...inputStyle, borderColor: formErrors.name ? '#ff4d4f' : '#d9d9d9' }}
                  placeholder="e.g., Los Angeles"
                  onFocus={e=>e.target.style.borderColor='#1890ff'} onBlur={e=>{ e.target.style.borderColor=formErrors.name?'#ff4d4f':'#d9d9d9'; validate('name',formData.name); }}/>
                {errText(formErrors.name)}
              </Col>
              <Col span={12}>
                <label style={lbl}>City Code <span style={{ color:'#ff4d4f' }}>*</span></label>
                <input type="text" name="cityCode" value={formData.cityCode} onChange={handleInputChange} maxLength={5}
                  style={{ ...inputStyle, textTransform:'uppercase', borderColor: formErrors.cityCode ? '#ff4d4f' : '#d9d9d9' }}
                  placeholder="e.g., LA"
                  onFocus={e=>e.target.style.borderColor='#1890ff'} onBlur={e=>{ e.target.style.borderColor=formErrors.cityCode?'#ff4d4f':'#d9d9d9'; validate('cityCode',formData.cityCode); }}/>
                {errText(formErrors.cityCode)}
              </Col>
            </Row>

            {/* Row 3 — Latitude + Longitude */}
            <Row gutter={12} style={{ marginBottom:14 }}>
              <Col span={12}>
                <label style={lbl}>Latitude</label>
                <InputNumber value={formData.latitude} onChange={v=>handleNumberChange('latitude',v)}
                  onBlur={()=>validate('latitude',formData.latitude)}
                  style={{ width:'100%' }} size="small" placeholder="e.g., 34.0522"
                  step={0.0001} min={-90} max={90} precision={4}
                  status={formErrors.latitude?'error':''}/>
                {formErrors.latitude
                  ? errText(formErrors.latitude)
                  : <Text type="secondary" style={{ fontSize:11 }}>Range: -90 to 90 (negative = South)</Text>
                }
              </Col>
              <Col span={12}>
                <label style={lbl}>Longitude</label>
                <InputNumber value={formData.longitude} onChange={v=>handleNumberChange('longitude',v)}
                  onBlur={()=>validate('longitude',formData.longitude)}
                  style={{ width:'100%' }} size="small" placeholder="e.g., -118.2437"
                  step={0.0001} min={-180} max={180} precision={4}
                  status={formErrors.longitude?'error':''}/>
                {formErrors.longitude
                  ? errText(formErrors.longitude)
                  : <Text type="secondary" style={{ fontSize:11 }}>Range: -180 to 180 (negative = West)</Text>
                }
              </Col>
            </Row>

            {/* Row 4 — Timezone + Status */}
            <Row gutter={12} style={{ marginBottom:14 }}>
              <Col span={12}>
                <label style={lbl}>Timezone</label>
                <input type="text" name="timezone" value={formData.timezone} onChange={handleInputChange}
                  style={{ ...inputStyle, borderColor: formErrors.timezone ? '#ff4d4f' : '#d9d9d9' }}
                  placeholder="e.g., UTC-8 / UTC-7"
                  onFocus={e=>e.target.style.borderColor='#1890ff'} onBlur={e=>{ e.target.style.borderColor=formErrors.timezone?'#ff4d4f':'#d9d9d9'; validate('timezone',formData.timezone); }}/>
                {errText(formErrors.timezone)}
              </Col>
              <Col span={12}>
                <label style={lbl}>Status</label>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:4 }}>
                  <Switch checked={formData.status} onChange={handleStatusToggle}
                    checkedChildren="Active" unCheckedChildren="Inactive"
                    style={{ backgroundColor: formData.status ? '#52c41a' : '#ff4d4f' }}/>
                  <Text style={{ fontSize:12, color: formData.status ? '#52c41a' : '#ff4d4f', fontWeight:500 }}>
                    {formData.status ? 'Active' : 'Inactive'}
                  </Text>
                </div>
              </Col>
            </Row>

            <Divider style={{ margin:'12px 0' }}/>
            <div style={{ textAlign:'right' }}>
              <Button onClick={closeModal} style={{ marginRight:8 }}>Cancel</Button>
              <Button type="primary" loading={loading} onClick={handleSubmit} icon={editingCity ? <EditOutlined/> : <PlusOutlined/>}>
                {loading ? 'Saving...' : editingCity ? 'Update City' : 'Create City'}
              </Button>
            </div>
          </div>
        </>
      )}


      {/* ══ DELETE MODAL ══ */}
      {showDeleteModal && cityToDelete && (
        <>
          <div style={backdropStyle} onClick={closeDeleteModal}/>
          <div style={{ ...modalBoxStyle('440px'), textAlign:'center' }}>
            <ExclamationCircleOutlined style={{ fontSize:40, color:'#ff4d4f', marginBottom:10 }}/>
            <h3 style={{ color:'#ff4d4f', marginBottom:6 }}>Delete City</h3>
            <p style={{ fontSize:14, marginBottom:10 }}>Are you sure you want to delete this city?</p>
            <div style={{ backgroundColor:'#f5f5f5', padding:12, borderRadius:4, marginBottom:12, textAlign:'left', fontSize:13 }}>
              {[
                ['City',        `${cityToDelete.name} (${cityToDelete.cityCode})`],
                ['Country',     cityToDelete.countryName],
                ['State',       cityToDelete.stateName],
                ['Coordinates', formatCoord(cityToDelete.latitude, cityToDelete.longitude)],
                ['Timezone',    cityToDelete.timezone || '-'],
                ['Status',      cityToDelete.status],
              ].map(([k,v])=><p key={k} style={{ margin:'3px 0' }}><strong>{k}:</strong> {v}</p>)}
            </div>
            <p style={{ color:'#ff7875', fontSize:12, marginBottom:16 }}>This action cannot be undone.</p>
            <Space>
              <Button onClick={closeDeleteModal}>Cancel</Button>
              <Button danger type="primary" onClick={handleDelete} icon={<DeleteOutlined/>}>Delete City</Button>
            </Space>
          </div>
        </>
      )}

    </div>
  );
};

export default AddCity;