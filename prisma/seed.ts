import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Companies
  console.log('Creating companies...');
  const nationalPlastics = await prisma.company.upsert({
    where: { code: 'NPL' },
    update: {},
    create: {
      name: 'National Plastics Limited',
      shortName: 'National Plastics',
      code: 'NPL',
      address: '123 Industrial Area, Phase 1',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      postalCode: '400001',
      phone: '+91 22 1234 5678',
      email: 'info@nationalplastics.in',
      website: 'https://nationalplastics.in',
      taxId: '27AABCN1234A1Z5',
      isActive: true,
    },
  });

  const nationalIndustries = await prisma.company.upsert({
    where: { code: 'NI' },
    update: {},
    create: {
      name: 'National Industries',
      shortName: 'National Industries',
      code: 'NI',
      address: '456 Industrial Estate',
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India',
      postalCode: '411001',
      phone: '+91 20 1234 5678',
      email: 'info@nationalindustries.in',
      website: 'https://nationalindustries.in',
      taxId: '27AABCN5678B1Z5',
      isActive: true,
    },
  });

  const nationalTrading = await prisma.company.upsert({
    where: { code: 'NT' },
    update: {},
    create: {
      name: 'National Trading Company',
      shortName: 'National Trading',
      code: 'NT',
      address: '789 Trade Center',
      city: 'Delhi',
      state: 'Delhi',
      country: 'India',
      postalCode: '110001',
      phone: '+91 11 1234 5678',
      email: 'info@nationaltrading.in',
      website: 'https://nationaltrading.in',
      taxId: '07AABCN9012C1Z5',
      isActive: true,
    },
  });

  // Create Departments
  console.log('Creating departments...');
  const itDept = await prisma.department.upsert({
    where: { companyId_code: { companyId: nationalPlastics.id, code: 'NPL-IT' } },
    update: {},
    create: {
      name: 'Information Technology',
      code: 'NPL-IT',
      companyId: nationalPlastics.id,
    },
  });

  const hrDept = await prisma.department.upsert({
    where: { companyId_code: { companyId: nationalPlastics.id, code: 'NPL-HR' } },
    update: {},
    create: {
      name: 'Human Resources',
      code: 'NPL-HR',
      companyId: nationalPlastics.id,
    },
  });

  const financeDept = await prisma.department.upsert({
    where: { companyId_code: { companyId: nationalPlastics.id, code: 'NPL-FIN' } },
    update: {},
    create: {
      name: 'Finance & Accounts',
      code: 'NPL-FIN',
      companyId: nationalPlastics.id,
    },
  });

  const opsDept = await prisma.department.upsert({
    where: { companyId_code: { companyId: nationalPlastics.id, code: 'NPL-OPS' } },
    update: {},
    create: {
      name: 'Operations',
      code: 'NPL-OPS',
      companyId: nationalPlastics.id,
    },
  });

  const salesDept = await prisma.department.upsert({
    where: { companyId_code: { companyId: nationalPlastics.id, code: 'NPL-SALES' } },
    update: {},
    create: {
      name: 'Sales & Marketing',
      code: 'NPL-SALES',
      companyId: nationalPlastics.id,
    },
  });

  // Create Users
  console.log('Creating users...');
  const passwordHash = await hash('Password@123', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@nationalgroup.in' },
    update: {},
    create: {
      employeeId: 'NG-ADMIN-001',
      email: 'admin@nationalgroup.in',
      password: passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      phone: '+91 9876543210',
      companyId: nationalPlastics.id,
      departmentId: itDept.id,
      jobTitle: 'System Administrator',
      status: 'ACTIVE',
    },
  });

  const itManager = await prisma.user.upsert({
    where: { email: 'itmanager@nationalgroup.in' },
    update: {},
    create: {
      employeeId: 'NPL-IT-001',
      email: 'itmanager@nationalgroup.in',
      password: passwordHash,
      firstName: 'Rajesh',
      lastName: 'Kumar',
      role: 'IT_ADMIN',
      phone: '+91 9876543211',
      companyId: nationalPlastics.id,
      departmentId: itDept.id,
      jobTitle: 'IT Manager',
      status: 'ACTIVE',
    },
  });

  const hrManager = await prisma.user.upsert({
    where: { email: 'hrmanager@nationalgroup.in' },
    update: {},
    create: {
      employeeId: 'NPL-HR-001',
      email: 'hrmanager@nationalgroup.in',
      password: passwordHash,
      firstName: 'Priya',
      lastName: 'Sharma',
      role: 'HR_ADMIN',
      phone: '+91 9876543212',
      companyId: nationalPlastics.id,
      departmentId: hrDept.id,
      jobTitle: 'HR Manager',
      status: 'ACTIVE',
    },
  });

  const employee1 = await prisma.user.upsert({
    where: { email: 'john.doe@nationalgroup.in' },
    update: {},
    create: {
      employeeId: 'NPL-IT-002',
      email: 'john.doe@nationalgroup.in',
      password: passwordHash,
      firstName: 'John',
      lastName: 'Doe',
      role: 'EMPLOYEE',
      phone: '+91 9876543213',
      companyId: nationalPlastics.id,
      departmentId: itDept.id,
      jobTitle: 'Software Developer',
      managerId: itManager.id,
      status: 'ACTIVE',
    },
  });

  const employee2 = await prisma.user.upsert({
    where: { email: 'jane.smith@nationalgroup.in' },
    update: {},
    create: {
      employeeId: 'NPL-HR-002',
      email: 'jane.smith@nationalgroup.in',
      password: passwordHash,
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'EMPLOYEE',
      phone: '+91 9876543214',
      companyId: nationalPlastics.id,
      departmentId: hrDept.id,
      jobTitle: 'HR Executive',
      managerId: hrManager.id,
      status: 'ACTIVE',
    },
  });

  // Update department heads
  await prisma.department.update({
    where: { id: itDept.id },
    data: { headId: itManager.id },
  });

  await prisma.department.update({
    where: { id: hrDept.id },
    data: { headId: hrManager.id },
  });

  // Create Vendors
  console.log('Creating vendors...');
  const vendor1 = await prisma.vendor.upsert({
    where: { companyId_code: { companyId: nationalPlastics.id, code: 'DELL-001' } },
    update: {},
    create: {
      code: 'DELL-001',
      name: 'Dell Technologies',
      type: 'Hardware',
      contactPerson: 'Amit Verma',
      email: 'sales@delltech.com',
      phone: '+91 22 4567 8901',
      address: 'Tech Park, Andheri East, Mumbai',
      website: 'https://dell.com',
      isActive: true,
      contractEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      companyId: nationalPlastics.id,
    },
  });

  const vendor2 = await prisma.vendor.upsert({
    where: { companyId_code: { companyId: nationalPlastics.id, code: 'MS-001' } },
    update: {},
    create: {
      code: 'MS-001',
      name: 'Microsoft India',
      type: 'Software',
      contactPerson: 'Neha Gupta',
      email: 'enterprise@microsoft.com',
      phone: '+91 80 4567 8902',
      address: 'Microsoft Campus, Bangalore',
      website: 'https://microsoft.com',
      isActive: true,
      contractEnd: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000),
      companyId: nationalPlastics.id,
    },
  });

  // Create System Assets
  console.log('Creating system assets...');
  await prisma.systemAsset.upsert({
    where: { assetTag: 'NPL-DT-001' },
    update: {},
    create: {
      assetTag: 'NPL-DT-001',
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
      location: 'IT Department - Floor 2',
      assignedToId: employee1.id,
      vendorId: vendor1.id,
    },
  });

  await prisma.systemAsset.upsert({
    where: { assetTag: 'NPL-LT-001' },
    update: {},
    create: {
      assetTag: 'NPL-LT-001',
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
      location: 'HR Department - Floor 1',
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

  // Create Policies
  console.log('Creating policies...');
  await prisma.policy.upsert({
    where: { companyId_code: { companyId: nationalPlastics.id, code: 'LEAVE-POL-2024' } },
    update: {},
    create: {
      code: 'LEAVE-POL-2024',
      title: 'Leave Policy 2024',
      description: 'Comprehensive leave policy covering all types of leaves for employees',
      category: 'HR',
      version: '2.0',
      effectiveDate: new Date('2024-01-01'),
      content: 'This policy outlines the leave entitlements for all employees...',
      status: 'PUBLISHED',
      createdBy: hrManager.id,
      companyId: nationalPlastics.id,
    },
  });

  await prisma.policy.upsert({
    where: { companyId_code: { companyId: nationalPlastics.id, code: 'IT-SEC-POL' } },
    update: {},
    create: {
      code: 'IT-SEC-POL',
      title: 'IT Security Policy',
      description: 'Guidelines for maintaining information security across the organization',
      category: 'IT_SECURITY',
      version: '3.1',
      effectiveDate: new Date('2024-01-01'),
      content: 'This policy defines the security guidelines for all IT systems...',
      status: 'PUBLISHED',
      createdBy: itManager.id,
      companyId: nationalPlastics.id,
    },
  });

  await prisma.policy.upsert({
    where: { companyId_code: { companyId: nationalPlastics.id, code: 'EXP-POL' } },
    update: {},
    create: {
      code: 'EXP-POL',
      title: 'Expense Reimbursement Policy',
      description: 'Guidelines for business expense claims and reimbursements',
      category: 'OPERATIONAL',
      version: '1.5',
      effectiveDate: new Date('2024-01-01'),
      content: 'This policy outlines the procedures for expense reimbursement...',
      status: 'PUBLISHED',
      createdBy: superAdmin.id,
      companyId: nationalPlastics.id,
    },
  });

  // Create sample IT Tickets
  console.log('Creating IT tickets...');
  await prisma.iTTicket.create({
    data: {
      ticketNumber: 'TKT-2024-0001',
      subject: 'Unable to access email',
      description: 'Getting authentication error when trying to access Outlook',
      category: 'EMAIL',
      priority: 'HIGH',
      status: 'OPEN',
      creatorId: employee1.id,
      slaDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
    },
  });

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
      slaDeadline: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
    },
  });

  // Create sample IT Requests
  console.log('Creating IT requests...');
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

  // Create sample Tasks
  console.log('Creating tasks...');
  await prisma.task.create({
    data: {
      title: 'Complete quarterly IT audit',
      description: 'Perform security audit of all systems and document findings',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      creatorId: superAdmin.id,
      assigneeId: itManager.id,
      departmentId: itDept.id,
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
      departmentId: hrDept.id,
    },
  });

  // Create Events
  console.log('Creating events...');
  await prisma.event.create({
    data: {
      title: 'Monthly Town Hall',
      description: 'Monthly company-wide meeting to discuss updates and Q&A',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      location: 'Main Auditorium',
      type: 'COMPANY_EVENT',
      isAllDay: false,
      companyId: nationalPlastics.id,
      creatorId: superAdmin.id,
    },
  });

  await prisma.event.create({
    data: {
      title: 'Holi Celebration',
      description: 'Holi festival celebration at office',
      startDate: new Date('2024-03-25'),
      endDate: new Date('2024-03-25'),
      location: 'Office Premises',
      type: 'HOLIDAY',
      isAllDay: true,
      creatorId: hrManager.id,
    },
  });

  // Create Shared Folders
  console.log('Creating shared folders...');
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
      departmentId: itDept.id,
      createdBy: itManager.id,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('📧 Default login credentials:');
  console.log('   Super Admin: admin@nationalgroup.in / Password@123');
  console.log('   IT Manager: itmanager@nationalgroup.in / Password@123');
  console.log('   HR Manager: hrmanager@nationalgroup.in / Password@123');
  console.log('   Employee: john.doe@nationalgroup.in / Password@123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
