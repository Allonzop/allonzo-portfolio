import { Plate } from '../Plate'
import { useStore } from '../../store'
import { Arcade, Studio } from './Upper'
import { Boatyard } from './Boatyard'
import { CarPark } from './CarPark'
import { Ducts } from './Ducts'
import { ControlRoom, Lab, PlantRoom } from './Ground'
import { Solar } from './Solar'
import { Box } from '../common'
import { StaticBatch } from '../StaticBatch'

function CarParkSign() {
  const done = useStore((s) => s.commissioned.includes('parking'))
  return (
    <group position={[-12.6, 0, 5.2]}>
      <Box p={[0, 0.9, 0]} s={[0.1, 1.8, 0.1]} c="#3a414d" />
      <Plate p={[0, 2.0, 0.07]} width={2.1} lines={['CAR PARK', done ? 'COMMISSIONED' : 'OFFLINE']} mark={done ? 'filled' : 'hollow'} />
    </group>
  )
}

export function Rooms() {
  return (
    <group>
      <StaticBatch room="plant" warmth={0.55}>
        <PlantRoom />
      </StaticBatch>
      <StaticBatch room="lab" warmth={0.62}>
        <Lab />
      </StaticBatch>
      <StaticBatch room="control" warmth={0.42} tint="#ffc89a">
        <ControlRoom />
      </StaticBatch>
      <StaticBatch room="studio" warmth={0.6}>
        <Studio />
      </StaticBatch>
      <StaticBatch room="arcade" warmth={0.45} tint="#ff9ec8">
        <Arcade />
      </StaticBatch>
      <StaticBatch room="solar" warmth={0.2} tint="#bcd2ff" dark={0.45}>
        <Solar />
      </StaticBatch>
      <StaticBatch room="plant" warmth={0.3} dark={0.5}>
        <Ducts />
      </StaticBatch>
      <StaticBatch room="parking" warmth={0.3} dark={0.45}>
        <CarPark />
        <CarParkSign />
      </StaticBatch>
      <StaticBatch room="boatyard" warmth={0.42} tint="#ffc27a" dark={0.45}>
        <Boatyard />
      </StaticBatch>
    </group>
  )
}
