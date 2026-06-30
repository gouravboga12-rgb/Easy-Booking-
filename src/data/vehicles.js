export const categories = [
  {
    id: 'contractors',
    label: 'Contractors & Civil',
    vehicles: [
      { id: 'contractors-real-estate', name: 'Contractors Real Estate', desc: 'Professional builders & contractors for real estate developments & building construction', rate: 4500, unit: 'day',
        image: '/images/services/contractors-real-estate.png' },
      { id: 'civil-workers', name: 'Civil Workers', desc: 'Skilled civil workers for concrete casting, reinforcement, foundations & masonry helper jobs', rate: 750, unit: 'day',
        image: '/images/services/civil-workers.png' },
      { id: 'interior-workers', name: 'Interior Workers', desc: 'Gypsum work, ceiling grids, paneling & detailed decorative partition builders', rate: 950, unit: 'day',
        image: '/images/services/interior-workers.png' },
      { id: 'solar-installation', name: 'Solar Installation', desc: 'End-to-end solar panels mounting, wiring, invertor setup & electrical integration', rate: 3500, unit: 'visit',
        image: '/images/services/solar-installation.png' }
    ]
  },
  {
    id: 'construction-labour',
    label: 'Construction & Site Labour',
    vehicles: [
      { id: 'construction-labour', name: 'Construction Labour', desc: 'General helper labor for material hauling, site excavation assist & load carrying', rate: 600, unit: 'day',
        image: '/images/services/construction-labour.png' },
      { id: 'daily-wage-labour', name: 'Daily Wage Labour', desc: 'General manual labor helpers for basic site clearing, sorting & general helper duties', rate: 550, unit: 'day',
        image: '/images/services/daily-wage-labour.png' },
      { id: 'mason-workers', name: 'Mason Workers', desc: 'Brickwork, mortar mixing, structural plastering & concrete masonry work', rate: 850, unit: 'day',
        image: '/images/services/mason-workers.png' },
      { id: 'tiles-workers', name: 'Tiles Workers', desc: 'Marble, ceramic tiles, granite floor laying & polishing specialists', rate: 900, unit: 'day',
        image: '/images/services/tiles-workers.png' },
      { id: 'welders', name: 'Welders', desc: 'Structural steel welding, metal frame joins & generic on-site arc/gas welding repairs', rate: 800, unit: 'day',
        image: '/images/services/welders.png' },
      { id: 'fabricators', name: 'Fabricators', desc: 'Custom iron gates, window grills, roof structures & sheet fabrication experts', rate: 1000, unit: 'day',
        image: '/images/services/fabricators.png' }
    ]
  },
  {
    id: 'interior-carpentry',
    label: 'Interior & Carpentry',
    vehicles: [
      { id: 'carpenters', name: 'Carpenters', desc: 'Furniture repairs, door fitting, hinge replacement, locks fixing & custom woodwork', rate: 750, unit: 'day',
        image: '/images/services/carpenters.png' },
      { id: 'painters', name: 'Painters', desc: 'Interior/exterior wall painting, putty application, primer & designer walls', rate: 700, unit: 'day',
        image: '/images/services/painters.png' },
      { id: 'furniture-workers', name: 'Furniture Workers', desc: 'Modular kitchen assembly, bed alignment, sofa fixing & furniture polishers', rate: 800, unit: 'day',
        image: '/images/services/furniture-workers.png' }
    ]
  },
  {
    id: 'professionals',
    label: 'Maintenance Professionals',
    vehicles: [
      { id: 'electricians', name: 'Electricians', desc: 'Short circuit repairs, new points wiring, DB panel work & household appliance setup', rate: 350, unit: 'hr',
        image: '/images/services/electricians.png' },
      { id: 'plumbers', name: 'Plumbers', desc: 'Fixing pipeline leaks, basin fittings, drain blockages & bathroom fixture maintenance', rate: 350, unit: 'hr',
        image: '/images/services/plumbers.png' },
      { id: 'ac-technicians', name: 'AC Technicians', desc: 'AC deep jet cleaning service, gas charging, filter repairs & installation', rate: 450, unit: 'visit',
        image: '/images/services/ac-technicians.png' },
      { id: 'appliance-repair', name: 'Appliance Repair', desc: 'Washing machine, refrigerator, microwave & television repair technicians', rate: 500, unit: 'visit',
        image: '/images/services/appliance-repair.png' },
      { id: 'ro-service-water-tank', name: 'RO Service Water Tank', desc: 'RO water filter replacement, TDS calibration & tank sanitizing scrub wash', rate: 700, unit: 'visit',
        image: '/images/services/ro-service-water-tank.png' }
    ]
  },
  {
    id: 'installations',
    label: 'Technical Installations',
    vehicles: [
      { id: 'cctv-installation', name: 'CCTV Installation', desc: 'High-definition cameras mounting, DVR config, cable laying & smartphone app integration', rate: 1500, unit: 'visit',
        image: '/images/services/cctv-installation.png' }
    ]
  },
  {
    id: 'housekeeping',
    label: 'Housekeeping & Cleaning',
    vehicles: [
      { id: 'cleaning-staff', name: 'Cleaning Staff', desc: 'Deep house cleaning, washroom stain removal & kitchen grease clean-up', rate: 1000, unit: 'visit',
        image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80' },
      { id: 'housekeeping-sweepers', name: 'Housekeeping Sweepers', desc: 'Daily cleaning, dusting, dusting waste disposal & office floors sweeping', rate: 450, unit: 'day',
        image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&q=80' },
      { id: 'garden-workers', name: 'Cleaning Garden Workers', desc: 'Garden trimming, lawn moving, planting, repotting & dry leaf cleanups', rate: 500, unit: 'day',
        image: '/images/services/garden-workers.png' }
    ]
  },
  {
    id: 'drivers-logistics',
    label: 'Drivers & Logistics',
    vehicles: [
      { id: 'drivers', name: 'Drivers', desc: 'Professional valets & long-distance drivers for automatic & manual commercial/private cars', rate: 800, unit: 'day',
        image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=80' },
      { id: 'delivery-helpers', name: 'Delivery Helpers Packers & Movers', desc: 'Packaging, carton box assembly, loading & secure home relocation helper services', rate: 1200, unit: 'visit',
        image: '/images/services/delivery-helpers.png' }
    ]
  },
  {
    id: 'cooking-events',
    label: 'Cooking & Events',
    vehicles: [
      { id: 'cooking-chefs', name: 'Cooking Chefs', desc: 'Gourmet menu designers & professional party cooks for premium events', rate: 2000, unit: 'event',
        image: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=600&q=80' },
      { id: 'home-cooks', name: 'Home Cooks', desc: 'Daily home meals cooks for simple, fresh home-cooked food (Veg/Non-Veg)', rate: 400, unit: 'day',
        image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&q=80' },
      { id: 'catering-staff', name: 'Catering Staff Event Labour', desc: 'Party table setup, buffet counter servers & decorative event helpers', rate: 700, unit: 'day',
        image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=80' },
      { id: 'admin-approved-category', name: 'Additional Category (Admin Approved)', desc: 'Customized on-demand labor requests as approved and managed by the Admin', rate: 900, unit: 'day',
        image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80' }
    ]
  }
];

export const allVehicles = categories.flatMap(c =>
  c.vehicles.map(v => ({ ...v, category: c.id, categoryLabel: c.label }))
);
