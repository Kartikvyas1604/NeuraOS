
import { LucideIcon } from 'lucide-react';

interface DesktopIconProps {
  icon: LucideIcon;
  title: string;
  onClick: () => void;
  delay?: number;
}

export const DesktopIcon = ({ icon: Icon, title, onClick, delay = 0 }: DesktopIconProps) => {
  return (
    <div
      className="flex flex-col items-center cursor-pointer group animate-fade-in hover:scale-105 transition-all duration-200"
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
    >
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 group-hover:border-white/40 transition-all">
          <Icon className="h-8 w-8 text-white group-hover:text-blue-300 transition-colors" />
        </div>
      </div>
      <span className="text-white text-sm mt-2 text-center group-hover:text-blue-300 transition-colors">
        {title}
      </span>
    </div>
  );
};
