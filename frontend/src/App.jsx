import React, { useState, useEffect } from 'react'
import Split from 'react-split'
import { 
  Layout, 
  Typography, 
  Space, 
  Button, 
  List, 
  Card, 
  Spin, 
  message, 
  Upload, 
  Tag, 
  Checkbox, 
  InputNumber, 
  Tabs, 
  Row, 
  Col, 
  Switch, 
  Tooltip,
  Badge,
  Empty,
  Collapse,
  Segmented
} from 'antd'
import { 
  FileSearchOutlined, 
  UploadOutlined, 
  CameraOutlined, 
  LineChartOutlined,
  EyeOutlined,
  SettingOutlined,
  SyncOutlined,
  DeleteOutlined,
  BranchesOutlined,
  SlidersOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  FileTextOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined
} from '@ant-design/icons'
import axios from 'axios'
import SpectrumChart from './components/SpectrumChart'
import HyperspectralViewer from './components/HyperspectralViewer'

const { Header, Content } = Layout
const { Title, Text } = Typography

// Use relative URL for the API to work through the Nginx proxy
const API_URL = '/api'; 

const OVERLAY_COLORS = [
  '#ff4d4f', // Red
  '#1890ff', // Blue
  '#52c41a', // Green
  '#faad14', // Yellow/Gold
  '#722ed1', // Purple
  '#eb2f96', // Pink
  '#13c2c2', // Cyan
  '#fa8c16', // Orange
  '#a0d911', // Lime
  '#fa541c'  // Sunset
];

