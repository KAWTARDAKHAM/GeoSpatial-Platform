import { useState, useCallback } from 'react'
import MapView         from './components/MapView'
import Sidebar         from './components/Sidebar'
import ClassifPanel    from './components/ClassifPanel'
import TimeSeriesPanel from './components/TimeSeriesPanel'
import AnalysisPanel   from './components/AnalysisPanel'
import ResultCard      from './components/ResultCard'
import MapLegend       from './components/MapLegend'
import {
  fetchClassify,
  fetchWaterAnalysis,
  fetchSurfaceWater,
  fetchPrecipitation,
  fetchAllMoroccoWaterHealth,
  fetchWaterSources,
  fetchSurfaceWaterTile,
  fetchPrecipitationTile,

} from './api/geeApi'

export default function App() {
  const [mode,       setMode]       = useState('bin')
  const [dateStart,  setDateStart]  = useState('2023-01-01')
  const [dateEnd,    setDateEnd]    = useState('2023-12-31')
  const [geometry,   setGeometry]   = useState(null)
  const [result,     setResult]     = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [regionName, setRegionName] = useState(null)

  // Panel
  const [activePanel,  setActivePanel]  = useState(null)
  const [panelData,    setPanelData]    = useState(null)
  const [panelLoading, setPanelLoading] = useState(false)

  // AllMorocco
  const [regionsData,         setRegionsData]         = useState(null)
  const [allLoading,          setAllLoading]           = useState(false)
  const [waterSourcesGeoJSON, setWaterSourcesGeoJSON] = useState(null)
  const [wsInfo,              setWsInfo]              = useState(null)
  // Ajouter ce state
  const [tileUrl,   setTileUrl]   = useState(null)
  const [tileLegend, setTileLegend] = useState(null)
  const [tileTitle,  setTileTitle]  = useState(null)

  const handleSelect = useCallback((geom, name = null) => {
    setGeometry(geom)
    setResult(null)
    setPanelData(null)
    setRegionName(name || null)
  }, [])

  const handleAnalyze = async () => {
    if (!geometry) { alert('Selectionne une zone'); return }
    setLoading(true)
    try {
      const data = await fetchClassify(geometry, dateStart, dateEnd)
      setResult(data)
    } catch (err) {
      alert('Erreur : ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleWaterAnalysis = async () => {
    if (!geometry) { alert('Selectionne une zone'); return }
    setLoading(true)
    try {
      const data = await fetchWaterAnalysis(geometry, dateStart, dateEnd)
      setResult(data)
    } catch (err) {
      alert('Erreur : ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Clic sur un bouton du panel
 const handlePanelClick = async (panelId) => {
  if (!geometry) {
    alert('Clique d\'abord sur la carte pour sélectionner une zone')
    return
  }

  setActivePanel(panelId)
  setPanelData(null)
  setTileUrl(null)
  setTileLegend(null)
  setPanelLoading(true)

  try {
    let data

    if (panelId === 'surface-water') {
      // Toujours calculer les valeurs
      data = await fetchSurfaceWater(geometry, dateStart, dateEnd)
      setPanelData(data)

      // Pour Drop Box et Drop Region — ajouter le layer carte
      if (mode === 'box' || mode === 'region') {
        const tileData = await fetchSurfaceWaterTile(geometry, dateStart, dateEnd)
        setTileUrl(tileData.tile_url)
        setTileLegend(tileData.legend)
        setTileTitle('Surface Water — Occurrence')
      }

    } else if (panelId === 'precipitation') {
      data = await fetchPrecipitation(geometry, dateStart, dateEnd)
      setPanelData(data)

      if (mode === 'box' || mode === 'region') {
        const tileData = await fetchPrecipitationTile(geometry, dateStart, dateEnd)
        setTileUrl(tileData.tile_url)
        setTileLegend(tileData.legend)
        setTileTitle('Précipitations totales (mm)')
      }
    }

  } catch (err) {
    alert('Erreur : ' + err.message)
  } finally {
    setPanelLoading(false)
  }
}
  const handleRegionClick = async (regionInfo) => {
    // pour plus tard
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      <Sidebar
        mode={mode}
        setMode={(m) => {
          setMode(m)
          setActivePanel(null)
          setPanelData(null)
          setRegionsData(null)
          setWaterSourcesGeoJSON(null)
        }}
        dateStart={dateStart} setDateStart={setDateStart}
        dateEnd={dateEnd}     setDateEnd={setDateEnd}
        onAnalyze={handleAnalyze}
        onWaterAnalysis={handleWaterAnalysis}
        loading={loading || panelLoading}
      />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        <div style={{ width: '100%', height: '100%' }}>
          <MapView
            mode={mode}
            onSelect={handleSelect}
            regionsData={regionsData}
            onRegionClick={handleRegionClick}
            waterSourcesGeoJSON={waterSourcesGeoJSON}
            tileUrl={tileUrl} 
          />
        </div>
        {tileUrl && tileLegend && (
  <MapLegend
    legend={tileLegend}
    title={tileTitle}
  />
)}
         {(activePanel === 'surface-water' || activePanel === 'precipitation') && (
  <ResultCard
    panelId={activePanel}
    data={panelData}
    loading={panelLoading}
  />
)}

        {/* Panel 4 boutons — visible dans tous les modes */}
        <AnalysisPanel
          activePanel={activePanel}
          onPanelClick={handlePanelClick}
          loading={panelLoading}
        />

        {/* ResultCard — Drop Bin uniquement */}
        {mode === 'bin' && (activePanel === 'surface-water' || activePanel === 'precipitation') && (
          <ResultCard
            panelId={activePanel}
            data={panelData}
            loading={panelLoading}
          />
        )}

        {/* ClassifPanel existant */}
        {(result) && mode !== 'allmorocco' && (
          <div style={{ position: 'absolute', top: '72px', right: '12px', zIndex: 900 }}>
            <ClassifPanel result={result} waterResult={null} />
          </div>
        )}

        {/* Nom région */}
        {regionName && (
          <div style={{
            position: 'absolute', bottom: '56px', left: '12px', zIndex: 900,
            background: '#1a1d26cc', border: '1px solid #378ADD',
            borderRadius: '8px', padding: '6px 14px',
            fontSize: '12px', color: '#378ADD', fontWeight: '500'
          }}>
            {regionName}
          </div>
        )}

        {/* Loading */}
        {(loading || panelLoading || allLoading) && (
          <div style={{
            position : 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#1a1d26', border: '1px solid #2a2d3a',
            borderRadius: '12px', padding: '16px 28px',
            fontSize: '13px', color: '#1D9E75', zIndex: 1000
          }}>
            Calcul GEE en cours...
          </div>
        )}

        {/* Drawer */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000,
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: drawerOpen ? 'translateY(0)' : 'translateY(calc(100% - 44px))'
        }}>
          <div onClick={() => setDrawerOpen(!drawerOpen)} style={{
            height: '44px', background: '#1a1d26',
            borderTop: '1px solid #2a2d3a',
            borderLeft: '1px solid #2a2d3a',
            borderRight: '1px solid #2a2d3a',
            borderRadius: '12px 12px 0 0',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px', cursor: 'pointer', userSelect: 'none'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '3px', background: '#3a3d4a', borderRadius: '2px' }} />
              <span style={{
                fontSize: '11px', fontWeight: '500', color: '#e8e8e4',
                letterSpacing: '0.06em', textTransform: 'uppercase'
              }}>
                Series temporelles
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['Precipitations', 'Humidite sol', 'Evapotranspiration', 'Usage des terres'].map((label, i) => (
                <span key={i} style={{
                  fontSize: '10px', color: '#555',
                  padding: '2px 8px', border: '1px solid #2a2d3a', borderRadius: '10px'
                }}>
                  {label}
                </span>
              ))}
            </div>
            <span style={{
              color: '#666', fontSize: '14px',
              transform: drawerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s'
            }}>▲</span>
          </div>
          <div style={{
            height: '340px', background: '#13151f',
            borderLeft: '1px solid #2a2d3a', borderRight: '1px solid #2a2d3a',
            overflow: 'hidden'
          }}>
            <TimeSeriesPanel geometry={geometry} dateStart={dateStart} dateEnd={dateEnd} />
          </div>
        </div>

      </div>
    </div>
  )
}