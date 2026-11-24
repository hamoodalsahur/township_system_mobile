import { Marker, Polyline } from 'react-native-maps';
import { Text, View } from 'react-native';
import { CLOSURE, FONT } from '@/constants/night-desk';
import { closureLabelPoint, mapClosureLabel, toLatLng, type PublicClosure } from '@/lib/township';

/** Closed roads: a red line with a dashed white centre (not colour alone), and one "Closed until 13:59" label each. */
export function ClosureLines({ closures, now }: { closures: PublicClosure[]; now: Date }) {
  return <>
    {closures.flatMap(closure => closure.roads.map(road => {
      const coords = road.coordinates.map(toLatLng);
      return [
        <Polyline key={`${closure.id}-${road.wayId}-red`} coordinates={coords} strokeColor={CLOSURE.line} strokeWidth={7} lineCap="round" lineJoin="round" zIndex={5} />,
        <Polyline key={`${closure.id}-${road.wayId}-dash`} coordinates={coords} strokeColor="#FFFFFF" strokeWidth={2} lineDashPattern={[6, 6]} zIndex={6} />,
      ];
    }))}
    {closures.map(closure => {
      const point = closureLabelPoint(closure);
      return point ? <Marker key={`${closure.id}-label`} coordinate={toLatLng(point)} anchor={{ x: 0.5, y: 1 }} zIndex={7} tracksViewChanges={false}>
        <View style={{ backgroundColor: CLOSURE.line, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1.5, borderColor: '#FFFFFF' }}>
          <Text style={{ color: '#FFFFFF', fontFamily: FONT.semibold, fontSize: 13 }}>{mapClosureLabel(closure, now)}</Text>
        </View>
      </Marker> : null;
    })}
  </>;
}
