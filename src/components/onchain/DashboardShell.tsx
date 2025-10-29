import { GlobalSuiProvider } from '../providers/GlobalSuiProvider';
import Header from '../shared/Header';
import DialogStored from '../shared/DialogStored';
import DashboardClient from './DashboardClient';

export default function DashboardShell({ username }: { username: string }) {
  return (
    <GlobalSuiProvider>
      <Header />
      <main>
        <div className="min-h-screen pt-16">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <p className="opacity-70 mb-4">Cập nhật hồ sơ, thêm dự án và chứng chỉ của bạn onchain.</p>
            <DashboardClient username={username} />
          </div>
        </div>
      </main>
      <DialogStored />
    </GlobalSuiProvider>
  );
}


