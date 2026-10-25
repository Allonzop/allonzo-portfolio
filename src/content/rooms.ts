export type RoomId =
  | 'solar'
  | 'plant'
  | 'boatyard'
  | 'parking'
  | 'lab'
  | 'studio'
  | 'arcade'
  | 'control'

export type Metric = { value: string; label: string }

export type Photo = { src: string; alt: string; caption?: string; w: number; h: number }

export type Feature = {
  title: string
  lead?: string
  body: string[]
  figures?: Metric[]
}

export type Room = {
  id: RoomId
  /** Plate code, engraved in caps on the room's nameplate */
  code: string
  title: string
  context: string
  hook: string
  metrics: Metric[]
  did: string[]
  features?: Feature[]
  also?: string[]
  aside?: string
  status?: string
  stack: string[]
  photos: Photo[]
  xp: number
}

export const ROOMS: Room[] = [
  {
    id: 'solar',
    code: 'ROOF',
    title: 'Solar deck',
    context: 'PV apprenticeship in a solar design office · 2022–2024',
    hook: "100+ PV projects sized, from rooftop to carport, and one structure that didn't exist.",
    metrics: [
      { value: '100+', label: 'PV studies sized and followed' },
      { value: '401.4 kWp', label: 'largest rooftop, 892 modules on 7 blocks' },
      { value: '499.95 kWp', label: 'extension landed under the 500 kWp tender line' },
      { value: '120.8 €/MWh', label: 'tariff secured instead of a 40 €/MWh tender cap' },
    ],
    did: [
      'Designed a frame that did not exist: PV modules held vertically along a parapet, next to an airfield where glare was forbidden.',
      'Modelled self-consumption against installed power and landed an extension at 499.95 kWp to keep the feed-in tariff.',
      'Built the tooling around the studies: single-line diagrams, tender files, two VBA tools and a Chrome extension for financial KPIs.',
    ],
    features: [
      {
        title: 'Vertical PV frame on a parapet',
        lead: 'The problem: a roof next to an airfield, where glare was forbidden.',
        body: [
          'I designed a new frame holding the modules vertically along the parapet. Sketched in SketchUp, structural calculation in Robot Structural Analysis, self-taught for the job.',
          'Site prototype, subcontracted fabrication, then installation with crews I trained.',
        ],
        figures: [
          { value: '90°', label: 'tilt' },
          { value: '≈ 20 cm', label: 'above the roof' },
          { value: '≈ 80 kg', label: 'per frame' },
          { value: '6', label: 'support points' },
          { value: '3 days', label: 'to install' },
        ],
      },
      {
        title: 'The 500 kWp arbitrage',
        lead: 'In France, above 500 kWp a PV project leaves the feed-in tariff and goes to a national tender.',
        body: [
          'I modelled self-consumption and self-production against installed power, then landed the extension at 499.95 kWp: 140 kWp existing plus 3.5 solar carports.',
        ],
        figures: [
          { value: '95.1 %', label: 'self-consumption' },
          { value: '22.2 %', label: 'self-production' },
          { value: '120.8 €/MWh', label: 'secured, against a 40 €/MWh tender cap' },
        ],
      },
    ],
    also: [
      '100+ studies sized and followed.',
      'Largest rooftop: 401.4 kWp, 892 modules on 7 blocks.',
      'AutoCAD single-line diagrams and tender files.',
      'Two VBA tools: a quote generator, and a carport layout engine driven by the number of parking spaces.',
      'A Chrome extension that pulls 11 financial KPIs (IRR, NPV, LCOE, payback…) from the PV simulation software into a scenario comparison.',
    ],
    stack: ['Archelios', 'PV*Sol', 'PVGIS', 'SolarEdge Designer', 'AutoCAD', 'SketchUp', 'Robot', 'VBA', 'JavaScript'],
    photos: [],
    xp: 150,
  },
  {
    id: 'plant',
    code: 'PLANT ROOM',
    title: 'BMS / BACS',
    context: 'Alter Watt, BACS division · apprentice engineer, 2024–now',
    hook: 'I audit how buildings are controlled, then I standardised how we price fixing them.',
    metrics: [
      { value: '5', label: 'BACS audits run solo, site visit to final report' },
      { value: '3 levels', label: 'pricing funnel, from 5 trade categories' },
      { value: '1', label: 'reference tree holding every price' },
      { value: '25 sheets', label: 'methodology guide to defend a quote' },
    ],
    did: [
      'Ran 5 BACS audits solo: compliance with the French BACS decree, the control chain read from sensor to supervision, then recommendations and a cost estimate defended in front of the client.',
      'Standardised pricing across the division: 5 trade categories, filtered interventions, one optional sub-choice. Every price sits in a single reference tree, with no hidden arithmetic, and is mandatory for everyone.',
      'Wrote a 25-sheet methodology guide that trains engineers to defend a quote.',
    ],
    status: 'In progress: an offline field-audit web app with quick 3D massing for quantities and one-click report generation.',
    stack: ['BMS / GTB', 'Modbus', 'HVAC controls', 'Google Sheets', 'Apps Script'],
    photos: [],
    xp: 150,
  },
  {
    id: 'boatyard',
    code: 'BOATYARD',
    title: 'Plymouth, UK',
    context: 'Stirling & Son · shipwright intern, Jul–Sep 2026',
    hook: 'Two months restoring traditional wooden boats, in English, with hand tools.',
    metrics: [
      { value: '2', label: 'restoration projects' },
      { value: '35 ft', label: 'vessel' },
      { value: '15 ft', label: 'vessel' },
      { value: '2 months', label: 'in a working yard, in English' },
    ],
    did: [
      'Hands-on work on a 35-ft and a 15-ft vessel: dismantling, diagnosing and hand-making wooden parts to replace damaged structural members.',
      'Hull preparation, paint and marine-grade protective treatments.',
      'Naval architecture and structural behaviour learned on the job, with the full technical vocabulary of shipwrighting, in English.',
    ],
    aside: 'Why it matters: fast adaptation abroad, a feel for materials and structures, rigour.',
    stack: ['Hand tools', 'Structural timber repair', 'Hull preparation', 'Marine-grade coatings', 'Working English'],
    photos: [],
    xp: 150,
  },
  {
    id: 'parking',
    code: 'CAR PARK',
    title: 'Smart parking',
    context: 'ESTP research initiation · team of 4, 2025–2026',
    hook: 'Edge IoT: each sensor node decides locally, the network only hears about changes.',
    metrics: [
      { value: '< 200 ms', label: 'end to end, in Wokwi simulation' },
      { value: '≈ −95 %', label: 'bandwidth against a 1 Hz stream' },
      { value: '120–150 B', label: 'JSON frame per confirmed change' },
      { value: '26', label: 'papers in the literature review' },
    ],
    did: [
      'ESP32 nodes with HC-SR04 ultrasonic sensors, and a finite state machine per space: free, occupied, reserved.',
      'Only confirmed state changes are published over MQTT, as 120–150-byte JSON frames, to a web dashboard.',
      'Measured in Wokwi simulation and written up as a research article with a 26-paper literature review.',
    ],
    stack: ['ESP32', 'C++', 'MQTT', 'JSON', 'Wokwi'],
    photos: [],
    xp: 150,
  },
  {
    id: 'lab',
    code: 'LAB',
    title: 'Measure & simulate',
    context: 'BUT in thermal and energy engineering 2021–2024 · ESTP',
    hook: 'Sensors I built, losses I modelled, and a PV plant that pays back in 5 years.',
    metrics: [
      { value: '205,925 W', label: 'heat losses modelled in ClimaWin' },
      { value: '−19.8 %', label: 'with external insulation, simulated in Pléiades' },
      { value: '5 years', label: 'payback on the 33 kWp PV plant' },
      { value: '≈ 6 %', label: 'mean error on junction temperature, FEM-fitted model' },
    ],
    did: [
      'Built 3 Arduino logging nodes (DHT22, RTC, microSD) and logged the main switchboard of a teaching building with a power analyser.',
      'Sized my part of the audit, a 33 kWp PV plant: 34,969 kWh in year one, CAPEX of €36,300, LCOE of 0.063 €/kWh.',
      'Fitted a compact thermal model of an electronic chip on 17 FEM simulations with a least-squares optimiser.',
    ],
    features: [
      {
        title: 'Energy audit of a teaching building',
        lead: 'BUT final year.',
        body: [
          'Built 3 Arduino logging nodes (DHT22, RTC, microSD) and logged the main switchboard with a power analyser.',
          'Heat losses modelled in ClimaWin: 205,925 W. External insulation simulated in Pléiades: −19.8 %.',
          'My part, a 33 kWp PV plant:',
        ],
        figures: [
          { value: '34,969 kWh', label: 'in year one' },
          { value: '€36,300', label: 'CAPEX' },
          { value: '5 years', label: 'payback' },
          { value: '0.063 €/kWh', label: 'LCOE' },
          { value: '13 t', label: 'CO₂ avoided' },
        ],
      },
      {
        title: 'Thermal modelling and optimisation',
        body: [
          'I master advanced thermal design and optimisation software based on the finite element method.',
          'Proof point: a compact thermal model of an electronic chip, fitted on 17 FEM simulations with a least-squares optimiser, with about 6 % mean error on junction temperature.',
        ],
      },
    ],
    also: [
      'P, PI and PID controllers tuned on a heating rig.',
      'A microcontroller lab: presence sensing, thermistor, EEPROM logging.',
    ],
    stack: ['Arduino', 'ClimaWin', 'Pléiades', 'FEM', 'Least-squares fitting', 'PID control'],
    photos: [],
    xp: 150,
  },
  {
    id: 'studio',
    code: 'STUDIO',
    title: 'Building design',
    context: 'ESTP Paris, GECD · 2025–2027',
    hook: 'Summer comfort without air conditioning: at most 80 hours a year above 28 °C.',
    metrics: [
      { value: '≤ 80 h', label: 'a year above 28 °C, no air conditioning' },
      { value: '6,000 m²', label: 'of offices in an 8,350–8,500 m² programme' },
      { value: '4', label: 'massings compared on sun, wind and comfort' },
      { value: '110 h', label: 'of cooling a year, bioclimatic residence' },
    ],
    did: [
      'Lead direction and process on a mixed-use office building in Montrouge, and own the KPI workbook: every design strategy gets a measurable indicator.',
      'Givoni chart, 4 massings compared on sun, wind and comfort, then a Revit model taken into Pléiades for dynamic thermal simulation, with the neighbouring buildings as shading masks.',
      'On a bioclimatic student residence: 8,760 hours of climate data, 16 passive strategies, overhangs cut at 55°. Cooling needed only 110 h a year.',
    ],
    features: [
      {
        title: 'Mixed-use office building, Montrouge',
        lead: 'Final-year group project, team of 4, in progress.',
        body: [
          'An office, retail and restaurant building on a real plot, simulated with the climate of Rennes.',
          'Graded on summer comfort without air conditioning: at most 80 h a year above 28 °C. Programme: about 8,350–8,500 m², including 6,000 m² of offices.',
          'My role: I lead direction and process and own the KPI workbook.',
        ],
      },
      {
        title: 'Bioclimatic student residence',
        lead: 'Team of 5.',
        body: ['8,760 hours of climate data and 16 passive strategies analysed.'],
        figures: [
          { value: '55°', label: 'overhang cut' },
          { value: '24°', label: 'sun in December' },
          { value: '69°', label: 'sun in June' },
          { value: '110 h', label: 'of cooling a year' },
        ],
      },
    ],
    stack: ['Revit', 'Pléiades', 'Climate Consultant', 'SketchUp', 'AutoCAD', 'BIM'],
    photos: [],
    xp: 150,
  },
  {
    id: 'arcade',
    code: 'ARCADE',
    title: 'BOLOSS',
    context: 'Personal · 2026, with my brother drawing the cards',
    hook: 'A 1-v-1 card game in the browser. Send a link, play. No account.',
    metrics: [
      { value: '71', label: 'cards' },
      { value: '1 v 1', label: 'in the browser, from a link' },
      { value: '0', label: 'accounts needed' },
      { value: '3', label: 'packages: rules engine, server, client' },
    ],
    did: [
      'A strict-TypeScript monorepo: shared rules engine, a Node + Express + Socket.io server, a React + Zustand client.',
      "A server-authoritative state machine: the client cannot cheat, and the opponent's hand is redacted.",
      'An event-driven rules engine handling buff durations, poison ticks, sacrifices, taunt, charge and auras.',
    ],
    stack: ['TypeScript', 'Node', 'Express', 'Socket.io', 'React', 'Zustand'],
    photos: [],
    xp: 150,
  },
  {
    id: 'control',
    code: 'CONTROL ROOM',
    title: 'Lab experiments',
    context: 'Personal',
    hook: "An AI assistant that sees an iPad's screen and drives it like a hand would.",
    metrics: [
      { value: 'MCP', label: 'server exposing the screen and the input' },
      { value: 'BLE HID', label: 'the tablet sees a keyboard and a pointer' },
      { value: 'ESP32', label: 'running BleHid' },
    ],
    did: [
      "An MCP server lets an AI assistant see an iPad's screen.",
      'It drives the tablet through a Bluetooth HID device, an ESP32 running BleHid.',
      'In development, not public.',
    ],
    status: 'In development, not public.',
    aside: 'Alongside my studies I also build websites and automations for small businesses, details on request.',
    stack: ['MCP', 'ESP32', 'BleHid', 'Bluetooth HID'],
    photos: [],
    xp: 150,
  },
]

export const ROOM_BY_ID = Object.fromEntries(ROOMS.map((r) => [r.id, r])) as Record<RoomId, Room>

/** Order used by the 2D list and by "next room" suggestions */
export const TOUR: RoomId[] = ['solar', 'plant', 'boatyard', 'parking', 'lab', 'studio', 'arcade', 'control']
