import AdminDashboard from '@/components/AdminDashboard';

export const metadata = {
  title: 'Admin | Induction Treasure Hunt',
};

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-ink-950">
      <AdminDashboard />
    </main>
  );
}
