export default function MapLegend({ legend, title }) {
  if (!legend || legend.length === 0) return null

  return (
    <div style={{
      position    : 'absolute',
      bottom      : '56px',
      left        : '12px',
      zIndex      : 900,
      background  : '#1a1d26',
      border      : '1px solid #2a2d3a',
      borderRadius: '12px',
      padding     : '12px 14px',
      minWidth    : '180px',
      boxShadow   : '0 4px 16px rgba(0,0,0,0.3)'
    }}>
      {title && (
        <div style={{
          fontSize      : '10px',
          fontWeight    : '600',
          color         : '#666',
          textTransform : 'uppercase',
          letterSpacing : '0.06em',
          marginBottom  : '8px'
        }}>
          {title}
        </div>
      )}
      {legend.map((item, i) => (
        <div key={i} style={{
          display    : 'flex',
          alignItems : 'center',
          gap        : '8px',
          marginBottom: i < legend.length - 1 ? '5px' : 0
        }}>
          <div style={{
            width       : '14px',
            height      : '14px',
            borderRadius: '3px',
            background  : item.color,
            flexShrink  : 0,
            border      : '1px solid rgba(255,255,255,0.1)'
          }} />
          <span style={{ fontSize: '11px', color: '#aaa' }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}