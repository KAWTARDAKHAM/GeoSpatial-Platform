const BUTTONS = [
  {
    id      : 'surface-water',
    label   : 'Surface Water',
    icon    : '🌊',
    color   : '#1976D2',
    gradient: 'linear-gradient(135deg, #0D47A1, #1976D2)',
    shadow  : '#1976D244',
    active  : true
  },
  {
    id      : 'precipitation',
    label   : 'Précipitations',
    icon    : '🌧️',
    color   : '#00838F',
    gradient: 'linear-gradient(135deg, #006064, #00838F)',
    shadow  : '#00838F44',
    active  : true
  },
  {
    id      : 'ground-water',
    label   : 'Ground Water',
    icon    : '💧',
    color   : '#455A64',
    gradient: 'linear-gradient(135deg, #263238, #455A64)',
    shadow  : '#45546444',
    active  : false   // à implémenter plus tard
  },
  {
    id      : 'agri',
    label   : 'Classif Agricole',
    icon    : '🌾',
    color   : '#455A64',
    gradient: 'linear-gradient(135deg, #263238, #455A64)',
    shadow  : '#45546444',
    active  : false   // à implémenter plus tard
  }
]

export default function AnalysisPanel({ activePanel, onPanelClick, loading }) {
  return (
    <div style={{
      position     : 'absolute',
      top          : '12px',
      left         : '50%',
      transform    : 'translateX(-50%)',
      zIndex       : 1000,
      display      : 'flex',
      flexDirection: 'column',
      alignItems   : 'center',
      gap          : '6px'
    }}>

      {/* Conteneur boutons */}
      <div style={{
        display      : 'flex',
        gap          : '6px',
        background   : '#1a1d26ee',
        border       : '1px solid #2a2d3a',
        borderRadius : '14px',
        padding      : '5px',
        backdropFilter: 'blur(12px)',
        boxShadow    : '0 8px 32px rgba(0,0,0,0.35)'
      }}>
        {BUTTONS.map(btn => {
          const isActive   = activePanel === btn.id
          const isLoading  = loading && isActive
          const isDisabled = !btn.active && !isActive

          return (
            <button
              key={btn.id}
              onClick={() => btn.active && !loading && onPanelClick(btn.id)}
              title={!btn.active ? 'Bientôt disponible' : ''}
              style={{
                padding      : '8px 16px',
                borderRadius : '10px',
                border       : 'none',
                background   : isActive
                  ? btn.gradient
                  : 'transparent',
                color        : isActive
                  ? '#fff'
                  : isDisabled ? '#333' : '#777',
                fontWeight   : isActive ? '600' : '400',
                fontSize     : '12px',
                cursor       : isDisabled || loading
                  ? 'not-allowed'
                  : 'pointer',
                display      : 'flex',
                alignItems   : 'center',
                gap          : '6px',
                transition   : 'all 0.2s ease',
                boxShadow    : isActive
                  ? `0 4px 14px ${btn.shadow}`
                  : 'none',
                whiteSpace   : 'nowrap',
                opacity      : isDisabled ? 0.4 : 1,
                position     : 'relative'
              }}>

              <span style={{ fontSize: '13px' }}>{btn.icon}</span>
              <span>{isLoading ? 'Calcul...' : btn.label}</span>

              {/* Point indicateur actif */}
              {isActive && !isLoading && (
                <div style={{
                  width       : '5px',
                  height      : '5px',
                  borderRadius: '50%',
                  background  : 'rgba(255,255,255,0.8)',
                  marginLeft  : '2px'
                }} />
              )}

              {/* Badge "soon" pour boutons inactifs */}
              {isDisabled && (
                <span style={{
                  fontSize    : '8px',
                  padding     : '1px 5px',
                  borderRadius: '6px',
                  background  : '#2a2d3a',
                  color       : '#555',
                  marginLeft  : '2px'
                }}>
                  soon
                </span>
              )}
            </button>
          )
        })}
      </div>

    </div>
  )
}