
import { useState, createContext, useContext } from 'react';
import { toast } from '@/hooks/use-toast';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      isMetaMask?: boolean;
    };
    solana?: {
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      isPhantom?: boolean;
    };
  }
}

interface WalletContextType {
  walletAddress: string | null;
  walletType: 'phantom' | 'metamask' | null;
  isConnected: boolean;
  connectPhantom: () => Promise<void>;
  connectMetaMask: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<'phantom' | 'metamask' | null>(null);

  const connectPhantom = async () => {
    try {
      if (window.solana) {
        const response = await window.solana.connect();
        const address = response.publicKey.toString();
        setWalletAddress(address);
        setWalletType('phantom');
        toast({
          title: "Phantom Wallet Connected",
          description: `Connected: ${address.slice(0, 8)}...`,
        });
      } else {
        toast({
          title: "Phantom Wallet Not Found",
          description: "Please install Phantom wallet extension",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Phantom wallet",
        variant: "destructive",
      });
    }
  };

  const connectMetaMask = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        const address = accounts[0];
        setWalletAddress(address);
        setWalletType('metamask');
        toast({
          title: "MetaMask Connected",
          description: `Connected: ${address.slice(0, 8)}...`,
        });
      } else {
        toast({
          title: "MetaMask Not Found",
          description: "Please install MetaMask extension",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to MetaMask",
        variant: "destructive",
      });
    }
  };

  const disconnect = () => {
    setWalletAddress(null);
    setWalletType(null);
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  return (
    <WalletContext.Provider value={{
      walletAddress,
      walletType,
      isConnected: !!walletAddress,
      connectPhantom,
      connectMetaMask,
      disconnect
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
