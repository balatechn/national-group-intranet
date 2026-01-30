import Image from 'next/image';
import { Building2, Users, Globe, Target, Heart, Award, MapPin, Mail, Phone } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { prisma } from '@/lib/db';

async function getGroupStats() {
  const [companiesCount, employeesCount, departmentsCount] = await Promise.all([
    prisma.company.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.department.count(),
  ]);

  return {
    companiesCount,
    employeesCount,
    departmentsCount,
  };
}

export default async function AboutPage() {
  const stats = await getGroupStats();

  const values = [
    {
      icon: Target,
      title: 'Excellence',
      description: 'We strive for excellence in everything we do, setting high standards and continuously improving.',
    },
    {
      icon: Heart,
      title: 'Integrity',
      description: 'We conduct our business with honesty, transparency, and ethical practices.',
    },
    {
      icon: Users,
      title: 'Collaboration',
      description: 'We work together as one team across all companies, sharing knowledge and supporting each other.',
    },
    {
      icon: Award,
      title: 'Innovation',
      description: 'We embrace change and continuously seek innovative solutions to meet evolving challenges.',
    },
  ];

  const companies = [
    {
      name: 'National Plastics',
      shortName: 'NPL',
      description: 'Leading manufacturer of plastic products and solutions',
      color: 'bg-blue-500',
    },
    {
      name: 'National Industries',
      shortName: 'NI',
      description: 'Diversified industrial manufacturing and services',
      color: 'bg-green-500',
    },
    {
      name: 'National Trading',
      shortName: 'NT',
      description: 'Import, export, and distribution services',
      color: 'bg-purple-500',
    },
    {
      name: 'National Logistics',
      shortName: 'NL',
      description: 'Comprehensive logistics and supply chain solutions',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-primary px-8 py-16 text-white">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold">National Group India</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/90">
            A diversified conglomerate committed to excellence, innovation, and sustainable growth.
            Since our establishment, we have been at the forefront of industrial advancement in India.
          </p>
        </div>
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/10" />
      </div>

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 bg-primary text-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <Building2 className="mx-auto h-10 w-10 opacity-80" />
              <p className="mt-4 text-4xl font-bold">{stats.companiesCount}</p>
              <p className="mt-1 text-white/80">Group Companies</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-secondary text-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="mx-auto h-10 w-10 opacity-80" />
              <p className="mt-4 text-4xl font-bold">{stats.employeesCount}+</p>
              <p className="mt-1 text-white/80">Employees</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-success text-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <Globe className="mx-auto h-10 w-10 opacity-80" />
              <p className="mt-4 text-4xl font-bold">50+</p>
              <p className="mt-1 text-white/80">Years of Excellence</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-info text-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <Award className="mx-auto h-10 w-10 opacity-80" />
              <p className="mt-4 text-4xl font-bold">{stats.departmentsCount}</p>
              <p className="mt-1 text-white/80">Departments</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Our Values */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Our Values</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div key={value.title} className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
                  <value.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-text-primary">{value.title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{value.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Our Companies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Our Companies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            {companies.map((company) => (
              <div
                key={company.shortName}
                className="flex items-start gap-4 rounded-lg border p-4 hover:bg-surface-secondary transition-colors"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${company.color} text-white font-bold`}>
                  {company.shortName}
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">{company.name}</h3>
                  <p className="mt-1 text-sm text-text-secondary">{company.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mission & Vision */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-primary-100 border-0">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary p-3">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-primary">Our Mission</h3>
                <p className="mt-3 text-text-secondary">
                  To be a leading industrial conglomerate that delivers exceptional value to our
                  customers, employees, and stakeholders through innovative products, sustainable
                  practices, and operational excellence.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-secondary-100 border-0">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-secondary p-3">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-secondary">Our Vision</h3>
                <p className="mt-3 text-text-secondary">
                  To become India's most trusted and admired industrial group, recognized for our
                  commitment to quality, sustainability, and creating lasting value for all our
                  stakeholders.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Corporate Office</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary-100 p-2">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-text-primary">Address</h4>
                <p className="mt-1 text-sm text-text-secondary">
                  National Group Tower<br />
                  123 Business District<br />
                  Mumbai, Maharashtra 400001<br />
                  India
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary-100 p-2">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-text-primary">Phone</h4>
                <p className="mt-1 text-sm text-text-secondary">
                  +91 22 1234 5678<br />
                  +91 22 1234 5679
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary-100 p-2">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-text-primary">Email</h4>
                <p className="mt-1 text-sm text-text-secondary">
                  info@nationalgroup.in<br />
                  support@nationalgroup.in
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-text-muted">
        <p>© 2024 National Group India. All rights reserved.</p>
        <p className="mt-1">Enterprise Intranet Portal v1.0.0</p>
      </div>
    </div>
  );
}
