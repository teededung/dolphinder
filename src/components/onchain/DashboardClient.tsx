import { GlobalSuiProvider } from '../providers/GlobalSuiProvider';
import { OnchainProfileForm } from './OnchainProfileForm';
import { ProjectForm } from './ProjectForm';
import { CertificateForm } from './CertificateForm';
import { useCurrentAccount } from '@mysten/dapp-kit';
import ConnectBtn from '../common/ConnectBtn';

export default function DashboardClient({ username }: { username: string }) {
  return (
    <GlobalSuiProvider>
      <DashboardInner username={username} />
    </GlobalSuiProvider>
  );
}

function DashboardInner({ username }: { username: string }) {
  const account = useCurrentAccount();
  return (
    <>
      {!account && (
        <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-200">
          <div className="flex items-center justify-between gap-4">
            <p>Vui lòng kết nối ví để lưu dữ liệu on-chain.</p>
            <div className="shrink-0"><ConnectBtn /></div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold mb-4">Update Profile</h2>
          <OnchainProfileForm username={username} />
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold mb-4">Add Project</h2>
          <ProjectForm username={username} />
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Add Certificate</h2>
          <CertificateForm username={username} />
        </div>
      </div>
    </>
  );
}


