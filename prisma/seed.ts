import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ==========================================
  // CREATE COMPANIES - National Group India
  // ==========================================
  console.log('Creating companies...');
  
  // Parent Company - National Group India
  const nationalGroupIndia = await prisma.company.upsert({
    where: { code: 'NGI' },
    update: {},
    create: {
      name: 'National Group India',
      shortName: 'National Group',
      code: 'NGI',
      description: 'A 76-year-old diversified conglomerate since 1949, operating across infrastructure, automotive, retail, jewelry, and transportation sectors in Karnataka and India.',
      address: '7th Floor, 909 Lavelle, Sampangi Rama Nagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      postalCode: '560001',
      phone: '+91 80 4567 8900',
      email: 'connect@nationalgroupindia.com',
      website: 'https://nationalgroupindia.com',
      taxId: '29AABCN1001A1Z5',
      isActive: true,
    },
  });

  // National Infra Build - Infrastructure EPC
  const nationalInfraBuild = await prisma.company.upsert({
    where: { code: 'NIB' },
    update: {},
    create: {
      name: 'National Infrabuild Private Limited',
      shortName: 'National Infra Build',
      code: 'NIB',
      description: 'Infrastructure development company specializing in EPC projects including highways, airports, smart cities, and water supply schemes. ₹1200+ Cr total project value with 13+ major projects.',
      address: 'National Arcade, Junior College Road',
      city: 'Tirthahalli',
      state: 'Karnataka',
      country: 'India',
      postalCode: '577432',
      phone: '+91 81 8288 2345',
      email: 'connect@nationalgroupindia.com',
      website: 'https://nationalinfrabuild.com',
      taxId: '29AABCN1002B1Z5',
      isActive: true,
    },
  });

  // National Consulting India
  const nationalConsulting = await prisma.company.upsert({
    where: { code: 'NCI' },
    update: {},
    create: {
      name: 'National Consulting India Private Limited',
      shortName: 'National Consulting',
      code: 'NCI',
      description: 'Strategic consulting services providing business advisory, project management, and corporate solutions for enterprises.',
      address: '7th Floor, 909 Lavelle, Sampangi Rama Nagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      postalCode: '560001',
      phone: '+91 80 4567 8901',
      email: 'info@nationalconsultingindia.com',
      website: 'https://nationalconsultingindia.com',
      taxId: '29AABCN1003C1Z5',
      isActive: true,
    },
  });

  // Rainland Auto Corp - Automotive
  const rainlandAutoCorp = await prisma.company.upsert({
    where: { code: 'RAC' },
    update: {},
    create: {
      name: 'Rainland Autocorp Private Limited',
      shortName: 'Rainland Auto Corp',
      code: 'RAC',
      description: 'Automotive dealership and services company offering premium vehicle sales, after-sales service, and fleet management solutions.',
      address: 'Automotive Hub, BH Road',
      city: 'Shivamogga',
      state: 'Karnataka',
      country: 'India',
      postalCode: '577201',
      phone: '+91 81 8267 8901',
      email: 'sales@rainlandautocorp.com',
      website: 'https://rainlandautocorp.com',
      taxId: '29AABCN1004D1Z5',
      isActive: true,
    },
  });

  // iSky Transport Systems - Elevated Transport
  const iSkyTransport = await prisma.company.upsert({
    where: { code: 'IST' },
    update: {},
    create: {
      name: 'iSky Transport Systems Private Limited',
      shortName: 'iSky Transport',
      code: 'IST',
      description: 'Revolutionary urban mobility company providing elevated, efficient, and sustainable transport solutions. Next-gen public transportation with string rail technology in association with USky Transport FZE.',
      address: '4th Floor, 909 Lavelle, Lavelle Road, Shanthala Nagar, Sampangi Rama Nagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      postalCode: '560001',
      phone: '+91 80 4567 8902',
      email: 'connect@iskytransport.com',
      website: 'https://iskytransport.com',
      taxId: '29AABCN1005E1Z5',
      isActive: true,
    },
  });

  // National Resource - Real Estate
  const nationalResource = await prisma.company.upsert({
    where: { code: 'NRE' },
    update: {},
    create: {
      name: 'National Resource Private Limited',
      shortName: 'National Resource',
      code: 'NRE',
      description: 'Real estate development company focused on premium residential, commercial, and mixed-use property development across Karnataka.',
      address: 'National Arcade, Junior College Road',
      city: 'Tirthahalli',
      state: 'Karnataka',
      country: 'India',
      postalCode: '577432',
      phone: '+91 81 8288 3456',
      email: 'realestate@nationalgroupindia.com',
      website: 'https://nationalgroupindia.com/realestate',
      taxId: '29AABCN1006F1Z5',
      isActive: true,
    },
  });

  // Reference for backwards compatibility
  const nationalPlastics = nationalGroupIndia;

  // ==========================================
  // CREATE DEPARTMENTS - For All Companies
  // ==========================================
  console.log('Creating departments...');
  
  // National Group India (Corporate) Departments
  const corpItDept = await prisma.department.upsert({
    where: { companyId_code: { companyId: nationalGroupIndia.id, code: 'NGI-IT' } },
    update: {},
    create: {
      name: 'Information Technology',
      code: 'NGI-IT',
      description: 'Corporate IT & Digital Transformation',
      companyId: nationalGroupIndia.id,
    },
  });

  const corpHrDept = await prisma.department.upsert({
    where: { companyId_code: { companyId: nationalGroupIndia.id, code: 'NGI-HR' } },
    update: {},
    create: {
      name: 'Human Resources',
      code: 'NGI-HR',
      description: 'Corporate HR & Talent Management',
      companyId: nationalGroupIndia.id,
    },
  });

  const corpFinanceDept = await prisma.department.upsert({
    where: { companyId_code: { companyId: nationalGroupIndia.id, code: 'NGI-FIN' } },
    update: {},
    create: {
      name: 'Finance & Accounts',
      code: 'NGI-FIN',
      description: 'Corporate Finance, Treasury & Accounts',
      companyId: nationalGroupIndia.id,
    },
  });

  const corpAdminDept = await prisma.department.upsert({
    where: { companyId_code: { companyId: nationalGroupIndia.id, code: 'NGI-ADMIN' } },
    update: {},
    create: {
      name: 'Administration',
      code: 'NGI-ADMIN',
      description: 'Corporate Administration & Facilities',
      companyId: nationalGroupIndia.id,
    },
  });

  const corpLegalDept = await prisma.department.upsert({
    where: { companyId_code: { companyId: nationalGroupIndia.id, code: 'NGI-LEGAL' } },
    update: {},
    create: {
      name: 'Legal & Compliance',
      code: 'NGI-LEGAL',
      description: 'Legal Affairs, Contracts & Regulatory Compliance',
      companyId: nationalGroupIndia.id,
    },
  });

  // National Infra Build Departments
  const nibProjectsDept = await prisma.department.upsert({
    where: { companyId_code: { companyId: nationalInfraBuild.id, code: 'NIB-PROJ' } },
    update: {},
    create: {
      name: 'Projects & Execution',
      code: 'NIB-PROJ',
      description: 'Infrastructure Project Management & Execution',
      companyId: nationalInfraBuild.id,
    },
  });

  const nibEnggDept = await prisma.department.upsert({
    where: { companyId_code: { companyId: nationalInfraBuild.id, code: 'NIB-ENGG' } },
    update: {},
    create: {
      name: 'Engineering & Design',
      code: 'NIB-ENGG',
      description: 'Civil Engineering, Design & Technical Services',
      companyId: nationalInfraBuild.id,
    },
  });

  const nibProcDept = await prisma.department.upsert({
    where: { companyId_code: { companyId: nationalInfraBuild.id, code: 'NIB-PROC' } },
    update: {},
    create: {
      name: 'Procurement & Supply Chain',
      code: 'NIB-PROC',
      description: 'Materials, Equipment & Vendor Management',
      companyId: nationalInfraBuild.id,
    },
  });

  // iSky Transport Departments
  const istRndDept = await prisma.department.upsert({
    where: { companyId_code: { companyId: iSkyTransport.id, code: 'IST-RND' } },
    update: {},
    create: {
      name: 'Research & Development',
      code: 'IST-RND',
      description: 'Transport Technology R&D & Innovation',
      companyId: iSkyTransport.id,
    },
  });

  const istOpsDept = await prisma.department.upsert({
    where: { companyId_code: { companyId: iSkyTransport.id, code: 'IST-OPS' } },
    update: {},
    create: {
      name: 'Operations',
      code: 'IST-OPS',
      description: 'Transport Operations & Fleet Management',
      companyId: iSkyTransport.id,
    },
  });

  // Rainland Auto Corp Departments
  const racSalesDept = await prisma.department.upsert({
    where: { companyId_code: { companyId: rainlandAutoCorp.id, code: 'RAC-SALES' } },
    update: {},
    create: {
      name: 'Sales & Marketing',
      code: 'RAC-SALES',
      description: 'Vehicle Sales, Showroom & Marketing',
      companyId: rainlandAutoCorp.id,
    },
  });

  const racServiceDept = await prisma.department.upsert({
    where: { companyId_code: { companyId: rainlandAutoCorp.id, code: 'RAC-SVC' } },
    update: {},
    create: {
      name: 'Service & Workshop',
      code: 'RAC-SVC',
      description: 'Vehicle Service, Repairs & Maintenance',
      companyId: rainlandAutoCorp.id,
    },
  });

  // National Resource Departments
  const nreDevDept = await prisma.department.upsert({
    where: { companyId_code: { companyId: nationalResource.id, code: 'NRE-DEV' } },
    update: {},
    create: {
      name: 'Project Development',
      code: 'NRE-DEV',
      description: 'Real Estate Project Planning & Development',
      companyId: nationalResource.id,
    },
  });

  const nreSalesDept = await prisma.department.upsert({
    where: { companyId_code: { companyId: nationalResource.id, code: 'NRE-SALES' } },
    update: {},
    create: {
      name: 'Sales & Leasing',
      code: 'NRE-SALES',
      description: 'Property Sales, Leasing & Client Relations',
      companyId: nationalResource.id,
    },
  });

  // Reference for backwards compatibility
  const itDept = corpItDept;
  const hrDept = corpHrDept;
  const financeDept = corpFinanceDept;
  const opsDept = corpAdminDept;
  const salesDept = racSalesDept;

  // ==========================================
  // CREATE USERS - Employees with Hierarchy
  // ==========================================
  console.log('Creating users...');
  const passwordHash = await hash('Password@123', 12);

  // CEO - Top of hierarchy
  const ceo = await prisma.user.upsert({
    where: { email: 'ceo@nationalgroupindia.com' },
    update: {},
    create: {
      employeeId: 'NGI-CEO-001',
      email: 'ceo@nationalgroupindia.com',
      password: passwordHash,
      firstName: 'Raghavendra',
      lastName: 'Nagaraj',
      displayName: 'Raghavendra Nagaraj',
      role: 'SUPER_ADMIN',
      phone: '+91 98450 00001',
      companyId: nationalGroupIndia.id,
      departmentId: corpAdminDept.id,
      jobTitle: 'Chairman & Managing Director',
      status: 'ACTIVE',
    },
  });

  // Super Admin - System Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@nationalgroupindia.com' },
    update: {},
    create: {
      employeeId: 'NGI-ADM-001',
      email: 'admin@nationalgroupindia.com',
      password: passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      displayName: 'System Admin',
      role: 'SUPER_ADMIN',
      phone: '+91 98450 00002',
      companyId: nationalGroupIndia.id,
      departmentId: corpItDept.id,
      jobTitle: 'System Administrator',
      managerId: ceo.id,
      status: 'ACTIVE',
    },
  });

  // Corporate IT Manager - Reports to CEO
  const itManager = await prisma.user.upsert({
    where: { email: 'it.head@nationalgroupindia.com' },
    update: {},
    create: {
      employeeId: 'NGI-IT-001',
      email: 'it.head@nationalgroupindia.com',
      password: passwordHash,
      firstName: 'Rajesh',
      lastName: 'Kumar',
      displayName: 'Rajesh Kumar',
      role: 'IT_ADMIN',
      phone: '+91 98450 10001',
      companyId: nationalGroupIndia.id,
      departmentId: corpItDept.id,
      jobTitle: 'Chief Information Officer',
      managerId: ceo.id,
      status: 'ACTIVE',
    },
  });

  // Corporate HR Manager - Reports to CEO
  const hrManager = await prisma.user.upsert({
    where: { email: 'hr.head@nationalgroupindia.com' },
    update: {},
    create: {
      employeeId: 'NGI-HR-001',
      email: 'hr.head@nationalgroupindia.com',
      password: passwordHash,
      firstName: 'Priya',
      lastName: 'Sharma',
      displayName: 'Priya Sharma',
      role: 'HR_ADMIN',
      phone: '+91 98450 20001',
      companyId: nationalGroupIndia.id,
      departmentId: corpHrDept.id,
      jobTitle: 'Chief Human Resources Officer',
      managerId: ceo.id,
      status: 'ACTIVE',
    },
  });

  // Finance Head - Reports to CEO
  const financeHead = await prisma.user.upsert({
    where: { email: 'finance.head@nationalgroupindia.com' },
    update: {},
    create: {
      employeeId: 'NGI-FIN-001',
      email: 'finance.head@nationalgroupindia.com',
      password: passwordHash,
      firstName: 'Suresh',
      lastName: 'Menon',
      displayName: 'Suresh Menon',
      role: 'ADMIN',
      phone: '+91 98450 30001',
      companyId: nationalGroupIndia.id,
      departmentId: corpFinanceDept.id,
      jobTitle: 'Chief Financial Officer',
      managerId: ceo.id,
      status: 'ACTIVE',
    },
  });

  // IT Team Members - Report to IT Manager
  const employee1 = await prisma.user.upsert({
    where: { email: 'arun.kumar@nationalgroupindia.com' },
    update: {},
    create: {
      employeeId: 'NGI-IT-002',
      email: 'arun.kumar@nationalgroupindia.com',
      password: passwordHash,
      firstName: 'Arun',
      lastName: 'Kumar',
      displayName: 'Arun Kumar',
      role: 'EMPLOYEE',
      phone: '+91 98450 10002',
      companyId: nationalGroupIndia.id,
      departmentId: corpItDept.id,
      jobTitle: 'Senior Software Developer',
      managerId: itManager.id,
      status: 'ACTIVE',
    },
  });

  const itEmployee2 = await prisma.user.upsert({
    where: { email: 'meera.nair@nationalgroupindia.com' },
    update: {},
    create: {
      employeeId: 'NGI-IT-003',
      email: 'meera.nair@nationalgroupindia.com',
      password: passwordHash,
      firstName: 'Meera',
      lastName: 'Nair',
      displayName: 'Meera Nair',
      role: 'EMPLOYEE',
      phone: '+91 98450 10003',
      companyId: nationalGroupIndia.id,
      departmentId: corpItDept.id,
      jobTitle: 'Network Administrator',
      managerId: itManager.id,
      status: 'ACTIVE',
    },
  });

  // HR Team Members - Report to HR Manager
  const employee2 = await prisma.user.upsert({
    where: { email: 'divya.raj@nationalgroupindia.com' },
    update: {},
    create: {
      employeeId: 'NGI-HR-002',
      email: 'divya.raj@nationalgroupindia.com',
      password: passwordHash,
      firstName: 'Divya',
      lastName: 'Raj',
      displayName: 'Divya Raj',
      role: 'EMPLOYEE',
      phone: '+91 98450 20002',
      companyId: nationalGroupIndia.id,
      departmentId: corpHrDept.id,
      jobTitle: 'HR Executive',
      managerId: hrManager.id,
      status: 'ACTIVE',
    },
  });

  // National Infra Build Team
  const nibProjectManager = await prisma.user.upsert({
    where: { email: 'karthik.gowda@nationalinfrabuild.com' },
    update: {},
    create: {
      employeeId: 'NIB-PROJ-001',
      email: 'karthik.gowda@nationalinfrabuild.com',
      password: passwordHash,
      firstName: 'Karthik',
      lastName: 'Gowda',
      displayName: 'Karthik Gowda',
      role: 'MANAGER',
      phone: '+91 98451 00001',
      companyId: nationalInfraBuild.id,
      departmentId: nibProjectsDept.id,
      jobTitle: 'Vice President - Projects',
      managerId: ceo.id,
      status: 'ACTIVE',
    },
  });

  const nibEngineer = await prisma.user.upsert({
    where: { email: 'vinay.hegde@nationalinfrabuild.com' },
    update: {},
    create: {
      employeeId: 'NIB-ENGG-001',
      email: 'vinay.hegde@nationalinfrabuild.com',
      password: passwordHash,
      firstName: 'Vinay',
      lastName: 'Hegde',
      displayName: 'Vinay Hegde',
      role: 'EMPLOYEE',
      phone: '+91 98451 00002',
      companyId: nationalInfraBuild.id,
      departmentId: nibEnggDept.id,
      jobTitle: 'Senior Civil Engineer',
      managerId: nibProjectManager.id,
      status: 'ACTIVE',
    },
  });

  // iSky Transport Team
  const istHead = await prisma.user.upsert({
    where: { email: 'narayan.murthy@iskytransport.com' },
    update: {},
    create: {
      employeeId: 'IST-MGT-001',
      email: 'narayan.murthy@iskytransport.com',
      password: passwordHash,
      firstName: 'Narayan',
      lastName: 'Murthy',
      displayName: 'Narayan Murthy',
      role: 'MANAGER',
      phone: '+91 98452 00001',
      companyId: iSkyTransport.id,
      departmentId: istRndDept.id,
      jobTitle: 'Director - Technology',
      managerId: ceo.id,
      status: 'ACTIVE',
    },
  });

  // Rainland Auto Corp Team
  const racHead = await prisma.user.upsert({
    where: { email: 'manjunath.shetty@rainlandautocorp.com' },
    update: {},
    create: {
      employeeId: 'RAC-MGT-001',
      email: 'manjunath.shetty@rainlandautocorp.com',
      password: passwordHash,
      firstName: 'Manjunath',
      lastName: 'Shetty',
      displayName: 'Manjunath Shetty',
      role: 'MANAGER',
      phone: '+91 98453 00001',
      companyId: rainlandAutoCorp.id,
      departmentId: racSalesDept.id,
      jobTitle: 'General Manager - Sales',
      managerId: ceo.id,
      status: 'ACTIVE',
    },
  });

  // National Resource Team
  const nreHead = await prisma.user.upsert({
    where: { email: 'ashok.ravi@nationalgroupindia.com' },
    update: {},
    create: {
      employeeId: 'NRE-MGT-001',
      email: 'ashok.ravi@nationalgroupindia.com',
      password: passwordHash,
      firstName: 'Ashok',
      lastName: 'Ravi',
      displayName: 'Ashok Ravi',
      role: 'MANAGER',
      phone: '+91 98454 00001',
      companyId: nationalResource.id,
      departmentId: nreDevDept.id,
      jobTitle: 'Director - Real Estate',
      managerId: ceo.id,
      status: 'ACTIVE',
    },
  });

  // ==========================================
  // UPDATE DEPARTMENT HEADS
  // ==========================================
  await prisma.department.update({
    where: { id: corpItDept.id },
    data: { headId: itManager.id },
  });

  await prisma.department.update({
    where: { id: corpHrDept.id },
    data: { headId: hrManager.id },
  });

  await prisma.department.update({
    where: { id: corpFinanceDept.id },
    data: { headId: financeHead.id },
  });

  await prisma.department.update({
    where: { id: nibProjectsDept.id },
    data: { headId: nibProjectManager.id },
  });

  await prisma.department.update({
    where: { id: istRndDept.id },
    data: { headId: istHead.id },
  });

  await prisma.department.update({
    where: { id: racSalesDept.id },
    data: { headId: racHead.id },
  });

  await prisma.department.update({
    where: { id: nreDevDept.id },
    data: { headId: nreHead.id },
  });

  // ==========================================
  // CREATE VENDORS
  // ==========================================
  console.log('Creating vendors...');
  const vendor1 = await prisma.vendor.upsert({
    where: { companyId_code: { companyId: nationalGroupIndia.id, code: 'DELL-001' } },
    update: {},
    create: {
      code: 'DELL-001',
      name: 'Dell Technologies',
      type: 'Hardware',
      contactPerson: 'Amit Verma',
      email: 'sales@delltech.com',
      phone: '+91 80 4567 8901',
      address: 'Dell India Centre, Domlur, Bengaluru',
      website: 'https://dell.com',
      isActive: true,
      contractEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      companyId: nationalGroupIndia.id,
    },
  });

  const vendor2 = await prisma.vendor.upsert({
    where: { companyId_code: { companyId: nationalGroupIndia.id, code: 'MS-001' } },
    update: {},
    create: {
      code: 'MS-001',
      name: 'Microsoft India',
      type: 'Software',
      contactPerson: 'Neha Gupta',
      email: 'enterprise@microsoft.com',
      phone: '+91 80 4567 8902',
      address: 'Microsoft Campus, Bellandur, Bengaluru',
      website: 'https://microsoft.com',
      isActive: true,
      contractEnd: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000),
      companyId: nationalGroupIndia.id,
    },
  });

  // ==========================================
  // CREATE SYSTEM ASSETS
  // ==========================================
  console.log('Creating system assets...');
  await prisma.systemAsset.upsert({
    where: { assetTag: 'NGI-DT-001' },
    update: {},
    create: {
      assetTag: 'NGI-DT-001',
      name: 'Dell OptiPlex 7090',
      type: 'DESKTOP',
      manufacturer: 'Dell',
      model: 'OptiPlex 7090',
      serialNumber: 'DELL123456789',
      processor: 'Intel Core i7-11700',
      ram: '16GB DDR4',
      storage: '512GB NVMe SSD',
      operatingSystem: 'Windows 11 Pro',
      purchaseDate: new Date('2023-01-15'),
      warrantyExpiry: new Date('2026-01-15'),
      purchasePrice: 85000,
      status: 'ASSIGNED',
      location: 'Corporate Office - IT Department, 7th Floor, 909 Lavelle',
      assignedToId: employee1.id,
      vendorId: vendor1.id,
    },
  });

  await prisma.systemAsset.upsert({
    where: { assetTag: 'NGI-LT-001' },
    update: {},
    create: {
      assetTag: 'NGI-LT-001',
      name: 'Dell Latitude 5520',
      type: 'LAPTOP',
      manufacturer: 'Dell',
      model: 'Latitude 5520',
      serialNumber: 'DELL987654321',
      processor: 'Intel Core i5-1145G7',
      ram: '16GB DDR4',
      storage: '256GB NVMe SSD',
      operatingSystem: 'Windows 11 Pro',
      purchaseDate: new Date('2023-03-20'),
      warrantyExpiry: new Date('2026-03-20'),
      purchasePrice: 95000,
      status: 'ASSIGNED',
      location: 'Corporate Office - HR Department, 7th Floor, 909 Lavelle',
      assignedToId: employee2.id,
      vendorId: vendor1.id,
    },
  });

  // Create Software
  console.log('Creating software...');
  await prisma.software.upsert({
    where: { id: 'ms365-e3' },
    update: {},
    create: {
      id: 'ms365-e3',
      name: 'Microsoft 365 Business',
      version: 'E3',
      licenseType: 'SUBSCRIPTION',
      totalLicenses: 100,
      usedLicenses: 45,
      licenseKey: 'M365-E3-XXXXX-XXXXX-XXXXX',
      purchaseDate: new Date('2023-01-01'),
      expiryDate: new Date('2024-12-31'),
      purchasePrice: 500000,
      isActive: true,
      vendorId: vendor2.id,
    },
  });

  await prisma.software.upsert({
    where: { id: 'adobe-cc-2024' },
    update: {},
    create: {
      id: 'adobe-cc-2024',
      name: 'Adobe Creative Cloud',
      version: '2024',
      licenseType: 'SUBSCRIPTION',
      totalLicenses: 10,
      usedLicenses: 8,
      licenseKey: 'ADOBE-CC-XXXXX-XXXXX',
      purchaseDate: new Date('2023-06-01'),
      expiryDate: new Date('2024-05-31'),
      purchasePrice: 120000,
      isActive: true,
    },
  });

  // ==========================================
  // CREATE POLICIES
  // ==========================================
  console.log('Creating policies...');
  await prisma.policy.upsert({
    where: { companyId_code: { companyId: nationalGroupIndia.id, code: 'LEAVE-POL-2024' } },
    update: {},
    create: {
      code: 'LEAVE-POL-2024',
      title: 'Leave Policy 2024',
      description: 'Comprehensive leave policy covering all types of leaves for employees',
      category: 'HR',
      version: '2.0',
      effectiveDate: new Date('2024-01-01'),
      content: 'This policy outlines the leave entitlements for all employees of National Group India and its subsidiaries...',
      status: 'PUBLISHED',
      createdBy: hrManager.id,
      companyId: nationalGroupIndia.id,
    },
  });

  await prisma.policy.upsert({
    where: { companyId_code: { companyId: nationalGroupIndia.id, code: 'IT-SEC-POL' } },
    update: {},
    create: {
      code: 'IT-SEC-POL',
      title: 'IT Security Policy',
      description: 'Guidelines for maintaining information security across the organization',
      category: 'IT_SECURITY',
      version: '3.1',
      effectiveDate: new Date('2024-01-01'),
      content: 'This policy defines the security guidelines for all IT systems across National Group India...',
      status: 'PUBLISHED',
      createdBy: itManager.id,
      companyId: nationalGroupIndia.id,
    },
  });

  await prisma.policy.upsert({
    where: { companyId_code: { companyId: nationalGroupIndia.id, code: 'EXP-POL' } },
    update: {},
    create: {
      code: 'EXP-POL',
      title: 'Expense Reimbursement Policy',
      description: 'Guidelines for business expense claims and reimbursements',
      category: 'OPERATIONAL',
      version: '1.5',
      effectiveDate: new Date('2024-01-01'),
      content: 'This policy outlines the procedures for expense reimbursement for all National Group entities...',
      status: 'PUBLISHED',
      createdBy: financeHead.id,
      companyId: nationalGroupIndia.id,
    },
  });

  // Create sample IT Tickets (skip if already exist)
  console.log('Creating IT tickets...');
  const existingTicket1 = await prisma.iTTicket.findUnique({ where: { ticketNumber: 'TKT-2024-0001' } });
  if (!existingTicket1) {
    await prisma.iTTicket.create({
      data: {
        ticketNumber: 'TKT-2024-0001',
        subject: 'Unable to access email',
        description: 'Getting authentication error when trying to access Outlook',
        category: 'EMAIL',
        priority: 'HIGH',
        status: 'OPEN',
        creatorId: employee1.id,
        slaDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000),
      },
    });
  }

  const existingTicket2 = await prisma.iTTicket.findUnique({ where: { ticketNumber: 'TKT-2024-0002' } });
  if (!existingTicket2) {
    await prisma.iTTicket.create({
      data: {
        ticketNumber: 'TKT-2024-0002',
        subject: 'Laptop running slow',
        description: 'System performance has degraded significantly',
        category: 'HARDWARE',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        creatorId: employee2.id,
        assigneeId: itManager.id,
        slaDeadline: new Date(Date.now() + 8 * 60 * 60 * 1000),
      },
    });
  }

  // Create sample IT Requests (skip if already exist)
  console.log('Creating IT requests...');
  const existingRequest = await prisma.iTRequest.findUnique({ where: { requestNumber: 'REQ-2024-0001' } });
  if (!existingRequest) {
    await prisma.iTRequest.create({
      data: {
        requestNumber: 'REQ-2024-0001',
        subject: 'New laptop request',
        description: 'Request for a new laptop for project work',
        type: 'NEW_HARDWARE',
        status: 'PENDING_APPROVAL',
        requestorId: employee1.id,
        justification: 'Current laptop is 4 years old and unable to handle development workload',
      },
    });
  }

  // Create sample Tasks (only if none exist)
  console.log('Creating tasks...');
  const taskCount = await prisma.task.count();
  if (taskCount === 0) {
    await prisma.task.create({
      data: {
        title: 'Complete quarterly IT audit',
        description: 'Perform security audit of all systems and document findings',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        creatorId: superAdmin.id,
        assigneeId: itManager.id,
        departmentId: corpItDept.id,
      },
    });

    await prisma.task.create({
      data: {
        title: 'Update employee handbook',
        description: 'Review and update the employee handbook for 2024',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        creatorId: hrManager.id,
        assigneeId: employee2.id,
        departmentId: corpHrDept.id,
      },
    });
  }

  // ==========================================
  // CREATE EVENTS
  // ==========================================
  console.log('Creating events...');
  const eventCount = await prisma.event.count();
  if (eventCount === 0) {
    await prisma.event.create({
      data: {
        title: 'Monthly Town Hall',
        description: 'Monthly company-wide meeting to discuss updates and Q&A',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        location: 'Corporate Office - 7th Floor, 909 Lavelle, Bengaluru',
        type: 'COMPANY_EVENT',
        isAllDay: false,
        companyId: nationalGroupIndia.id,
        creatorId: ceo.id,
      },
    });

    await prisma.event.create({
      data: {
        title: 'Foundation Day Celebration',
        description: 'Celebrating 76 years of National Group India - Since 1949',
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-01-15'),
        location: 'Head Office - National Arcade, Tirthahalli',
        type: 'COMPANY_EVENT',
        isAllDay: true,
        companyId: nationalGroupIndia.id,
        creatorId: hrManager.id,
      },
    });
  }

  // Create Shared Folders (only if none exist)
  console.log('Creating shared folders...');
  const folderCount = await prisma.sharedFolder.count();
  if (folderCount === 0) {
    await prisma.sharedFolder.create({
      data: {
        name: 'Company Policies',
        description: 'All company policy documents',
        driveId: 'placeholder-drive-id',
        folderId: 'placeholder-folder-policies',
        webUrl: 'https://onedrive.sharepoint.com/policies',
        isCompanyWide: true,
        createdBy: superAdmin.id,
      },
    });

    await prisma.sharedFolder.create({
      data: {
        name: 'IT Resources',
        description: 'IT documentation and resources',
        driveId: 'placeholder-drive-id',
        folderId: 'placeholder-folder-it',
        webUrl: 'https://onedrive.sharepoint.com/it-resources',
        departmentId: corpItDept.id,
        createdBy: itManager.id,
      },
    });
  }

  // ==========================================
  // SUCCESS OUTPUT
  // ==========================================
  // ==========================================
  // CREATE DEMO ACCOUNTS
  // ==========================================
  console.log('Creating demo accounts...');
  const demoPasswordHash = await hash('Demo@123', 12);

  await prisma.user.upsert({
    where: { email: 'demo.admin@nationalgroupindia.com' },
    update: { password: demoPasswordHash },
    create: {
      employeeId: 'DEMO-ADM-001',
      email: 'demo.admin@nationalgroupindia.com',
      password: demoPasswordHash,
      firstName: 'Demo',
      lastName: 'Admin',
      displayName: 'Demo Admin',
      role: 'ADMIN',
      phone: '+91 90000 00001',
      companyId: nationalGroupIndia.id,
      departmentId: corpItDept.id,
      jobTitle: 'IT Administrator',
      managerId: ceo.id,
      status: 'ACTIVE',
    },
  });

  await prisma.user.upsert({
    where: { email: 'demo.manager@nationalgroupindia.com' },
    update: { password: demoPasswordHash },
    create: {
      employeeId: 'DEMO-MGR-001',
      email: 'demo.manager@nationalgroupindia.com',
      password: demoPasswordHash,
      firstName: 'Demo',
      lastName: 'Manager',
      displayName: 'Demo Manager',
      role: 'MANAGER',
      phone: '+91 90000 00002',
      companyId: nationalGroupIndia.id,
      departmentId: corpAdminDept.id,
      jobTitle: 'Department Manager',
      managerId: ceo.id,
      status: 'ACTIVE',
    },
  });

  await prisma.user.upsert({
    where: { email: 'demo.employee@nationalgroupindia.com' },
    update: { password: demoPasswordHash },
    create: {
      employeeId: 'DEMO-EMP-001',
      email: 'demo.employee@nationalgroupindia.com',
      password: demoPasswordHash,
      firstName: 'Demo',
      lastName: 'Employee',
      displayName: 'Demo Employee',
      role: 'EMPLOYEE',
      phone: '+91 90000 00003',
      companyId: nationalGroupIndia.id,
      departmentId: corpItDept.id,
      jobTitle: 'Software Developer',
      managerId: itManager.id,
      status: 'ACTIVE',
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('🏢 Companies Created:');
  console.log('   1. National Group India (Parent) - NGI');
  console.log('   2. National Infrabuild Pvt Ltd - NIB');
  console.log('   3. National Consulting India - NCI');
  console.log('   4. Rainland Autocorp Pvt Ltd - RAC');
  console.log('   5. iSky Transport Systems - IST');
  console.log('   6. National Resource Pvt Ltd - NRE');
  console.log('');
  console.log('📧 Default login credentials:');
  console.log('   CEO: ceo@nationalgroupindia.com / Password@123');
  console.log('   Admin: admin@nationalgroupindia.com / Password@123');
  console.log('   CIO: it.head@nationalgroupindia.com / Password@123');
  console.log('   CHRO: hr.head@nationalgroupindia.com / Password@123');
  console.log('   CFO: finance.head@nationalgroupindia.com / Password@123');
  console.log('');
  console.log('🎭 Demo Accounts:');
  console.log('   Admin:    demo.admin@nationalgroupindia.com / Demo@123');
  console.log('   Manager:  demo.manager@nationalgroupindia.com / Demo@123');
  console.log('   Employee: demo.employee@nationalgroupindia.com / Demo@123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
