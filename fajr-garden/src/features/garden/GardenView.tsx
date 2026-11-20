import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import type { Garden, Plant, Species } from '../../lib/garden';
import type { Palette } from '../../theme/sunPhase';

/**
 * Placeholder geometric garden until the commissioned illustrations exist (PRD §10:
 * no AI-generated art). Each species has its own leaf colour; shapes grow with the stage.
 */
const LEAF: Record<Species, string> = {
  date_palm: '#6B8F4E', olive: '#7C8C5A', fig: '#4F7A4A', pomegranate: '#5E7D3F',
  jasmine: '#6E9A6A', lemon: '#7FA046', rose: '#5C8051', mint: '#4E9A7A',
  vine: '#6A8A3C', almond: '#7A9466', cedar: '#3F6B4E', lavender: '#7B8E6E',
};
const FLOWER: Record<Species, string> = {
  date_palm: '#E8C27A', olive: '#F2EBD3', fig: '#B07AA1', pomegranate: '#D9544D',
  jasmine: '#FFFFFF', lemon: '#F2D64B', rose: '#E58FA6', mint: '#C9B8E8',
  vine: '#8E5BA6', almond: '#F6D9E0', cedar: '#C8A26B', lavender: '#A98BD6',
};

const MAX_VISIBLE = 6;
const W = 360;
const H = 170;
const GROUND = 140;

function PlantShape({ plant, x, stem }: { plant: Plant; x: number; stem: string }) {
  const leaf = LEAF[plant.species];
  const flower = FLOWER[plant.species];
  const heights = [0, 22, 42, 66, 92];
  const h = heights[plant.stage] ?? 0;
  const top = GROUND - h;
  if (plant.stage === 0) {
    return <Ellipse cx={x} cy={GROUND - 3} rx={6} ry={4} fill={stem} />;
  }
  const crown = plant.stage >= 3 ? 10 + plant.stage * 5 : 0;
  return (
    <G>
      <Line x1={x} y1={GROUND} x2={x} y2={top} stroke={stem} strokeWidth={plant.stage >= 3 ? 4 : 2.5} strokeLinecap="round" />
      {plant.stage < 3 ? (
        <>
          <Path d={`M${x} ${top + 8} q -12 -4 -14 -14 q 12 0 14 14 z`} fill={leaf} />
          <Path d={`M${x} ${top + 8} q 12 -4 14 -14 q -12 0 -14 14 z`} fill={leaf} />
          {plant.stage === 2 && <Path d={`M${x} ${top + 22} q -14 -2 -18 -12 q 14 0 18 12 z`} fill={leaf} />}
        </>
      ) : (
        <Circle cx={x} cy={top} r={crown} fill={leaf} />
      )}
      {plant.bloomed &&
        [-0.6, 0.2, 0.9].map((a, i) => (
          <Circle key={i} cx={x + Math.cos(a * Math.PI) * (crown || 10) * 0.7} cy={top + Math.sin(a * Math.PI) * (crown || 10) * 0.6} r={3.5} fill={flower} />
        ))}
    </G>
  );
}

export function GardenView({ garden, palette }: { garden: Garden; palette: Palette }) {
  const { t } = useTranslation();
  const visible = garden.plants.slice(-MAX_VISIBLE);
  const gap = W / (visible.length + 1);
  const grown = garden.plants.filter((p) => p.stage === 4).length;
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('garden.a11y', { count: garden.plants.length, grown })}
      style={styles.wrap}
    >
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax meet">
        <Rect x={0} y={GROUND} width={W} height={H - GROUND} rx={8} fill={palette.surface} />
        {visible.map((plant, i) => (
          <PlantShape key={i} plant={plant} x={gap * (i + 1)} stem={palette.textMuted} />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { width: '100%' } });
