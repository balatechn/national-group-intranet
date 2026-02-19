import EmployeeDetailClient from './EmployeeDetailClient';

export const revalidate = 0;

export default async function EmployeeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <EmployeeDetailClient employeeId={params.id} />;
}
