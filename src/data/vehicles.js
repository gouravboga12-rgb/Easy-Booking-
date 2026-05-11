export const categories = [
  {
    id: 'excavation',
    label: 'Excavation & Earthmoving',
    vehicles: [
      { id: 'excavator',  name: 'Excavator',             desc: 'Digging, trenching, demolition',       rate: 4500, unit: 'hr',
        image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&q=80' },
      { id: 'jcb',        name: 'Backhoe Loader (JCB)',  desc: 'Multi-purpose digging + loading',      rate: 3500, unit: 'hr',
        image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80' },
      { id: 'bulldozer',  name: 'Bulldozer',             desc: 'Pushing soil, leveling land',          rate: 5000, unit: 'hr',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
      { id: 'skid-steer', name: 'Skid Steer Loader',     desc: 'Small, flexible for tight areas',      rate: 2800, unit: 'hr',
        image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80' },
    ],
  },
  {
    id: 'transport',
    label: 'Transport & Material Handling',
    vehicles: [
      { id: 'dump-truck',     name: 'Dump Truck / Tipper',   desc: 'Transporting sand, gravel, debris',      rate: 2500, unit: 'trip',
        image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&q=80' },
      { id: 'concrete-mixer', name: 'Concrete Mixer Truck',  desc: 'Carries ready-mix concrete',             rate: 3200, unit: 'trip',
        image: 'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=600&q=80' },
      { id: 'flatbed',        name: 'Flatbed Truck',         desc: 'Transports steel, wood, materials',      rate: 2200, unit: 'trip',
        image: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600&q=80' },
      { id: 'transit-mixer',  name: 'Transit Mixer',         desc: 'Keeps concrete rotating in transit',     rate: 3500, unit: 'trip',
        image: 'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=600&q=80' },
    ],
  },
  {
    id: 'road',
    label: 'Road Construction',
    vehicles: [
      { id: 'road-roller',     name: 'Road Roller',      desc: 'Compacts soil and asphalt',         rate: 3800, unit: 'hr',
        image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&q=80' },
      { id: 'asphalt-paver',   name: 'Asphalt Paver',    desc: 'Lays road surface',                 rate: 6000, unit: 'hr',
        image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80' },
      { id: 'motor-grader',    name: 'Motor Grader',     desc: 'Smoothens and levels roads',        rate: 5500, unit: 'hr',
        image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&q=80' },
      { id: 'bitumen-sprayer', name: 'Bitumen Sprayer',  desc: 'Sprays tar for road construction',  rate: 4200, unit: 'hr',
        image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&q=80' },
    ],
  },
  {
    id: 'lifting',
    label: 'Lifting & Heavy Work',
    vehicles: [
      { id: 'crane',       name: 'Crane (Tower/Mobile)', desc: 'Lifting heavy materials',          rate: 8000, unit: 'hr',
        image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80' },
      { id: 'forklift',    name: 'Forklift',             desc: 'Moving goods in small areas',      rate: 2000, unit: 'hr',
        image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80' },
      { id: 'telehandler', name: 'Telehandler',          desc: 'Extended lifting and placing',     rate: 4500, unit: 'hr',
        image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80' },
    ],
  },
  {
    id: 'agricultural',
    label: 'Agricultural + Construction',
    vehicles: [
      { id: 'tractor',        name: 'Tractor',              desc: 'Hauling, light earthwork',      rate: 1500, unit: 'hr',
        image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&q=80' },
      { id: 'tractor-trailer', name: 'Tractor with Trailer', desc: 'Carrying materials',           rate: 1800, unit: 'trip',
        image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&q=80' },
      { id: 'tractor-loader', name: 'Tractor Loader',       desc: 'Basic digging and loading',    rate: 2000, unit: 'hr',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
    ],
  },
  {
    id: 'other',
    label: 'Other Equipment',
    vehicles: [
      { id: 'water-tanker',   name: 'Water Tanker',     desc: 'Dust control, curing concrete',  rate: 1200, unit: 'trip',
        image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&q=80' },
      { id: 'drilling',       name: 'Drilling Machine', desc: 'Borewells, foundations',         rate: 3500, unit: 'hr',
        image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&q=80' },
      { id: 'pile-driver',    name: 'Pile Driver',      desc: 'Deep foundation work',           rate: 7000, unit: 'hr',
        image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80' },
      { id: 'concrete-pump',  name: 'Concrete Pump',    desc: 'Pumps concrete to heights',      rate: 5500, unit: 'hr',
        image: 'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=600&q=80' },
    ],
  },
  {
    id: 'native',
    label: 'Native & Traditional',
    vehicles: [
      { id: 'bullock-cart',   name: 'Bullock Cart',       desc: 'Traditional haulage for rural sites',   rate: 500,  unit: 'hr',
        image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&q=80' },
      { id: 'hand-cart',      name: 'Hand Cart',          desc: 'Manual material transport on site',     rate: 300,  unit: 'hr',
        image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80' },
      { id: 'horse-cart',     name: 'Horse Cart',         desc: 'Light haulage in narrow lanes',         rate: 700,  unit: 'hr',
        image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&q=80' },
      { id: 'cycle-rickshaw', name: 'Cycle Rickshaw',     desc: 'Small load delivery in urban areas',    rate: 200,  unit: 'trip',
        image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&q=80' },
    ],
  },
  {
    id: 'beauty',
    label: 'Beauty & Finishing',
    vehicles: [
      { id: 'paint-sprayer',   name: 'Paint Sprayer Van',   desc: 'Professional exterior painting',       rate: 2500, unit: 'hr',
        image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=80' },
      { id: 'pressure-washer', name: 'Pressure Washer',     desc: 'Deep cleaning of surfaces & floors',   rate: 1500, unit: 'hr',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
      { id: 'polishing-machine', name: 'Floor Polisher',    desc: 'Marble & tile polishing machine',      rate: 1800, unit: 'hr',
        image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=80' },
      { id: 'scaffolding-van', name: 'Scaffolding Van',     desc: 'Delivers & sets up scaffolding',        rate: 3000, unit: 'trip',
        image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80' },
    ],
  },
];

export const allVehicles = categories.flatMap(c =>
  c.vehicles.map(v => ({ ...v, category: c.id, categoryLabel: c.label }))
);
