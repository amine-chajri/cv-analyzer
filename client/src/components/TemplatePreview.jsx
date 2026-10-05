import { ACCENTS, LAYOUTS } from '../data/templates';

const Line = ({ w = '100%', h = 3, color = '#cbd5e1', style }) => (
  <div
    style={{
      width: w,
      height: h,
      background: color,
      borderRadius: 999,
      marginBottom: h + 2,
      ...style,
    }}
  />
);

/** A small filled block standing in for a section heading. */
const Heading = ({ color, style }) => (
  <div
    style={{
      height: 5,
      width: '58%',
      background: color,
      borderRadius: 2,
      marginBottom: 5,
      ...style,
    }}
  />
);

/**
 * Decorative CSS rendering of a template's layout.
 *
 * Deliberately not an <img>: it never hits a third-party CDN, scales cleanly
 * at any card size, and stays in sync with the `layout` field in the catalogue.
 */
export default function TemplatePreview({ template, className = '' }) {
  const accent = ACCENTS[template.accent] || ACCENTS.indigo;
  const page = {
    position: 'relative',
    width: '100%',
    aspectRatio: '1 / 1.414',
    background: '#ffffff',
    overflow: 'hidden',
    borderRadius: 6,
  };
  const pad = '9% 9%';
  const rule = { height: 2, background: accent.base, borderRadius: 1 };

  // --- Header variants ------------------------------------------------------
  const headerLeft = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
      <div
        style={{
          height: 7,
          width: '52%',
          background: '#334155',
          borderRadius: 2,
        }}
      />
      <Line w="72%" h={3} color={accent.base} style={{ marginBottom: 0 }} />
    </div>
  );

  const headerCentered = (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          height: 7,
          width: '44%',
          margin: '0 auto 4px',
          background: '#334155',
          borderRadius: 2,
        }}
      />
      <Line w="56%" h={3} color={accent.base} style={{ margin: '0 auto', marginBottom: 0 }} />
    </div>
  );

  const headerWithAvatar = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: accent.soft,
          flexShrink: 0,
        }}
      />
      {headerLeft}
    </div>
  );

  const stackedLines = (rows = 3) => (
    <>
      <div style={{ ...rule, width: '34%', marginBottom: 5 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ marginBottom: 5 }}>
          <Line w={i % 2 ? '86%' : '100%'} h={2.5} style={{ marginBottom: 2 }} />
          <Line w={i % 2 ? '68%' : '92%'} h={2.5} style={{ marginBottom: 0 }} />
        </div>
      ))}
    </>
  );

  // --- Body variants --------------------------------------------------------
  let body;

  switch (template.layout) {
    case LAYOUTS.TWO_COLUMN:
      body = (
        <>
          {headerWithAvatar}
          <div style={{ ...rule, margin: '8px 0 7px' }} />
          <div style={{ display: 'flex', gap: 8, flex: 1, minHeight: 0 }}>
            <div style={{ width: '28%', flexShrink: 0 }}>
              <Heading color={accent.base} style={{ width: '80%' }} />
              {[90, 70, 95, 60, 80].map((w) => (
                <Line key={w} w={`${w}%`} h={2.5} />
              ))}
            </div>
            <div style={{ width: '72%' }}>{stackedLines(3)}</div>
          </div>
        </>
      );
      break;

    case LAYOUTS.SIDEBAR:
      body = (
        <div style={{ display: 'flex', flex: 1, minHeight: 0, margin: '-9% -9% -9% -9%' }}>
          <div
            style={{
              width: '32%',
              background: accent.soft,
              padding: '12% 6%',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: accent.base,
                margin: '0 auto 7px',
              }}
            />
            {[70, 85, 60, 90].map((w) => (
              <Line key={w} w={`${w}%`} h={3} color="#ffffff" />
            ))}
            <div style={{ ...rule, width: '50%', margin: '9px 0 5px' }} />
            {[80, 65].map((w) => (
              <Line key={w} w={`${w}%`} h={3} color="#ffffff" />
            ))}
          </div>
          <div style={{ width: '68%', padding: '12% 9% 0 9%' }}>
            <div
              style={{ height: 7, width: '62%', background: '#334155', borderRadius: 2 }}
            />
            <Line w="46%" h={3} color={accent.base} style={{ marginTop: 3, marginBottom: 0 }} />
            <div style={{ ...rule, margin: '8px 0 7px' }} />
            {stackedLines(3)}
          </div>
        </div>
      );
      break;

    case LAYOUTS.TIMELINE:
      body = (
        <>
          {headerLeft}
          <div style={{ ...rule, margin: '8px 0 7px' }} />
          <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
            <div
              style={{
                width: 10,
                flexShrink: 0,
                position: 'relative',
                marginRight: 6,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 4,
                  top: 4,
                  bottom: 4,
                  width: 1.5,
                  background: '#e2e8f0',
                }}
              />
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: 2,
                    top: 4 + i * 26,
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: i === 0 ? accent.base : '#cbd5e1',
                  }}
                />
              ))}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <Heading color="#64748b" style={{ width: '52%' }} />
                  <Line w="94%" h={2.5} style={{ marginBottom: 2 }} />
                  <Line w="72%" h={2.5} style={{ marginBottom: 0 }} />
                </div>
              ))}
            </div>
          </div>
        </>
      );
      break;

    case LAYOUTS.CENTERED:
      body = (
        <>
          {headerCentered}
          <div
            style={{
              height: 3,
              width: '30%',
              background: accent.base,
              borderRadius: 2,
              margin: '8px auto 9px',
            }}
          />
          {stackedLines(4)}
        </>
      );
      break;

    case LAYOUTS.ONE_COLUMN:
    default:
      body = (
        <>
          {headerLeft}
          <div style={{ ...rule, margin: '8px 0 7px' }} />
          {stackedLines(4)}
        </>
      );
  }

  return (
    <div
      className={className}
      style={page}
      role="img"
      aria-label={`${template.name} template layout preview`}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: pad,
          boxSizing: 'border-box',
        }}
      >
        {body}
      </div>
    </div>
  );
}