function App() {
  const [ozrayFiles, setOzrayFiles] = useState([])
  const [nanoFiles, setNanoFiles] = useState([])
  const [loadingOzray, setLoadingOzray] = useState(false)
  const [loadingNano, setLoadingNano] = useState(false)
  
  // Tab control
  const [activeTab, setActiveTab] = useState('raw_csv')
  
  // Tab 1: RAW vs CSV States
  const [activeOzrayFile, setActiveOzrayFile] = useState(null)
  const [activeOzrayData, setActiveOzrayData] = useState(null)
  const [ozrayPoints, setOzrayPoints] = useState([]) // Array of {x, y, spectrum, wavelength, color}
  const [activeNanoFile, setActiveNanoFile] = useState(null)
  const [nanoSpectrums, setNanoSpectrums] = useState([])
  const [selectedNanoIndex, setSelectedNanoIndex] = useState(null)
  const [normalizeOzray, setNormalizeOzray] = useState(false)
  const [normalizeNano, setNormalizeNano] = useState(false)
  const [chartData, setChartData] = useState([])

  // Tab 2: RAW Overlay (RAW 겹쳐보기) States
  const [selectedOverlayFiles, setSelectedOverlayFiles] = useState([])
  const [loadedOverlayData, setLoadedOverlayData] = useState({}) // { [path]: data }
  const [overlayPoints, setOverlayPoints] = useState([]) // Array of { filePath, fileName, x, y, spectrum, wavelength, color, id }
  const [syncOverlayCoords, setSyncOverlayCoords] = useState(true)
  const [normalizeOverlay, setNormalizeOverlay] = useState(false)
  const [loadingOverlayFiles, setLoadingOverlayFiles] = useState({}) // { [path]: boolean }
  const [overlayChartData, setOverlayChartData] = useState([])

  // File View Modes & Sorting
  const [ozrayViewMode, setOzrayViewMode] = useState('list') // 'list' | 'thumbnail' | 'folder'
  const [ozraySortOrder, setOzraySortOrder] = useState('asc') // 'asc' | 'desc'
  
  const [nanoViewMode, setNanoViewMode] = useState('list') // 'list' | 'thumbnail'
  const [nanoSortOrder, setNanoSortOrder] = useState('asc') // 'asc' | 'desc'
  
  const [overlayViewMode, setOverlayViewMode] = useState('list') // 'list' | 'thumbnail' | 'folder'
  const [overlaySortOrder, setOverlaySortOrder] = useState('asc') // 'asc' | 'desc'

  const sortFilesByName = (files, order) => {
    const sorted = [...files]
    sorted.sort((a, b) => {
      const nameA = (a.rel_path || a.name || '').toLowerCase()
      const nameB = (b.rel_path || b.name || '').toLowerCase()
      if (order === 'asc') {
        return nameA.localeCompare(nameB)
      } else {
        return nameB.localeCompare(nameA)
      }
    })
    return sorted
  }

  const groupFilesByFolder = (files) => {
    const groups = {}
    files.forEach(file => {
      const pathParts = (file.rel_path || file.name || '').split('/')
      let folder = 'Root'
      if (pathParts.length > 1) {
        folder = pathParts.slice(0, -1).join('/')
      }
      if (!groups[folder]) {
        groups[folder] = []
      }
      groups[folder].push(file)
    })
    return groups
  }

  const renderListControls = (viewMode, setViewMode, sortOrder, setSortOrder, showFolderOption = true) => {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', background: '#262626', padding: '6px 10px', borderRadius: '4px', border: '1px solid #3d3d3d' }}>
        <Segmented
          size="small"
          value={viewMode}
          onChange={setViewMode}
          options={[
            { value: 'list', label: 'List', icon: <UnorderedListOutlined /> },
            { value: 'thumbnail', label: 'Grid', icon: <AppstoreOutlined /> },
            ...(showFolderOption ? [{ value: 'folder', label: 'Folders', icon: <FolderOpenOutlined /> }] : [])
          ]}
        />
        <Button 
          size="small" 
          type="text" 
          style={{ color: '#aaa' }}
          icon={sortOrder === 'asc' ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
        </Button>
      </div>
    )
  }

  const renderOzrayFiles = (files, viewMode, sortOrder, activeFile, onSelectAction, isOverlay = false) => {
    const sorted = sortFilesByName(files, sortOrder)

    const renderListItem = (item) => {
      const isActive = isOverlay 
        ? selectedOverlayFiles.some(f => f.path === item.path)
        : activeFile?.path === item.path;
      
      const fileIdx = isOverlay ? selectedOverlayFiles.findIndex(f => f.path === item.path) : -1;
      const assignedColor = fileIdx !== -1 ? OVERLAY_COLORS[fileIdx % OVERLAY_COLORS.length] : null;
      const isLoading = isOverlay ? loadingOverlayFiles[item.path] : false;

      return (
        <List.Item 
          key={item.path}
          actions={isOverlay ? [
            <Checkbox 
              checked={isActive} 
              onChange={() => onSelectAction(item)}
              disabled={!isActive && selectedOverlayFiles.length >= 10}
            >
              {isActive ? "Selected" : "Select"}
            </Checkbox>
          ] : [
            <Button 
              type={isActive ? "primary" : "link"} 
              size="small" 
              icon={<EyeOutlined />} 
              onClick={() => onSelectAction(item)}
            >
              {isActive ? "Active" : "View"}
            </Button>
          ]}
          style={{ 
            color: isActive ? '#1890ff' : '#aaa', 
            background: isActive ? '#111' : 'transparent',
            padding: '8px 12px',
            borderLeft: (isOverlay && isActive) ? `4px solid ${assignedColor}` : '4px solid transparent'
          }}
        >
          <Space style={{ flexWrap: 'wrap' }}>
            {isLoading && <Spin size="small" style={{ marginRight: 8 }} />}
            <Text style={{ color: isActive ? (isOverlay ? '#fff' : '#1890ff') : '#aaa', wordBreak: 'break-all' }}>{item.rel_path}</Text>
            {isOverlay && isActive && <Tag color={assignedColor}>Color Badge</Tag>}
          </Space>
        </List.Item>
      )
    }

    const renderThumbnailView = (items) => {
      return (
        <Row gutter={[8, 8]} style={{ padding: '8px 4px' }}>
          {items.map(item => {
            const isActive = isOverlay 
              ? selectedOverlayFiles.some(f => f.path === item.path)
              : activeFile?.path === item.path;
            
            const fileIdx = isOverlay ? selectedOverlayFiles.findIndex(f => f.path === item.path) : -1;
            const assignedColor = fileIdx !== -1 ? OVERLAY_COLORS[fileIdx % OVERLAY_COLORS.length] : null;

            return (
              <Col span={12} key={item.path}>
                <div 
                  onClick={() => onSelectAction(item)}
                  style={{
                    background: isActive ? '#111' : '#1f1f1f',
                    border: `1.5px solid ${isActive ? (isOverlay ? assignedColor : '#1890ff') : '#303030'}`,
                    borderRadius: '6px',
                    padding: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  className="thumbnail-card"
                >
                  <div style={{ height: '70px', background: '#000', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                    <img 
                      src={`/api/files/view?path=${encodeURIComponent(item.path)}`}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                  <Text ellipsis={{ tooltip: item.name }} style={{ color: isActive ? '#fff' : '#aaa', fontSize: '11px', fontWeight: isActive ? 'bold' : 'normal', display: 'block', wordBreak: 'break-all' }}>
                    {item.name}
                  </Text>
                  {isOverlay && isActive && (
                    <Badge color={assignedColor} style={{ position: 'absolute', top: 4, right: 4 }} />
                  )}
                </div>
              </Col>
            )
          })}
        </Row>
      )
    }

    const renderFolderView = (items) => {
      const grouped = groupFilesByFolder(items)
      return (
        <Collapse size="small" ghost expandIconPosition="end" style={{ background: 'transparent' }}>
          {Object.keys(grouped).sort().map(folder => (
            <Collapse.Panel 
              key={folder}
              header={
                <span style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>
                  <FolderOutlined style={{ marginRight: 6, color: '#faad14' }} /> {folder} ({grouped[folder].length})
                </span>
              }
              style={{ borderBottom: '1px solid #303030' }}
            >
              <List
                size="small"
                dataSource={grouped[folder]}
                renderItem={renderListItem}
              />
            </Collapse.Panel>
          ))}
        </Collapse>
      )
    }

    if (viewMode === 'thumbnail') {
      return renderThumbnailView(sorted)
    } else if (viewMode === 'folder') {
      return renderFolderView(sorted)
    } else {
      return (
        <List
          size="small"
          dataSource={sorted}
          renderItem={renderListItem}
        />
      )
    }
  }

  const renderNanoFiles = (files, viewMode, sortOrder, activeFile, onSelectAction) => {
    const sorted = sortFilesByName(files, sortOrder)

    const renderListItem = (item) => {
      const isActive = activeFile?.path === item.path
      return (
        <List.Item 
          key={item.path}
          actions={[<Button type={isActive ? "primary" : "link"} size="small" icon={<EyeOutlined />} onClick={() => onSelectAction(item)}>{isActive ? "Active" : "Load"}</Button>]}
          style={{ color: isActive ? '#52c41a' : '#aaa', background: isActive ? '#111' : 'transparent' }}
        >
          <Text ellipsis style={{ width: '80%', color: isActive ? '#52c41a' : '#aaa' }}>{item.name}</Text>
        </List.Item>
      )
    }

    const renderThumbnailView = (items) => {
      return (
        <Row gutter={[8, 8]} style={{ padding: '8px 4px' }}>
          {items.map(item => {
            const isActive = activeFile?.path === item.path
            return (
              <Col span={12} key={item.path}>
                <div 
                  onClick={() => onSelectAction(item)}
                  style={{
                    background: isActive ? '#111' : '#1f1f1f',
                    border: `1.5px solid ${isActive ? '#52c41a' : '#303030'}`,
                    borderRadius: '6px',
                    padding: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center'
                  }}
                  className="thumbnail-card"
                >
                  <FileTextOutlined style={{ fontSize: '24px', color: isActive ? '#52c41a' : '#888', marginBottom: '8px', display: 'block' }} />
                  <Text ellipsis={{ tooltip: item.name }} style={{ color: isActive ? '#fff' : '#aaa', fontSize: '11px', fontWeight: isActive ? 'bold' : 'normal', display: 'block' }}>
                    {item.name}
                  </Text>
                </div>
              </Col>
            )
          })}
        </Row>
      )
    }

    if (viewMode === 'thumbnail') {
      return renderThumbnailView(sorted)
    } else {
      return (
        <List
          size="small"
          dataSource={sorted}
          renderItem={renderListItem}
        />
      )
    }
  }

  // Global settings
  const [smoothData, setSmoothData] = useState(false)
  const [smoothWindow, setSmoothWindow] = useState(5)

  const COLORS = ['#ff4d4f', '#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96', '#13c2c2'];

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      const [oz, nano] = await Promise.all([
        axios.get(`${API_URL}/files/ozray`),
        axios.get(`${API_URL}/files/nanolambda`)
      ])
      setOzrayFiles(oz.data)
      setNanoFiles(nano.data)
    } catch (err) {
      message.error('Failed to fetch file list')
    }
  }

  // --- Tab 1: RAW vs CSV Logic ---
  const loadOzrayData = async (file) => {
    setLoadingOzray(true)
    try {
      const res = await axios.get(`${API_URL}/ozray/load`, { params: { path: file.path } })
      setActiveOzrayData(res.data)
      setActiveOzrayFile(file)
      setOzrayPoints([]) // Reset points on new file load
    } catch (err) {
      message.error('Failed to load Ozray data')
    } finally {
      setLoadingOzray(false)
    }
  }

  const handleOzrayPointSelect = async (x, y) => {
    if (!activeOzrayData) return
    try {
      const res = await axios.get(`${API_URL}/ozray/spectrum`, {
        params: {
          raw_path: activeOzrayData.raw_path,
          hdr_path: activeOzrayData.hdr_path,
          x, y
        }
      })
      
      const newPoint = {
        x, y,
        spectrum: res.data.spectrum,
        wavelength: res.data.wavelength,
        color: COLORS[ozrayPoints.length % COLORS.length],
        id: Date.now()
      }
      
      const updatedPoints = [...ozrayPoints, newPoint]
      setOzrayPoints(updatedPoints)
      updateChart(updatedPoints, selectedNanoIndex !== null ? nanoSpectrums[selectedNanoIndex] : null)
    } catch (err) {
      message.error('Failed to fetch spectrum')
    }
  }

  const removeOzrayPoint = (id) => {
    const updated = ozrayPoints.filter(p => p.id !== id)
    setOzrayPoints(updated)
    updateChart(updated, selectedNanoIndex !== null ? nanoSpectrums[selectedNanoIndex] : null)
  }

  const loadNanoData = async (file) => {
    setLoadingNano(true)
    try {
      const res = await axios.get(`${API_URL}/nanolambda/load`, { params: { path: file.path } })
      setNanoSpectrums(res.data)
      setActiveNanoFile(file)
      setSelectedNanoIndex(0)
      updateChart(ozrayPoints, res.data[0])
    } catch (err) {
      message.error('Failed to load NanoLambda data')
    } finally {
      setLoadingNano(false)
    }
  }

  const selectNanoEntry = (idx) => {
    setSelectedNanoIndex(idx)
    updateChart(ozrayPoints, nanoSpectrums[idx])
  }

  const normalizeData = (spectrum) => {
    const min = Math.min(...spectrum)
    const max = Math.max(...spectrum)
    if (max === min) return spectrum.map(() => 0)
    return spectrum.map(v => (v - min) / (max - min))
  }

  // Moving average smoothing
  const smooth = (spectrum, windowSize) => {
    if (windowSize <= 1) return spectrum
    const result = []
    const half = Math.floor(windowSize / 2)
    for (let i = 0; i < spectrum.length; i++) {
      const start = Math.max(0, i - half)
      const end = Math.min(spectrum.length, i + half + 1)
      const sub = spectrum.slice(start, end)
      result.push(sub.reduce((a, b) => a + b, 0) / sub.length)
    }
    return result
  }

  const updateChart = (points, nano) => {
    const dataMap = {}
    
    const processSpec = (spec, shouldNormalize) => {
      let processed = spec
      if (smoothData) processed = smooth(processed, smoothWindow)
      if (shouldNormalize) processed = normalizeData(processed)
      return processed
    }

    points.forEach((p) => {
      const spec = processSpec(p.spectrum, normalizeOzray)
      p.wavelength.forEach((w, i) => {
        const key = Math.round(w)
        if (!dataMap[key]) dataMap[key] = { wavelength: key }
        dataMap[key][`ozray_${p.id}`] = spec[i]
      })
    })
    
    if (nano) {
      const spec = processSpec(nano.spectrum, normalizeNano)
      nano.wavelength.forEach((w, i) => {
        const key = Math.round(w)
        if (!dataMap[key]) dataMap[key] = { wavelength: key }
        dataMap[key].nanolambda = spec[i]
      })
    }
    
    const combined = Object.values(dataMap).sort((a, b) => a.wavelength - b.wavelength)
    setChartData(combined)
  }

  // Hook to update Tab 1 chart on global parameter changes
  useEffect(() => {
    if (activeTab === 'raw_csv') {
      updateChart(ozrayPoints, selectedNanoIndex !== null ? nanoSpectrums[selectedNanoIndex] : null)
    }
  }, [normalizeOzray, normalizeNano, smoothData, smoothWindow])


  // --- Tab 2: RAW Overlay Logic ---
  const toggleOverlayFile = async (file) => {
    const isSelected = selectedOverlayFiles.some(f => f.path === file.path);
    if (isSelected) {
      // Remove file
      const updated = selectedOverlayFiles.filter(f => f.path !== file.path);
      setSelectedOverlayFiles(updated);
      
      // Remove associated points
      const updatedPoints = overlayPoints.filter(p => p.filePath !== file.path);
      setOverlayPoints(updatedPoints);
      
      // Clean loaded data state
      const newLoaded = { ...loadedOverlayData };
      delete newLoaded[file.path];
      setLoadedOverlayData(newLoaded);
    } else {
      // Add file (limit 2 to 10 files)
      if (selectedOverlayFiles.length >= 10) {
        message.warning('You can select a maximum of 10 files for overlay comparison.');
        return;
      }
      
      const updated = [...selectedOverlayFiles, file];
      setSelectedOverlayFiles(updated);
      
      // Fetch data
      setLoadingOverlayFiles(prev => ({ ...prev, [file.path]: true }));
      try {
        const res = await axios.get(`${API_URL}/ozray/load`, { params: { path: file.path } })
        setLoadedOverlayData(prev => ({ ...prev, [file.path]: res.data }))
      } catch (err) {
        message.error(`Failed to load Ozray data: ${file.name}`);
        // Back out of selection
        setSelectedOverlayFiles(prev => prev.filter(f => f.path !== file.path));
      } finally {
        setLoadingOverlayFiles(prev => ({ ...prev, [file.path]: false }));
      }
    }
  }

  const handleOverlayPointSelect = async (clickedFile, x, y) => {
    if (syncOverlayCoords) {
      // Fetch spectrum at same coordinate for ALL selected files
      const filesToFetch = selectedOverlayFiles.filter(f => loadedOverlayData[f.path]);
      if (filesToFetch.length === 0) return;
      
      const timestamp = Date.now();
      const hideMessage = message.loading('Fetching spectra from all loaded overlays...', 0);
      
      try {
        const fetchedPoints = [];
        for (let i = 0; i < filesToFetch.length; i++) {
          const f = filesToFetch[i];
          const data = loadedOverlayData[f.path];
          const fileIndex = selectedOverlayFiles.findIndex(sf => sf.path === f.path);
          const fileColor = OVERLAY_COLORS[fileIndex % OVERLAY_COLORS.length];
          
          const res = await axios.get(`${API_URL}/ozray/spectrum`, {
            params: {
              raw_path: data.raw_path,
              hdr_path: data.hdr_path,
              x, y
            }
          });
          
          fetchedPoints.push({
            filePath: f.path,
            fileName: f.name,
            x, y,
            spectrum: res.data.spectrum,
            wavelength: res.data.wavelength,
            color: fileColor,
            id: `${timestamp}_${i}`
          });
        }
        
        setOverlayPoints(prev => [...prev, ...fetchedPoints]);
        hideMessage();
        message.success(`Extracted spectrum at (${x}, ${y}) from all active overlays.`);
      } catch (err) {
        hideMessage();
        message.error('Failed to extract overlay spectra');
      }
    } else {
      // Independent mode: Fetch spectrum only for clicked file
      const data = loadedOverlayData[clickedFile.path];
      if (!data) return;
      
      const fileIndex = selectedOverlayFiles.findIndex(sf => sf.path === clickedFile.path);
      const fileColor = OVERLAY_COLORS[fileIndex % OVERLAY_COLORS.length];
      
      try {
        const res = await axios.get(`${API_URL}/ozray/spectrum`, {
          params: {
            raw_path: data.raw_path,
            hdr_path: data.hdr_path,
            x, y
          }
        });
        
        const newPoint = {
          filePath: clickedFile.path,
          fileName: clickedFile.name,
          x, y,
          spectrum: res.data.spectrum,
          wavelength: res.data.wavelength,
          color: fileColor,
          id: Date.now()
        };
        
        setOverlayPoints(prev => [...prev, newPoint]);
        message.success(`Extracted spectrum on ${clickedFile.name} at (${x}, ${y}).`);
      } catch (err) {
        message.error(`Failed to fetch spectrum for ${clickedFile.name}`);
      }
    }
  }

  const removeOverlayPoint = (id) => {
    setOverlayPoints(prev => prev.filter(p => p.id !== id));
  }

  const clearAllOverlayPoints = () => {
    setOverlayPoints([]);
    message.info('All overlay points cleared.');
  }

  const updateOverlayChart = () => {
    const dataMap = {}
    
    const processSpec = (spec) => {
      let processed = spec
      if (smoothData) processed = smooth(processed, smoothWindow)
      if (normalizeOverlay) processed = normalizeData(processed)
      return processed
    }

    overlayPoints.forEach((p) => {
      const spec = processSpec(p.spectrum)
      p.wavelength.forEach((w, i) => {
        const key = Math.round(w)
        if (!dataMap[key]) dataMap[key] = { wavelength: key }
        dataMap[key][`overlay_${p.id}`] = spec[i]
      })
    })
    
    const combined = Object.values(dataMap).sort((a, b) => a.wavelength - b.wavelength)
    setOverlayChartData(combined)
  }

  // Hook to update Tab 2 chart on parameters changes
  useEffect(() => {
    if (activeTab === 'raw_raw') {
      updateOverlayChart();
    }
  }, [overlayPoints, normalizeOverlay, smoothData, smoothWindow])

  const uploadProps = {
    name: 'file',
    action: `${API_URL}/upload`,
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} uploaded successfully`)
        fetchFiles()
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} upload failed.`)
      }
    },
  }

  // Reusable tab header layout items
  const tabItems = [
    {
      key: 'raw_csv',
      label: (
        <span style={{ fontSize: '15px', display: 'inline-flex', alignItems: 'center' }}>
          <SlidersOutlined style={{ marginRight: 8 }} />
          RAW ↔ CSV 비교 (Raw vs CSV)
        </span>
      )
    },
    {
      key: 'raw_raw',
      label: (
        <span style={{ fontSize: '15px', display: 'inline-flex', alignItems: 'center' }}>
          <BranchesOutlined style={{ marginRight: 8 }} />
          RAW 겹쳐보기 (RAW Overlay)
        </span>
      )
    }
  ]

  return (
    <Layout style={{ height: '100vh', background: '#000' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: '#001529', borderBottom: '1px solid #303030' }}>
        <Space size="large">
          <Title level={4} style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center' }}>
            <LineChartOutlined style={{ marginRight: 10, color: '#1890ff' }} />
            Hyperspectral Analysis Tool
          </Title>
        </Space>
        <Space>
          <Upload {...uploadProps} showUploadList={false}>
            <Button icon={<UploadOutlined />} type="primary">Upload Data</Button>
          </Upload>
          <Button icon={<FileSearchOutlined />} onClick={fetchFiles}>Refresh</Button>
        </Space>
      </Header>
      
      <Content style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
        {/* Navigation Tabs Bar */}
        <div style={{ background: '#141414', padding: '10px 20px 0 20px', borderBottom: '1px solid #303030' }}>
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab} 
            items={tabItems} 
            style={{ marginBottom: 0 }}
          />
        </div>

        {/* Dynamic Panels depending on Tab */}
        <div style={{ flex: 1, height: 'calc(100% - 56px)', overflow: 'hidden' }}>
          {activeTab === 'raw_csv' ? (
            /* TAB 1: Raw vs CSV Mode */
            <Split 
              className="split" 
              sizes={[50, 50]} 
              minSize={300} 
              gutterSize={8} 
              style={{ height: '100%' }}
            >
              {/* Left Panel: Ozray Single File */}
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRight: '1px solid #303030' }}>
                <div style={{ padding: '15px', background: '#141414', flex: 1, overflow: 'auto' }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Card title={<><CameraOutlined /> Ozray 1_photos_linescan</>} size="small" bordered={false} style={{ background: '#1f1f1f' }}>
                      {renderListControls(ozrayViewMode, setOzrayViewMode, ozraySortOrder, setOzraySortOrder, true)}
                      <div style={{ maxHeight: '250px', overflow: 'auto' }}>
                        {renderOzrayFiles(ozrayFiles, ozrayViewMode, ozraySortOrder, activeOzrayFile, loadOzrayData, false)}
                      </div>
                    </Card>
                    
                    {loadingOzray ? <div style={{ textAlign: 'center', padding: '20px' }}><Spin tip="Loading RAW Cube..." /></div> : (
                      activeOzrayData && (
                        <Card title="Image Preview (Select multiple points)" size="small" bordered={false} style={{ background: '#1f1f1f' }}>
                          <HyperspectralViewer 
                            imageUrl={activeOzrayData.preview_url ? `${activeOzrayData.preview_url}` : null} 
                            onPointSelect={handleOzrayPointSelect} 
                            points={ozrayPoints}
                          />
                          <div style={{ marginTop: '10px' }}>
                            <Title level={5} style={{ color: '#888', fontSize: '14px' }}>Selected Points:</Title>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {ozrayPoints.map(p => (
                                <Tag 
                                  key={p.id} 
                                  color={p.color} 
                                  closable 
                                  onClose={() => removeOzrayPoint(p.id)}
                                  style={{ marginBottom: '5px' }}
                                >
                                  ({p.x}, {p.y})
                                </Tag>
                              ))}
                              {ozrayPoints.length === 0 && <Text type="secondary">Click image to add points</Text>}
                            </div>
                          </div>
                        </Card>
                      )
                    )}
                  </Space>
                </div>
              </div>

              {/* Right Panel: NanoLambda & Combined Graph */}
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ padding: '15px', background: '#141414', flex: 1, overflow: 'auto' }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Card title={<><LineChartOutlined /> NanoLambda 2_nanolambda</>} size="small" bordered={false} style={{ background: '#1f1f1f' }}>
                      {renderListControls(nanoViewMode, setNanoViewMode, nanoSortOrder, setNanoSortOrder, false)}
                      <div style={{ maxHeight: '250px', overflow: 'auto' }}>
                        {renderNanoFiles(nanoFiles, nanoViewMode, nanoSortOrder, activeNanoFile, loadNanoData)}
                      </div>
                    </Card>

                    <Card title={<><SettingOutlined /> Data Processing</>} size="small" bordered={false} style={{ background: '#1f1f1f' }}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Checkbox checked={smoothData} onChange={e => setSmoothData(e.target.checked)}>Enable Smoothing (Moving Avg)</Checkbox>
                          <InputNumber 
                            size="small" 
                            min={1} 
                            max={21} 
                            step={2} 
                            value={smoothWindow} 
                            onChange={setSmoothWindow} 
                            disabled={!smoothData}
                            style={{ width: '60px' }}
                          />
                        </div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>Helps reduce noise in RAW hyperspectral captures.</Text>
                      </Space>
                    </Card>

                    <Card title="Spectrum Comparison" 
                      size="small" 
                      bordered={false} 
                      style={{ background: '#1f1f1f' }}
                      extra={
                        <Space>
                          <Checkbox checked={normalizeOzray} onChange={e => setNormalizeOzray(e.target.checked)}>Normalize Ozray</Checkbox>
                          <Checkbox checked={normalizeNano} onChange={e => setNormalizeNano(e.target.checked)}>Normalize Nano</Checkbox>
                        </Space>
                      }
                    >
                      <SpectrumChart 
                        data={chartData} 
                        series={[
                          ...ozrayPoints.map(p => ({ key: `ozray_${p.id}`, name: `Point (${p.x}, ${p.y})`, color: p.color })),
                          ...(selectedNanoIndex !== null ? [{ key: 'nanolambda', name: 'NanoLambda Ref', color: '#52c41a' }] : [])
                        ]} 
                      />
                    </Card>

                    {nanoSpectrums.length > 0 && (
                      <Card title="CSV Entries" size="small" bordered={false} style={{ background: '#1f1f1f' }}>
                        <List
                          size="small"
                          dataSource={nanoSpectrums}
                          renderItem={(entry, idx) => (
                            <List.Item 
                              actions={[<Button type={selectedNanoIndex === idx ? "primary" : "link"} size="small" onClick={() => selectNanoEntry(idx)}>{selectedNanoIndex === idx ? "Selected" : "Select"}</Button>]}
                              style={{ color: selectedNanoIndex === idx ? '#52c41a' : '#aaa' }}
                            >
                              <Text style={{ color: selectedNanoIndex === idx ? '#52c41a' : '#aaa' }}>{entry.name || `Entry ${idx + 1}`}</Text>
                            </List.Item>
                          )}
                        />
                      </Card>
                    )}
                  </Space>
                </div>
              </div>
            </Split>
          ) : (
            /* TAB 2: RAW Overlay Mode (RAW 겹쳐보기) */
            <Split 
              className="split" 
              sizes={[60, 40]} 
              minSize={300} 
              gutterSize={8} 
              style={{ height: '100%' }}
            >
              {/* Left Panel: Overlay File Selector & Grid Viewers */}
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRight: '1px solid #303030' }}>
                <div style={{ padding: '15px', background: '#141414', flex: 1, overflow: 'auto' }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    
                    {/* Multi File Selector */}
                    <Card 
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span><CameraOutlined /> Overlay Selector (RAW 겹쳐보기 파일 선택)</span>
                          <Tag color={selectedOverlayFiles.length >= 2 && selectedOverlayFiles.length <= 10 ? "success" : "warning"}>
                            {selectedOverlayFiles.length} / 10 Selected
                          </Tag>
                        </div>
                      } 
                      size="small" 
                      bordered={false} 
                      style={{ background: '#1f1f1f' }}
                    >
                      <div style={{ marginBottom: '10px' }}>
                        <Text type="secondary">Select between 2 to 10 linescan images below to overlay them. Each file will be assigned a unique color.</Text>
                      </div>
                      {renderListControls(overlayViewMode, setOverlayViewMode, overlaySortOrder, setOverlaySortOrder, true)}
                      <div style={{ maxHeight: '250px', overflow: 'auto', border: '1px solid #303030', borderRadius: '4px' }}>
                        {renderOzrayFiles(ozrayFiles, overlayViewMode, overlaySortOrder, null, toggleOverlayFile, true)}
                      </div>
                    </Card>

                    {/* Active Overlay Images Display */}
                    {selectedOverlayFiles.length < 2 ? (
                      <Card bordered={false} style={{ background: '#1f1f1f', textAlign: 'center', padding: '40px' }}>
                        <Empty 
                          description={<Text style={{ color: '#888' }}>Please select 2 or more files (max 10) from the list above to activate the RAW Overlay comparison view.</Text>}
                        />
                      </Card>
                    ) : (
                      <div style={{ marginTop: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                          <Title level={5} style={{ color: '#fff', margin: 0 }}>Active Overlay Gallery</Title>
                          <Space size="large">
                            <Space>
                              <Text style={{ color: '#aaa', fontSize: '13px' }}>Sync Coordinates:</Text>
                              <Switch 
                                checked={syncOverlayCoords} 
                                onChange={setSyncOverlayCoords} 
                                checkedChildren="ON" 
                                unCheckedChildren="OFF" 
                              />
                            </Space>
                          </Space>
                        </div>

                        <Row gutter={[16, 16]}>
                          {selectedOverlayFiles.map((file, idx) => {
                            const data = loadedOverlayData[file.path];
                            const assignedColor = OVERLAY_COLORS[idx % OVERLAY_COLORS.length];
                            const filePoints = overlayPoints.filter(p => p.filePath === file.path);
                            
                            return (
                              <Col xs={24} sm={12} md={12} key={file.path}>
                                <Card 
                                  title={
                                    <Space>
                                      <Badge color={assignedColor} />
                                      <Text style={{ color: '#fff', fontWeight: 'bold', wordBreak: 'break-all' }}>{file.name}</Text>
                                    </Space>
                                  }
                                  size="small" 
                                  bordered 
                                  style={{ 
                                    background: '#141414', 
                                    borderColor: assignedColor, 
                                    borderWidth: '1.5px',
                                    borderRadius: '8px'
                                  }}
                                >
                                  {!data ? (
                                    <div style={{ textAlign: 'center', padding: '50px' }}>
                                      <Spin tip={`Loading data for ${file.name}...`} />
                                    </div>
                                  ) : (
                                    <>
                                      <HyperspectralViewer 
                                        imageUrl={data.preview_url ? `${data.preview_url}` : null} 
                                        onPointSelect={(x, y) => handleOverlayPointSelect(file, x, y)} 
                                        points={filePoints}
                                      />
                                      <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text type="secondary" style={{ fontSize: '11px' }}>
                                          Points: {filePoints.length}
                                        </Text>
                                        <Tag color={assignedColor} style={{ marginRight: 0 }}>Overlay Color</Tag>
                                      </div>
                                    </>
                                  )}
                                </Card>
                              </Col>
                            );
                          })}
                        </Row>
                      </div>
                    )}
                  </Space>
                </div>
              </div>

              {/* Right Panel: Overlay Spectrum Comparison Chart & Point List */}
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ padding: '15px', background: '#141414', flex: 1, overflow: 'auto' }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    
                    {/* Settings card */}
                    <Card title={<><SettingOutlined /> Data Processing</>} size="small" bordered={false} style={{ background: '#1f1f1f' }}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Checkbox checked={smoothData} onChange={e => setSmoothData(e.target.checked)}>Enable Smoothing (Moving Avg)</Checkbox>
                          <InputNumber 
                            size="small" 
                            min={1} 
                            max={21} 
                            step={2} 
                            value={smoothWindow} 
                            onChange={setSmoothWindow} 
                            disabled={!smoothData}
                            style={{ width: '60px' }}
                          />
                        </div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>Helps reduce noise in RAW hyperspectral captures.</Text>
                      </Space>
                    </Card>

                    {/* Chart Card */}
                    <Card 
                      title={<><LineChartOutlined /> RAW Overlay Spectrum Comparison</>} 
                      size="small" 
                      bordered={false} 
                      style={{ background: '#1f1f1f' }}
                      extra={
                        <Checkbox checked={normalizeOverlay} onChange={e => setNormalizeOverlay(e.target.checked)}>Normalize Overlay</Checkbox>
                      }
                    >
                      {overlayPoints.length === 0 ? (
                        <div style={{ padding: '50px', textAlign: 'center', background: '#141414', borderRadius: '8px' }}>
                          <Text type="secondary">Click on any active linescan image preview on the left to extract and compare spectrum curves.</Text>
                        </div>
                      ) : (
                        <SpectrumChart 
                          data={overlayChartData} 
                          series={overlayPoints.map(p => ({
                            key: `overlay_${p.id}`,
                            name: `${p.fileName} (${p.x}, ${p.y})`,
                            color: p.color
                          }))} 
                        />
                      )}
                    </Card>

                    {/* Overlay Points List */}
                    {overlayPoints.length > 0 && (
                      <Card 
                        title={<><SlidersOutlined /> Extracted Points</>} 
                        size="small" 
                        bordered={false} 
                        style={{ background: '#1f1f1f' }}
                        extra={<Button size="small" type="primary" danger onClick={clearAllOverlayPoints} icon={<DeleteOutlined />}>Clear All</Button>}
                      >
                        <List
                          size="small"
                          dataSource={overlayPoints}
                          renderItem={(p) => (
                            <List.Item 
                              actions={[
                                <Button 
                                  danger 
                                  type="link" 
                                  size="small" 
                                  icon={<DeleteOutlined />} 
                                  onClick={() => removeOverlayPoint(p.id)}
                                />
                              ]}
                              style={{ borderLeft: `4px solid ${p.color}`, paddingLeft: '8px', marginBottom: '4px', background: '#141414', borderRadius: '4px' }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', width: '90%' }}>
                                <Text style={{ color: '#fff', fontSize: '13px', fontWeight: 'bold', wordBreak: 'break-all' }}>{p.fileName}</Text>
                                <Text style={{ color: '#aaa', fontSize: '11px' }}>Coordinate: ({p.x}, {p.y})</Text>
                              </div>
                            </List.Item>
                          )}
                          style={{ maxHeight: '300px', overflow: 'auto' }}
                        />
                      </Card>
                    )}
                  </Space>
                </div>
              </div>
            </Split>
          )}
        </div>
      </Content>
    </Layout>
  )
}

export default App
