import pool from './db.js';

// All services from vehicles.js — seed data for the services table
const SEED_SERVICES = [
  // Contractors & Civil
  { id: 'contractors-real-estate', name: 'Contractors Real Estate', desc: 'Professional builders & contractors for real estate developments & building construction', category: 'contractors', category_label: 'Contractors & Civil', rate: 4500, unit: 'day', image: '/images/services/contractors-real-estate.png', sort_order: 1 },
  { id: 'civil-workers', name: 'Civil Workers', desc: 'Skilled civil workers for concrete casting, reinforcement, foundations & masonry helper jobs', category: 'contractors', category_label: 'Contractors & Civil', rate: 750, unit: 'day', image: '/images/services/civil-workers.png', sort_order: 2 },
  { id: 'interior-workers', name: 'Interior Workers', desc: 'Gypsum work, ceiling grids, paneling & detailed decorative partition builders', category: 'contractors', category_label: 'Contractors & Civil', rate: 950, unit: 'day', image: '/images/services/interior-workers.png', sort_order: 3 },
  { id: 'solar-installation', name: 'Solar Installation', desc: 'End-to-end solar panels mounting, wiring, invertor setup & electrical integration', category: 'contractors', category_label: 'Contractors & Civil', rate: 3500, unit: 'visit', image: '/images/services/solar-installation.png', sort_order: 4 },
  // Construction & Site Labour
  { id: 'construction-labour', name: 'Construction Labour', desc: 'General helper labor for material hauling, site excavation assist & load carrying', category: 'construction-labour', category_label: 'Construction & Site Labour', rate: 600, unit: 'day', image: '/images/services/construction-labour.png', sort_order: 5 },
  { id: 'daily-wage-labour', name: 'Daily Wage Labour', desc: 'General manual labor helpers for basic site clearing, sorting & general helper duties', category: 'construction-labour', category_label: 'Construction & Site Labour', rate: 550, unit: 'day', image: '/images/services/daily-wage-labour.png', sort_order: 6 },
  { id: 'mason-workers', name: 'Mason Workers', desc: 'Brickwork, mortar mixing, structural plastering & concrete masonry work', category: 'construction-labour', category_label: 'Construction & Site Labour', rate: 850, unit: 'day', image: '/images/services/mason-workers.png', sort_order: 7 },
  { id: 'tiles-workers', name: 'Tiles Workers', desc: 'Marble, ceramic tiles, granite floor laying & polishing specialists', category: 'construction-labour', category_label: 'Construction & Site Labour', rate: 900, unit: 'day', image: '/images/services/tiles-workers.png', sort_order: 8 },
  { id: 'welders', name: 'Welders', desc: 'Structural steel welding, metal frame joins & generic on-site arc/gas welding repairs', category: 'construction-labour', category_label: 'Construction & Site Labour', rate: 800, unit: 'day', image: '/images/services/welders.png', sort_order: 9 },
  { id: 'fabricators', name: 'Fabricators', desc: 'Custom iron gates, window grills, roof structures & sheet fabrication experts', category: 'construction-labour', category_label: 'Construction & Site Labour', rate: 1000, unit: 'day', image: '/images/services/fabricators.png', sort_order: 10 },
  // Interior & Carpentry
  { id: 'carpenters', name: 'Carpenters', desc: 'Furniture repairs, door fitting, hinge replacement, locks fixing & custom woodwork', category: 'interior-carpentry', category_label: 'Interior & Carpentry', rate: 750, unit: 'day', image: '/images/services/carpenters.png', sort_order: 11 },
  { id: 'painters', name: 'Painters', desc: 'Interior/exterior wall painting, putty application, primer & designer walls', category: 'interior-carpentry', category_label: 'Interior & Carpentry', rate: 700, unit: 'day', image: '/images/services/painters.png', sort_order: 12 },
  { id: 'furniture-workers', name: 'Furniture Workers', desc: 'Modular kitchen assembly, bed alignment, sofa fixing & furniture polishers', category: 'interior-carpentry', category_label: 'Interior & Carpentry', rate: 800, unit: 'day', image: '/images/services/furniture-workers.png', sort_order: 13 },
  // Maintenance Professionals
  { id: 'electricians', name: 'Electricians', desc: 'Short circuit repairs, new points wiring, DB panel work & household appliance setup', category: 'professionals', category_label: 'Maintenance Professionals', rate: 350, unit: 'hr', image: '/images/services/electricians.png', sort_order: 14 },
  { id: 'plumbers', name: 'Plumbers', desc: 'Fixing pipeline leaks, basin fittings, drain blockages & bathroom fixture maintenance', category: 'professionals', category_label: 'Maintenance Professionals', rate: 350, unit: 'hr', image: '/images/services/plumbers.png', sort_order: 15 },
  { id: 'ac-technicians', name: 'AC Technicians', desc: 'AC deep jet cleaning service, gas charging, filter repairs & installation', category: 'professionals', category_label: 'Maintenance Professionals', rate: 450, unit: 'visit', image: '/images/services/ac-technicians.png', sort_order: 16 },
  { id: 'appliance-repair', name: 'Appliance Repair', desc: 'Washing machine, refrigerator, microwave & television repair technicians', category: 'professionals', category_label: 'Maintenance Professionals', rate: 500, unit: 'visit', image: '/images/services/appliance-repair.png', sort_order: 17 },
  { id: 'ro-service-water-tank', name: 'RO Service Water Tank', desc: 'RO water filter replacement, TDS calibration & tank sanitizing scrub wash', category: 'professionals', category_label: 'Maintenance Professionals', rate: 700, unit: 'visit', image: '/images/services/ro-service-water-tank.png', sort_order: 18 },
  // Technical Installations
  { id: 'cctv-installation', name: 'CCTV Installation', desc: 'High-definition cameras mounting, DVR config, cable laying & smartphone app integration', category: 'installations', category_label: 'Technical Installations', rate: 1500, unit: 'visit', image: '/images/services/cctv-installation.png', sort_order: 19 },
  // Housekeeping & Cleaning
  { id: 'cleaning-staff', name: 'Cleaning Staff', desc: 'Deep house cleaning, washroom stain removal & kitchen grease clean-up', category: 'housekeeping', category_label: 'Housekeeping & Cleaning', rate: 1000, unit: 'visit', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80', sort_order: 20 },
  { id: 'housekeeping-sweepers', name: 'Housekeeping Sweepers', desc: 'Daily cleaning, dusting, dusting waste disposal & office floors sweeping', category: 'housekeeping', category_label: 'Housekeeping & Cleaning', rate: 450, unit: 'day', image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&q=80', sort_order: 21 },
  { id: 'garden-workers', name: 'Cleaning Garden Workers', desc: 'Garden trimming, lawn moving, planting, repotting & dry leaf cleanups', category: 'housekeeping', category_label: 'Housekeeping & Cleaning', rate: 500, unit: 'day', image: '/images/services/garden-workers.png', sort_order: 22 },
  // Drivers & Logistics
  { id: 'drivers', name: 'Drivers', desc: 'Professional valets & long-distance drivers for automatic & manual commercial/private cars', category: 'drivers-logistics', category_label: 'Drivers & Logistics', rate: 800, unit: 'day', image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=80', sort_order: 23 },
  { id: 'delivery-helpers', name: 'Delivery Helpers Packers & Movers', desc: 'Packaging, carton box assembly, loading & secure home relocation helper services', category: 'drivers-logistics', category_label: 'Drivers & Logistics', rate: 1200, unit: 'visit', image: '/images/services/delivery-helpers.png', sort_order: 24 },
  // Cooking & Events
  { id: 'cooking-chefs', name: 'Cooking Chefs', desc: 'Gourmet menu designers & professional party cooks for premium events', category: 'cooking-events', category_label: 'Cooking & Events', rate: 2000, unit: 'event', image: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=600&q=80', sort_order: 25 },
  { id: 'home-cooks', name: 'Home Cooks', desc: 'Daily home meals cooks for simple, fresh home-cooked food (Veg/Non-Veg)', category: 'cooking-events', category_label: 'Cooking & Events', rate: 400, unit: 'day', image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&q=80', sort_order: 26 },
  { id: 'catering-staff', name: 'Catering Staff Event Labour', desc: 'Party table setup, buffet counter servers & decorative event helpers', category: 'cooking-events', category_label: 'Cooking & Events', rate: 700, unit: 'day', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=80', sort_order: 27 },
  { id: 'admin-approved-category', name: 'Additional Category (Admin Approved)', desc: 'Customized on-demand labor requests as approved and managed by the Admin', category: 'cooking-events', category_label: 'Cooking & Events', rate: 900, unit: 'day', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80', sort_order: 28 },
];

async function seedServices() {
  console.log('Creating services table if not exists...');
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS services (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        \`desc\` TEXT,
        category VARCHAR(100) NOT NULL,
        category_label VARCHAR(100),
        rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
        unit VARCHAR(20) NOT NULL DEFAULT 'day',
        image TEXT,
        sort_order INT DEFAULT 99,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Services table ready.');

    console.log('Seeding services data...');
    for (const s of SEED_SERVICES) {
      await pool.query(`
        INSERT INTO services (id, name, \`desc\`, category, category_label, rate, unit, image, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          \`desc\` = VALUES(\`desc\`),
          category = VALUES(category),
          category_label = VALUES(category_label),
          rate = VALUES(rate),
          unit = VALUES(unit),
          image = VALUES(image),
          sort_order = VALUES(sort_order)
      `, [s.id, s.name, s.desc, s.category, s.category_label, s.rate, s.unit, s.image, s.sort_order]);
    }

    const [count] = await pool.query('SELECT COUNT(*) as total FROM services');
    console.log(`Services seeded successfully. Total: ${count[0].total} services in database.`);
    process.exit(0);
  } catch (err) {
    console.error('Services seed failed:', err);
    process.exit(1);
  }
}

seedServices();
