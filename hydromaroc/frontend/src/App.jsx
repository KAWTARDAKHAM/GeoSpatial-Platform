import { useState, useCallback } from 'react'
import MapView              from './components/MapView'
import Sidebar              from './components/Sidebar'
import ClassifPanel         from './components/ClassifPanel'
import TimeSeriesPanel      from './components/TimeSeriesPanel'
import AllMoroccoPanel      from './components/AllMoroccoPanel'
import WaterSourcesLegend   from './components/WaterSourcesLegend'
import {
  fetchClassify,
  fetchWaterAnalysis,
  fetchAllMoroccoWaterHealth,
  fetchAllMoroccoAgriHealth,
  fetchWaterSources
} from './api/geeApi'

export default function App() {
  const [mode,           setMode]           = useState('bin')
  const [dateStart,      setDateStart]      = useState('2023-01-01')
  const [dateEnd,        setDateEnd]        = useState('2023-12-31')
  const [geometry,       setGeometry]       = useState(null)
  const [result,         setResult]         = useState(null)
  const [waterResult,    setWaterResult]    = useState(null)
  const [loading,        setLoading]        = useState(false)
  const [waterLoading,   setWaterLoading]   = useState(false)
  const [drawerOpen,     setDrawerOpen]     = useState(false)
  const [regionName,     setRegionName]     = useState(null)

  // AllMorocco states
  const [activeBox,      setActiveBox]      = useState(null)
  const [regionsData,    setRegionsData]    = useState(null)
  const [allLoading,     setAllLoading]     = useState(false)
  const [wsInfo,         setWsInfo]         = useState(null)
  const [selectedAllReg, setSelectedAllReg] = useState(null)
  const [waterSourcesGeoJSON, setWaterSourcesGeoJSON] = useState(null)

  const handleSelect = useCallback((geom, name = null) => {
    setGeometry(geom)
    setResult(null)
    setWaterResult(null)
    setRegionName(name || null)
  }, [])

  const handleAnalyze = async () => {
    if (!geometry) { alert('Selectionne une zone'); return }
    if (new Date(dateStart) >= new Date(dateEnd)) { alert('Dates invalides'); return }
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
    setWaterLoading(true)
    try {
      const data = await fetchWaterAnalysis(geometry, dateStart, dateEnd)
      setWaterResult(data)
    } catch (err) {
      alert('Erreur water : ' + err.message)
    } finally {
      setWaterLoading(false)
    }
  }

  // AllMorocco — clic sur une box
  const handleBoxClick = async (boxId) => {
    setActiveBox(boxId)
    setRegionsData(null)
    setSelectedAllReg(null)
    setWsInfo(null)
    setAllLoading(true)

    try {
      if (boxId === 'water-health') {
        const data = await fetchAllMoroccoWaterHealth(dateStart, dateEnd)
        const regions = data.features.map(f => ({
            name    : f.properties.NAME_1,
            score   : f.properties.water_score,
            color   : f.properties.fill_color,
            geometry: f.geometry
       }))
       setRegionsData(regions)
      } else if (boxId === 'agri') {
        const data = await fetchAllMoroccoAgriHealth(dateStart, dateEnd)
        setRegionsData(data.regions)

      } else if (boxId === 'water-sources') {
        // Pour water-sources : charger le GeoJSON des régions
        // et attendre que l'utilisateur clique sur une région
        const res  = await fetch('/data/maroc_regions.geojson')
        const json = await res.json()
        // Afficher les régions sans couleur spéciale
        setRegionsData(json.features.map(f => ({
          name    : f.properties.NAME_1,
          color   : '#1565C022',
          geometry: f.geometry
        })))
        setWsInfo("Cliquez sur une région pour explorer ses sources d'eau")
      }
    } catch (err) {
      alert('Erreur : ' + err.message)
    } finally {
      setAllLoading(false)
    }
  }

  // AllMorocco — clic sur une région colorée
  const handleRegionClick = async (regionInfo) => {
    setSelectedAllReg(regionInfo)

   if (activeBox === 'water-sources') {
  setAllLoading(true)
  setWsInfo(`Chargement sources — ${regionInfo.name}...`)
  try {
    const data = await fetchWaterSources(regionInfo.name)
    setWaterSourcesGeoJSON(data)
    setWsInfo(`${data.count} sources trouvées — ${regionInfo.name}`)
  } catch (err) {
    setWsInfo('Erreur chargement sources')
  } finally {
    setAllLoading(false)
  }
}
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      <Sidebar
        mode={mode}             setMode={(m) => { setMode(m); setActiveBox(null); setRegionsData(null) }}
        dateStart={dateStart}   setDateStart={setDateStart}
        dateEnd={dateEnd}       setDateEnd={setDateEnd}
        onAnalyze={handleAnalyze}
        onWaterAnalysis={handleWaterAnalysis}
        loading={loading || waterLoading}
      />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        <div style={{ width: '100%', height: '100%' }}>
          <MapView
            mode={mode}
            onSelect={handleSelect}
            regionsData={regionsData}
            onRegionClick={handleRegionClick}
            waterSourcesGeoJSON={waterSourcesGeoJSON}
          />
        </div>

        {/* AllMorocco — 3 boxes en haut */}
        {mode === 'allmorocco' && (
          <AllMoroccoPanel
            activeBox={activeBox}
            setActiveBox={handleBoxClick}
            loading={allLoading}
            waterSourcesInfo={wsInfo}
          />
        )}

        {/* Légende water sources */}
        {mode === 'allmorocco' && activeBox === 'water-sources' && (
          <WaterSourcesLegend />
        )}

        {/* Légende couleurs water health */}
        {mode === 'allmorocco' && activeBox === 'water-health' && (
          <div style={{
            position: 'absolute', bottom: '56px', right: '16px',
            background: '#1a1d26', border: '1px solid #2a2d3a',
            borderRadius: '10px', padding: '12px 14px', zIndex: 1000
          }}>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>
              Water Health Score
            </div>
            {[
              { color: '#0D47A1', label: 'Score ≥ 75 — Excellent' },
              { color: '#1976D2', label: 'Score 50–75 — Bon'      },
              { color: '#90CAF9', label: 'Score 25–50 — Modéré'   },
              { color: '#E3F2FD', label: 'Score < 25 — Faible'    },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center',
                gap: '8px', marginBottom: '5px'
              }}>
                <div style={{
                  width: '14px', height: '14px',
                  borderRadius: '3px', background: item.color, flexShrink: 0
                }} />
                <span style={{ fontSize: '11px', color: '#aaa' }}>{item.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Légende agri health */}
        {mode === 'allmorocco' && activeBox === 'agri' && (
          <div style={{
            position: 'absolute', bottom: '56px', right: '16px',
            background: '#1a1d26', border: '1px solid #2a2d3a',
            borderRadius: '10px', padding: '12px 14px', zIndex: 1000
          }}>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>
              Aptitude Agricole
            </div>
            {[
              { color: '#1D9E75', label: 'Bien adapté (≥ 65%)' },
              { color: '#BA7517', label: 'Modéré (35–65%)'     },
              { color: '#D85A30', label: 'Non exploitable'      },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center',
                gap: '8px', marginBottom: '5px'
              }}>
                <div style={{
                  width: '14px', height: '14px',
                  borderRadius: '3px', background: item.color, flexShrink: 0
                }} />
                <span style={{ fontSize: '11px', color: '#aaa' }}>{item.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Nom région */}
        {regionName && mode !== 'allmorocco' && (
          <div style={{
            position: 'absolute', top: '12px', left: '12px', zIndex: 900,
            background: '#1a1d26cc', border: '1px solid #378ADD',
            borderRadius: '8px', padding: '6px 14px',
            fontSize: '12px', color: '#378ADD', fontWeight: '500'
          }}>
            {regionName}
          </div>
        )}

        {/* Loading */}
        {(loading || waterLoading || allLoading) && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#1a1d26', border: '1px solid #2a2d3a',
            borderRadius: '12px', padding: '16px 28px',
            fontSize: '13px', color: '#1D9E75', zIndex: 1000
          }}>
            {allLoading ? 'Calcul national en cours... (2-3 min)' :
             waterLoading ? 'Analyse eau en cours...' : 'Calcul GEE en cours...'}
          </div>
        )}

        {/* ClassifPanel */}
        {(result || waterResult) && mode !== 'allmorocco' && (
          <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 900 }}>
            <ClassifPanel result={result} waterResult={waterResult} />
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
                {regionName && (
                  <span style={{ color: '#378ADD', marginLeft: '8px', fontWeight: '400' }}>
                    — {regionName}
                  </span>
                )}
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