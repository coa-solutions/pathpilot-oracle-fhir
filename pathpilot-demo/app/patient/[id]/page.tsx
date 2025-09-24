import PatientLabCommandCenter from '@/components/PatientLabCommandCenter';

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  return <PatientLabCommandCenter patientId={params.id} />;
}