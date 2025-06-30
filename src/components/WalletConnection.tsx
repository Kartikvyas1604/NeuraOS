
import { X, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';

interface WalletConnectionProps {
  onClose: () => void;
}

export const WalletConnection = ({ onClose }: WalletConnectionProps) => {
  const { connectPhantom, connectMetaMask, disconnect, isConnected, walletAddress, walletType } = useWallet();

  const handlePhantomConnect = async () => {
    await connectPhantom();
    onClose();
  };

  const handleMetaMaskConnect = async () => {
    await connectMetaMask();
    onClose();
  };

  const handleDisconnect = () => {
    disconnect();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-semibold flex items-center">
            <Wallet className="h-5 w-5 mr-2" />
            Wallet Connection
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {isConnected ? (
          <div className="text-center">
            <div className="text-green-400 mb-4">
              ✓ Connected to {walletType === 'phantom' ? 'Phantom' : 'MetaMask'}
            </div>
            <div className="text-slate-300 text-sm mb-6">
              {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-8)}
            </div>
            <Button
              onClick={handleDisconnect}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
            >
              Disconnect Wallet
            </Button>
          </div>
        ) : (
          <>
            <p className="text-slate-300 text-sm mb-6">
              Connect your wallet to store important files on-chain with enhanced security.
            </p>

            <div className="space-y-4">
              <Button
                onClick={handlePhantomConnect}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                Connect Phantom (Solana)
              </Button>

              <Button
                onClick={handleMetaMaskConnect}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                Connect MetaMask (Ethereum)
              </Button>
            </div>
          </>
        )}

        <p className="text-slate-400 text-xs mt-4 text-center">
          Wallet connection is optional and only required for on-chain file storage.
        </p>
      </div>
    </div>
  );
};
